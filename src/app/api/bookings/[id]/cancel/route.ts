import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelBookingSchema } from "@/lib/validations/schemas";
import { isWithin24Hours } from "@/lib/slot-engine";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = cancelBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, business:businesses(contact_email)")
    .eq("id", params.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role, business_id").eq("id", user.id).single();

  // Enforce 24h rule for customers; enforce business scope for business admins
  const isAdmin = ["business_admin", "super_admin"].includes(profile?.role ?? "");
  if (!isAdmin) {
    if (booking.customer_id !== user.id) {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }
    if (isWithin24Hours(booking.start_time)) {
      return NextResponse.json({
        error: "Cancellations are not allowed within 24 hours of the appointment."
      }, { status: 422 });
    }
  } else if (profile?.role === "business_admin") {
    // Business admins can only cancel bookings that belong to their own business
    if (booking.business_id !== profile.business_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_by: user.id,
      cancellation_reason: parsed.data.reason,
    })
    .eq("id", params.id);

  if (updateError) return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });

  return NextResponse.json({ data: { success: true } });
}
