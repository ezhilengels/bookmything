"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, bookingStatusColor, bookingStatusLabel, formatDateTime } from "@/lib/utils";
import { Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ today: 0, week: 0, monthRevenue: 0, completionRate: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles").select("business_id").eq("id", session.user.id).single();
      if (!profile?.business_id) { window.location.href = "/onboarding"; return; }

      const bid = profile.business_id;
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [todayRes, weekRes, monthRes, bizRes, bookingsRes] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact" })
          .eq("business_id", bid)
          .gte("start_time", todayStart.toISOString())
          .lte("start_time", todayEnd.toISOString()),
        supabase.from("bookings").select("id", { count: "exact" })
          .eq("business_id", bid)
          .gte("start_time", weekStart.toISOString()),
        supabase.from("bookings")
          .select("status, payment_status, service:services(price)")
          .eq("business_id", bid)
          .gte("start_time", monthStart.toISOString())
          .lte("start_time", monthEnd.toISOString()),
        supabase.from("businesses").select("timezone").eq("id", bid).single(),
        supabase.from("bookings")
          .select("*, service:services(name), customer:profiles!bookings_customer_id_fkey(name)")
          .eq("business_id", bid)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      const monthData = (monthRes.data ?? []) as any[];
      const completed = monthData.filter((b: any) => b.status === "completed").length;
      const revenue = monthData
        .filter((b: any) => b.payment_status === "paid")
        .reduce((sum: number, b: any) => sum + ((b.service as any)?.price ?? 0), 0);

      setMetrics({
        today: todayRes.count ?? 0,
        week: weekRes.count ?? 0,
        monthRevenue: revenue,
        completionRate: monthData.length > 0 ? Math.round((completed / monthData.length) * 100) : 0,
      });
      setTimezone(bizRes.data?.timezone ?? "Asia/Kolkata");
      setRecentBookings(bookingsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statCards = [
    { label: "Today's Bookings", value: String(metrics.today), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "This Week", value: String(metrics.week), icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Monthly Revenue", value: formatCurrency(metrics.monthRevenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Completion Rate", value: `${metrics.completionRate}%`, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Here&apos;s what&apos;s happening with your business</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 dark:text-slate-500 text-sm">No bookings yet. Share your booking link to get started!</p>
          </div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-2">
              {recentBookings.map((b) => (
                <div key={b.id} className="rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-3 bg-white dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-slate-100 min-w-0 break-words">{(b.customer as any)?.name ?? "—"}</p>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${bookingStatusColor(b.status)}`}>
                      {bookingStatusLabel(b.status)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 dark:bg-slate-700 px-2.5 py-2 min-w-0">
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Service</p>
                      <p className="mt-0.5 text-gray-700 dark:text-slate-200 truncate">{(b.service as any)?.name ?? "—"}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-slate-700 px-2.5 py-2">
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Date & Time</p>
                      <p className="mt-0.5 text-gray-700 dark:text-slate-200">{formatDateTime(b.start_time, timezone)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-slate-300 text-xs uppercase bg-gray-50 dark:bg-slate-700">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-slate-100">{(b.customer as any)?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-300">{(b.service as any)?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-slate-300">{formatDateTime(b.start_time, timezone)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingStatusColor(b.status)}`}>
                        {bookingStatusLabel(b.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
