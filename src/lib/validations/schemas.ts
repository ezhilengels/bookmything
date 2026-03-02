import { z } from "zod";

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number with country code (e.g. +919876543210)"),
  token: z.string().length(6, "OTP must be 6 digits").optional(),
});

// ─────────────────────────────────────────
// BUSINESS ONBOARDING
// ─────────────────────────────────────────
export const businessSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  contact_email: z.string().email("Invalid email"),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
});

// ─────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────
export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  duration_minutes: z
    .number()
    .int()
    .min(5, "Minimum duration is 5 minutes")
    .max(480, "Maximum duration is 8 hours"),
  price: z.number().min(0, "Price cannot be negative"),
  is_active: z.boolean().default(true),
});

// ─────────────────────────────────────────
// WORKING HOURS
// ─────────────────────────────────────────
export const workingHoursSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  break_start: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  break_end: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const workingHoursBatchSchema = z.array(workingHoursSchema);

// ─────────────────────────────────────────
// BOOKING
// ─────────────────────────────────────────
export const createBookingSchema = z.object({
  service_id: z.string().uuid("Invalid service"),
  staff_id: z.string().uuid("Invalid staff"),
  start_time: z.string().datetime("Invalid start time"),
  notes: z.string().max(500).optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required").max(200),
});

export const rescheduleBookingSchema = z.object({
  new_start_time: z.string().datetime("Invalid time"),
  staff_id: z.string().uuid().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]),
  notes: z.string().optional(),
});

// ─────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────
export const createPaymentOrderSchema = z.object({
  booking_id: z.string().uuid(),
});

export const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        status: z.string(),
      }),
    }),
  }),
});

// ─────────────────────────────────────────
// SLOT QUERY
// ─────────────────────────────────────────
export const slotQuerySchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

// ─────────────────────────────────────────
// STAFF
// ─────────────────────────────────────────
export const staffLeaveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reason: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;
export type SlotQueryInput = z.infer<typeof slotQuerySchema>;
