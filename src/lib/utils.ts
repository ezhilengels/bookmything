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
  const base = "inline-flex items-center justify-center min-w-[90px] text-center";
  const colors: Record<BookingStatus, string> = {
    new:       `${base} bg-yellow-100 text-yellow-800 dark:bg-amber-900/70 dark:text-amber-300 dark:border dark:border-amber-500/60`,
    confirmed: `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300 dark:border dark:border-blue-500/60`,
    completed: `${base} bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300 dark:border dark:border-green-500/60`,
    cancelled: `${base} bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300 dark:border dark:border-red-500/60`,
    no_show:   `${base} bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300 dark:border dark:border-gray-500/60`,
  };
  return colors[status];
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Haversine formula — returns straight-line distance in km between two lat/lng points */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format km distance for display e.g. "2.4 km" or "800 m" */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
