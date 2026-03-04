import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications";
import { safeCompare } from "@/lib/security";
import { addHours, addMinutes, subMinutes } from "date-fns";

// Cron runs every 15 minutes; we look for bookings due in T+24h and T+1h windows
// Each window is ±7 minutes (half the cron interval) to avoid duplicates

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  // Use constant-time comparison to prevent timing attacks on the bearer token
  if (!cronSecret || !authHeader || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
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
    const windowEnd = addMinutes(targetTime, WINDOW_MINUTES).toISOString(); // true ±7 min window

    // Get confirmed bookings in window
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, service:services(name,price), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name,phone), business:businesses(*)")
      .eq("status", "confirmed")
      .gte("start_time", windowStart)
      .lte("start_time", windowEnd);

    if (!bookings || bookings.length === 0) continue;

    // ── Batch: fetch already-sent notification IDs for all bookings at once ──
    const bookingIds = bookings.map((b) => b.id);
    const { data: existingNotifs } = await supabase
      .from("notifications")
      .select("booking_id")
      .in("booking_id", bookingIds)
      .eq("type", type)
      .eq("channel", "email");

    const alreadySentIds = new Set((existingNotifs ?? []).map((n) => n.booking_id));

    // ── Batch: fetch customer emails for all bookings at once ──
    const customerIdSet = new Set(bookings.map((b) => b.customer_id));
    const customerIds = Array.from(customerIdSet);
    const emailMap = new Map<string, string>();
    await Promise.all(
      customerIds.map(async (customerId) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(customerId);
        if (authUser?.user?.email) {
          emailMap.set(customerId, authUser.user.email);
        }
      })
    );

    // ── Process each booking ──
    for (const booking of bookings) {
      if (alreadySentIds.has(booking.id)) {
        results.skipped++;
        continue;
      }

      const business = booking.business as Parameters<typeof sendNotification>[0]["business"];
      const customerEmail = emailMap.get(booking.customer_id);

      if (!customerEmail || !business) {
        results.failed++;
        continue;
      }

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

  return NextResponse.json({ ok: true, ...results });
}
