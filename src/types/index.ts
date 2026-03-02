// ============================================================
// BookMyThing – Shared TypeScript Types
// ============================================================

export type UserRole = "super_admin" | "business_admin" | "staff" | "customer";
export type BookingStatus = "new" | "confirmed" | "completed" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type NotificationType = "confirmation" | "reminder_24h" | "reminder_1h" | "cancellation" | "new_booking";
export type NotificationChannel = "email" | "whatsapp";

// ─────────────────────────────────────────
// ENTITIES
// ─────────────────────────────────────────
export interface Business {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  timezone: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  business_id: string | null;
  role: UserRole;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  staff_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;  // HH:mm:ss
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active: boolean;
}

export interface StaffLeave {
  id: string;
  staff_id: string;
  date: string; // YYYY-MM-DD
  reason: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  staff_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingLog {
  id: string;
  booking_id: string;
  actor_id: string | null;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  notes: string | null;
  changed_at: string;
}

// ─────────────────────────────────────────
// ENRICHED / JOIN TYPES
// ─────────────────────────────────────────
export interface BookingWithDetails extends Booking {
  service: Pick<Service, "name" | "price"> & Partial<Pick<Service, "id" | "duration_minutes">>;
  staff: Pick<Profile, "name"> & Partial<Pick<Profile, "id" | "avatar_url">>;
  customer: Pick<Profile, "name"> & Partial<Pick<Profile, "id" | "phone">>;
}

export interface StaffWithServices extends Profile {
  staff_services: { service_id: string }[];
  working_hours: WorkingHours[];
}

// ─────────────────────────────────────────
// SLOT ENGINE
// ─────────────────────────────────────────
export interface TimeSlot {
  start: string; // ISO datetime string
  end: string;
  staffId: string;
  staffName: string;
  available: boolean;
}

export interface SlotQuery {
  businessId: string;
  serviceId: string;
  staffId?: string;
  date: string; // YYYY-MM-DD in business timezone
}

// ─────────────────────────────────────────
// DASHBOARD METRICS
// ─────────────────────────────────────────
export interface DashboardMetrics {
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  monthRevenue: number;
  completionRate: number;
  cancellationRate: number;
}

export interface PlatformMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  totalBookings: number;
  totalRevenue: number;
}

// ─────────────────────────────────────────
// API RESPONSE WRAPPERS
// ─────────────────────────────────────────
export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
