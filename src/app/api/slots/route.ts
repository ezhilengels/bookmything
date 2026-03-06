import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateSlots } from "@/lib/slot-engine";
import { slotQuerySchema } from "@/lib/validations/schemas";
import { toZonedTime } from "date-fns-tz";
import { getDay } from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = slotQuerySchema.safeParse({
    businessId: searchParams.get("businessId"),
    serviceId: searchParams.get("serviceId"),
    staffId: searchParams.get("staffId") ?? undefined,
    date: searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, serviceId, staffId, date } = parsed.data;
  const supabase = await createClient();       // anon client – for public data
  const adminSupabase = createServiceClient(); // service client – bypasses RLS for profiles

  // Get business timezone
  const { data: business } = await supabase
    .from("businesses")
    .select("timezone")
    .eq("id", businessId)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Get service duration
  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .single();
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // Determine which day of week the requested date is
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  // Validate the date is a real calendar date (rejects e.g. 2025-02-30)
  if (
    isNaN(dateObj.getTime()) ||
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const dayOfWeek = getDay(dateObj);

  // Get staff with working hours (service client bypasses RLS on profiles)
  let staffQuery = adminSupabase
    .from("profiles")
    .select("id, name, working_hours!inner(*), staff_services!inner(service_id)")
    .eq("business_id", businessId)
    .eq("role", "staff")
    .eq("staff_services.service_id", serviceId)
    .eq("working_hours.day_of_week", dayOfWeek)
    .eq("working_hours.is_active", true);

  if (staffId) staffQuery = staffQuery.eq("id", staffId);

  const { data: staffMembers } = await staffQuery;

  // Check for staff on leave
  const { data: leaves } = await adminSupabase
    .from("staff_leaves")
    .select("staff_id")
    .eq("date", date);
  const staffOnLeave = new Set(leaves?.map((l) => l.staff_id) ?? []);

  // Get existing bookings for the date (service client to see all bookings)
  const dayStart = new Date(year, month - 1, day, 0, 0, 0).toISOString();
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59).toISOString();

  const { data: existingBookings } = await adminSupabase
    .from("bookings")
    .select("staff_id, start_time, end_time")
    .eq("business_id", businessId)
    .in("status", ["new", "confirmed"])
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd);

  // Generate slots for each available staff member
  const allSlots = (staffMembers ?? [])
    .filter((s) => !staffOnLeave.has(s.id))
    .flatMap((staffMember) => {
      const workingHoursArr = staffMember.working_hours as { day_of_week: number; start_time: string; end_time: string; break_start: string | null; break_end: string | null; is_active: boolean }[];
      const workingHours = workingHoursArr?.[0] ?? null;
      const staffBookings = (existingBookings ?? []).filter((b) => b.staff_id === staffMember.id);

      return generateSlots({
        date,
        timezone: business.timezone,
        durationMinutes: service.duration_minutes,
        workingHours,
        existingBookings: staffBookings,
        staffId: staffMember.id,
        staffName: staffMember.name,
      });
    });

  // If multiple staff, only expose available slots (deduplicated by time)
  const slots = staffId
    ? allSlots
    : allSlots.filter((s) => s.available);

  return NextResponse.json({ slots });
}
