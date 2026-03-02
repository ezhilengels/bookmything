import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString: string, timezone: string): string {
  const zoned = toZonedTime(parseISO(isoString), timezone);
  return format(zoned, "dd MMM yyyy, h:mm a");
}

export function formatDate(isoString: string, timezone: string): string {
  const zoned = toZonedTime(parseISO(isoString), timezone);
  return format(zoned, "dd MMM yyyy");
}

export function formatTime(isoString: string, timezone: string): string {
  const zoned = toZonedTime(parseISO(isoString), timezone);
  return format(zoned, "h:mm a");
}

export function bookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    new: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No Show",
  };
  return labels[status];
}

export function bookingStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    new: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };
  return colors[status];
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
