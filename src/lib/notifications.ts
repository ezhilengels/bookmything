import { Resend } from "resend";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingWithDetails, Business, NotificationType } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@bookmything.com";

// ─────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────
function formatApptTime(isoTime: string, timezone: string): string {
  const zonedDate = toZonedTime(parseISO(isoTime), timezone);
  return format(zonedDate, "EEEE, MMMM d yyyy 'at' h:mm a zzz");
}

function bookingConfirmationHtml(booking: BookingWithDetails, business: Business): string {
  const time = formatApptTime(booking.start_time, business.timezone);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h1 style="color:#1a1a1a;">${business.name}</h1>
      <h2 style="color:#333;">Booking Confirmed ✅</h2>
      <p>Hi <strong>${booking.customer.name}</strong>,</p>
      <p>Your appointment has been confirmed. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#666;">Service</td><td style="padding:8px;font-weight:bold;">${booking.service.name}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Date & Time</td><td style="padding:8px;font-weight:bold;">${time}</td></tr>
        <tr><td style="padding:8px;color:#666;">Staff</td><td style="padding:8px;font-weight:bold;">${booking.staff.name}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Booking Ref</td><td style="padding:8px;font-family:monospace;">${booking.id.slice(0, 8).toUpperCase()}</td></tr>
      </table>
      <p style="color:#666;font-size:0.9em;">To cancel or reschedule, please do so more than 24 hours before your appointment.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
      <p style="color:#aaa;font-size:0.8em;">BookMyThing · ${business.contact_email}</p>
    </div>
  `;
}

function reminderHtml(booking: BookingWithDetails, business: Business, hoursAhead: 24 | 1): string {
  const time = formatApptTime(booking.start_time, business.timezone);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h1 style="color:#1a1a1a;">${business.name}</h1>
      <h2 style="color:#333;">Reminder: Appointment in ${hoursAhead} hour${hoursAhead > 1 ? "s" : ""} ⏰</h2>
      <p>Hi <strong>${booking.customer.name}</strong>,</p>
      <p>This is a friendly reminder about your upcoming appointment:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#666;">Service</td><td style="padding:8px;font-weight:bold;">${booking.service.name}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Date & Time</td><td style="padding:8px;font-weight:bold;">${time}</td></tr>
        <tr><td style="padding:8px;color:#666;">Staff</td><td style="padding:8px;font-weight:bold;">${booking.staff.name}</td></tr>
      </table>
      <p style="color:#666;font-size:0.9em;">We look forward to seeing you!</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
      <p style="color:#aaa;font-size:0.8em;">BookMyThing · ${business.contact_email}</p>
    </div>
  `;
}

function cancellationHtml(booking: BookingWithDetails, business: Business): string {
  const time = formatApptTime(booking.start_time, business.timezone);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h1 style="color:#1a1a1a;">${business.name}</h1>
      <h2 style="color:#c0392b;">Booking Cancelled</h2>
      <p>Hi <strong>${booking.customer.name}</strong>,</p>
      <p>Your appointment has been cancelled.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#666;">Service</td><td style="padding:8px;">${booking.service.name}</td></tr>
        <tr style="background:#f9f9f9;"><td style="padding:8px;color:#666;">Was scheduled for</td><td style="padding:8px;">${time}</td></tr>
        ${booking.cancellation_reason ? `<tr><td style="padding:8px;color:#666;">Reason</td><td style="padding:8px;">${booking.cancellation_reason}</td></tr>` : ""}
      </table>
      <p style="color:#666;font-size:0.9em;">You can book a new appointment at any time.</p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
      <p style="color:#aaa;font-size:0.8em;">BookMyThing · ${business.contact_email}</p>
    </div>
  `;
}

// ─────────────────────────────────────────
// SEND FUNCTIONS
// ─────────────────────────────────────────
export interface SendNotificationParams {
  type: NotificationType;
  booking: BookingWithDetails;
  business: Business;
  customerEmail: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<boolean> {
  const { type, booking, business, customerEmail } = params;

  let subject = "";
  let html = "";

  switch (type) {
    case "confirmation":
      subject = `Booking Confirmed – ${booking.service.name} at ${business.name}`;
      html = bookingConfirmationHtml(booking, business);
      break;
    case "reminder_24h":
      subject = `Reminder: Your appointment tomorrow at ${business.name}`;
      html = reminderHtml(booking, business, 24);
      break;
    case "reminder_1h":
      subject = `Reminder: Your appointment in 1 hour at ${business.name}`;
      html = reminderHtml(booking, business, 1);
      break;
    case "cancellation":
      subject = `Booking Cancelled – ${booking.service.name} at ${business.name}`;
      html = cancellationHtml(booking, business);
      break;
    default:
      return false;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[notifications] Failed to send ${type}:`, err);
    return false;
  }
}

export async function sendNewBookingAlertToAdmin(
  booking: BookingWithDetails,
  business: Business,
  adminEmail: string
): Promise<void> {
  const time = formatApptTime(booking.start_time, business.timezone);
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Booking: ${booking.service.name} – ${booking.customer.name}`,
    html: `
      <div style="font-family:sans-serif;padding:24px;">
        <h2>New Booking Received</h2>
        <p><strong>Customer:</strong> ${booking.customer.name}</p>
        <p><strong>Service:</strong> ${booking.service.name}</p>
        <p><strong>Staff:</strong> ${booking.staff.name}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}">View Booking</a></p>
      </div>
    `,
  });
}
