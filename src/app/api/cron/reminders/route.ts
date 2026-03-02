import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { addHours, subMinutes } from "date-fns";

// Cron runs every 15 minutes; we look for bookings due in T+24h and T+1h windows
// Each window is ±7 minutes (half the cron interval) to avoid duplicates

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const WINDOW_MINUTES = 7;

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const { type, hoursAhead } of [
    { type: "reminder_24h" as const, hoursAhead: 24 },
    { type: "reminder_1h" as const, hoursAhead: 1 },
  ]) {
    const targetTime = addHours(now, hoursAhead);
    const windowStart = subMinutes(targetTime, WINDOW_MINUTES).toISOString();
    const windowEnd = addHours(targetTime, 0).toISOString(); // +0 offset, just the window end

    // Get confirmed bookings in window
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, service:services(name,price), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name,phone), business:businesses(*)")
      .eq("status", "confirmed")
      .gte("start_time", windowStart)
      .lte("start_time", windowEnd);

    for (const booking of bookings ?? []) {
      // Check if already sent
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("type", type)
        .eq("channel", "email")
        .single();

      if (existing) { results.skipped++; continue; }

      const business = booking.business as Parameters<typeof sendNotification>[0]["business"];

      // Get customer email
      const { data: authUser } = await supabase.auth.admin.getUserById(booking.customer_id);
      const customerEmail = authUser?.user?.email;

      if (!customerEmail || !business) { results.failed++; continue; }

      const sent = await sendNotification({
        type,
        booking: booking as Parameters<typeof sendNotification>[0]["booking"],
        business,
        customerEmail,
      });

      // Log notification
      await supabase.from("notifications").insert({
        booking_id: booking.id,
        type,
        channel: "email",
        status: sent ? "sent" : "failed",
        sent_at: sent ? new Date().toISOString() : null,
      });

      if (sent) results.sent++; else results.failed++;
    }
  }

  console.log(`[cron/reminders]`, results);
  return NextResponse.json({ ok: true, ...results });
}
