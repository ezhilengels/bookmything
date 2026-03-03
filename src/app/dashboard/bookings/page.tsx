"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, bookingStatusColor, bookingStatusLabel, formatCurrency } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Actions available per current status
const ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  new: [
    { label: "Confirm",  next: "confirmed", color: "text-green-600 hover:text-green-800 font-medium" },
    { label: "Cancel",   next: "cancelled",  color: "text-red-500 hover:text-red-700" },
  ],
  confirmed: [
    { label: "Complete", next: "completed",  color: "text-blue-600 hover:text-blue-800 font-medium" },
    { label: "No-show",  next: "no_show",    color: "text-orange-500 hover:text-orange-700" },
    { label: "Cancel",   next: "cancelled",  color: "text-red-500 hover:text-red-700" },
  ],
};

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("business_id").eq("id", session.user.id).single();
      if (!profile?.business_id) { window.location.href = "/onboarding"; return; }

      const { data: biz } = await supabase
        .from("businesses").select("timezone").eq("id", profile.business_id).single();
      setTimezone(biz?.timezone ?? "Asia/Kolkata");

      await fetchBookings("");
    }
    load();
  }, []);

  async function fetchBookings(status: string) {
    setLoading(true);
    const url = status ? `/api/bookings?status=${status}` : "/api/bookings";
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      setBookings(json.data ?? []);
    }
    setLoading(false);
  }

  async function changeFilter(status: string) {
    setStatusFilter(status);
    await fetchBookings(status);
  }

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId + status);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status } : b)
      );
    }
    setUpdating(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">All appointments for your business</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => changeFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border hover:border-blue-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => {
                  const service = b.service as { name: string; price: number } | null;
                  const staffMember = b.staff as { name: string } | null;
                  const customer = b.customer as { name: string; phone: string | null } | null;
                  const actions = ACTIONS[b.status] ?? [];
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{customer?.name ?? "—"}</div>
                        {customer?.phone && <div className="text-gray-400 text-xs mt-0.5">{customer.phone}</div>}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{service?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{staffMember?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{formatDateTime(b.start_time, timezone)}</td>
                      <td className="px-5 py-3 font-medium text-blue-700">
                        {service ? formatCurrency(service.price) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingStatusColor(b.status)}`}>
                          {bookingStatusLabel(b.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {actions.length > 0 ? (
                          <div className="flex items-center gap-3">
                            {actions.map(({ label, next, color }) => (
                              <button
                                key={next}
                                onClick={() => updateStatus(b.id, next)}
                                disabled={updating === b.id + next}
                                className={`text-xs transition-colors disabled:opacity-40 ${color}`}
                              >
                                {updating === b.id + next ? "..." : label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
