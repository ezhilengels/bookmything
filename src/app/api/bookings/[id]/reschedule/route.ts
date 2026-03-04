import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { rescheduleBookingSchema } from "@/lib/validations/schemas";
import { isWithin24Hours } from "@/lib/slot-engine";
import { addMinutes, parseISO } from "date-fns";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = rescheduleBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, service:services(duration_minutes)")
    .eq("id", params.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role, business_id").eq("id", user.id).single();
  const isAdmin = ["business_admin", "super_admin"].includes(profile?.role ?? "");

  if (!isAdmin) {
    if (booking.customer_id !== user.id) return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    if (isWithin24Hours(booking.start_time)) {
      return NextResponse.json({
        error: "Rescheduling is not allowed within 24 hours of the appointment."
      }, { status: 422 });
    }
  } else if (profile?.role === "business_admin") {
    // Business admins can only reschedule bookings for their own business
    if (booking.business_id !== profile.business_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // If changing staff, validate the new staff belongs to the same business as the booking
  if (parsed.data.staff_id) {
    const adminSupabase = createServiceClient();
    const { data: newStaff } = await adminSupabase
      .from("profiles")
      .select("business_id, role")
      .eq("id", parsed.data.staff_id)
      .single();

    if (!newStaff || newStaff.role !== "staff" || newStaff.business_id !== booking.business_id) {
      return NextResponse.json({ error: "Invalid staff selection for this booking" }, { status: 400 });
    }
  }

  const service = booking.service as { duration_minutes: number } | null;
  const duration = service?.duration_minutes ?? 60;
  const newEnd = addMinutes(parseISO(parsed.data.new_start_time), duration).toISOString();

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      start_time: parsed.data.new_start_time,
      end_time: newEnd,
      ...(parsed.data.staff_id ? { staff_id: parsed.data.staff_id } : {}),
    })
    .eq("id", params.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "New slot is already taken. Please try another." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to reschedule" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
