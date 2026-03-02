import { addMinutes, format, parseISO, setHours, setMinutes, isBefore, isAfter, isEqual } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { TimeSlot } from "@/types";

const BUFFER_MINUTES = 10;

interface SlotEngineParams {
  date: string;           // YYYY-MM-DD in business timezone
  timezone: string;       // e.g., "Asia/Kolkata"
  durationMinutes: number;
  workingHours: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    break_start: string | null;
    break_end: string | null;
    is_active: boolean;
  } | null;
  existingBookings: { start_time: string; end_time: string }[];
  staffId: string;
  staffName: string;
}

function timeStringToDate(baseDate: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function generateSlots(params: SlotEngineParams): TimeSlot[] {
  const { date, timezone, durationMinutes, workingHours, existingBookings, staffId, staffName } = params;

  if (!workingHours || !workingHours.is_active) return [];

  // Parse the calendar date in the business timezone
  const [year, month, day] = date.split("-").map(Number);
  const baseDateInTz = new Date(year, month - 1, day);

  const workStart = timeStringToDate(baseDateInTz, workingHours.start_time);
  const workEnd = timeStringToDate(baseDateInTz, workingHours.end_time);

  const breakStart = workingHours.break_start
    ? timeStringToDate(baseDateInTz, workingHours.break_start)
    : null;
  const breakEnd = workingHours.break_end
    ? timeStringToDate(baseDateInTz, workingHours.break_end)
    : null;

  // Convert existing bookings to local date objects for comparison
  const bookedRanges = existingBookings.map((b) => ({
    start: toZonedTime(parseISO(b.start_time), timezone),
    end: toZonedTime(parseISO(b.end_time), timezone),
  }));

  const slots: TimeSlot[] = [];
  let cursor = new Date(workStart);

  while (true) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    const slotEndWithBuffer = addMinutes(slotEnd, BUFFER_MINUTES);

    // Stop if slot would exceed working hours
    if (isAfter(slotEnd, workEnd)) break;

    // Check if slot overlaps with break
    const overlapsBreak =
      breakStart && breakEnd
        ? isBefore(cursor, breakEnd) && isAfter(slotEnd, breakStart)
        : false;

    // Check if slot overlaps with any existing booking (+ buffer)
    const overlapsBooking = bookedRanges.some(
      (b) => isBefore(cursor, addMinutes(b.end, BUFFER_MINUTES)) && isAfter(slotEnd, b.start)
    );

    const available = !overlapsBreak && !overlapsBooking;

    // Convert local time back to UTC ISO for storage
    const startUtc = fromZonedTime(cursor, timezone).toISOString();
    const endUtc = fromZonedTime(slotEnd, timezone).toISOString();

    slots.push({
      start: startUtc,
      end: endUtc,
      staffId,
      staffName,
      available,
    });

    // Advance cursor by duration + buffer
    cursor = addMinutes(cursor, durationMinutes + BUFFER_MINUTES);
  }

  return slots;
}

export function isWithin24Hours(appointmentTime: string): boolean {
  const now = new Date();
  const appt = parseISO(appointmentTime);
  const diffMs = appt.getTime() - now.getTime();
  return diffMs < 24 * 60 * 60 * 1000;
}
