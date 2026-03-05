"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, bookingStatusColor, bookingStatusLabel, formatCurrency } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

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
    { label: "Confirm",  next: "confirmed", color: "text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold" },
    { label: "Cancel",   next: "cancelled",  color: "text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" },
  ],
  confirmed: [
    { label: "Complete", next: "completed",  color: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold" },
    { label: "No-show",  next: "no_show",    color: "text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300" },
    { label: "Cancel",   next: "cancelled",  color: "text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" },
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
      {/* Page Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 shrink-0">
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">All appointments for your business</p>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => changeFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              statusFilter === value
                ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-gray-400 dark:text-slate-500 font-medium">No bookings found</p>
            <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Try changing the filter above</p>
          </div>
        ) : (
          <>
            {/* ── Mobile cards ── */}
            <div className="md:hidden p-3 space-y-3">
              {bookings.map((b) => {
                const service = b.service as { name: string; price: number } | null;
                const staffMember = b.staff as { name: string } | null;
                const customer = b.customer as { name: string; phone: string | null } | null;
                const actions = ACTIONS[b.status] ?? [];
                return (
                  <div
                    key={b.id}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden"
                  >
                    {/* Card top accent strip per status */}
                    <div className={`h-0.5 w-full ${
                      b.status === "new"       ? "bg-amber-400" :
                      b.status === "confirmed" ? "bg-blue-500"  :
                      b.status === "completed" ? "bg-emerald-500" :
                      b.status === "cancelled" ? "bg-red-500"   : "bg-gray-400"
                    }`} />

                    <div className="p-3">
                      {/* Customer + status row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-slate-100 break-words">
                            {customer?.name ?? "—"}
                          </p>
                          {customer?.phone && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{customer.phone}</p>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${bookingStatusColor(b.status)}`}>
                          {bookingStatusLabel(b.status)}
                        </span>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Service</p>
                          <p className="mt-0.5 text-gray-800 dark:text-slate-200 font-medium truncate">{service?.name ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Staff</p>
                          <p className="mt-0.5 text-gray-800 dark:text-slate-200 truncate">{staffMember?.name ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Date & Time</p>
                          <p className="mt-0.5 text-gray-800 dark:text-slate-200">{formatDateTime(b.start_time, timezone)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                          <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Amount</p>
                          <p className="mt-0.5 font-bold text-blue-600 dark:text-blue-400">
                            {service ? formatCurrency(service.price) : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {actions.length > 0 && (
                        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100 dark:border-slate-700">
                          {actions.map(({ label, next, color }) => (
                            <button
                              key={next}
                              onClick={() => updateStatus(b.id, next)}
                              disabled={updating === b.id + next}
                              className={`text-xs transition-all disabled:opacity-40 ${color}`}
                            >
                              {updating === b.id + next ? "…" : label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Staff</th>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {bookings.map((b) => {
                    const service = b.service as { name: string; price: number } | null;
                    const staffMember = b.staff as { name: string } | null;
                    const customer = b.customer as { name: string; phone: string | null } | null;
                    const actions = ACTIONS[b.status] ?? [];
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-gray-900 dark:text-slate-100">{customer?.name ?? "—"}</div>
                          {customer?.phone && (
                            <div className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">{customer.phone}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">{service?.name ?? "—"}</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">{staffMember?.name ?? "—"}</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-slate-300">{formatDateTime(b.start_time, timezone)}</td>
                        <td className="px-5 py-3.5 font-bold text-blue-600 dark:text-blue-400">
                          {service ? formatCurrency(service.price) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bookingStatusColor(b.status)}`}>
                            {bookingStatusLabel(b.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {actions.length > 0 ? (
                            <div className="flex items-center gap-3">
                              {actions.map(({ label, next, color }) => (
                                <button
                                  key={next}
                                  onClick={() => updateStatus(b.id, next)}
                                  disabled={updating === b.id + next}
                                  className={`text-xs transition-all disabled:opacity-40 ${color}`}
                                >
                                  {updating === b.id + next ? "…" : label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
