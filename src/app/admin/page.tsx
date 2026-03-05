"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Users, CalendarDays, TrendingUp, LayoutDashboard } from "lucide-react";

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalBusinesses: 0, activeBusinesses: 0, totalUsers: 0, totalBookings: 0 });
  const [businesses, setBusinesses] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const [bizRes, usersRes, bookingsRes] = await Promise.all([
        supabase.from("businesses").select("id, name, is_active, created_at, slug").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("bookings").select("id", { count: "exact" }),
      ]);
      const bizData = bizRes.data ?? [];
      setBusinesses(bizData);
      setMetrics({
        totalBusinesses: bizData.length,
        activeBusinesses: bizData.filter(b => b.is_active).length,
        totalUsers: usersRes.count ?? 0,
        totalBookings: bookingsRes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-slate-500">Loading platform data…</p>
    </div>
  );

  const METRICS = [
    { label: "Total Businesses", value: metrics.totalBusinesses, icon: Building2,   light: "bg-blue-50 text-blue-600",    dark: "dark:bg-blue-900/40 dark:text-blue-400" },
    { label: "Active Businesses", value: metrics.activeBusinesses, icon: TrendingUp, light: "bg-emerald-50 text-emerald-600", dark: "dark:bg-emerald-900/40 dark:text-emerald-400" },
    { label: "Total Users",       value: metrics.totalUsers,       icon: Users,       light: "bg-violet-50 text-violet-600",  dark: "dark:bg-violet-900/40 dark:text-violet-400" },
    { label: "Total Bookings",    value: metrics.totalBookings,    icon: CalendarDays, light: "bg-orange-50 text-orange-600", dark: "dark:bg-orange-900/40 dark:text-orange-400" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
          <LayoutDashboard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Platform Overview</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">All businesses and activity across BookMyThing</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {METRICS.map(({ label, value, icon: Icon, light, dark }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${light} ${dark}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Businesses */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">All Businesses</h2>
          <span className="text-sm text-gray-400 dark:text-slate-500">{metrics.totalBusinesses} total</span>
        </div>

        {!businesses.length ? (
          <div className="p-10 text-center text-gray-400 dark:text-slate-500">No businesses registered yet.</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden p-3 space-y-3">
              {businesses.map((biz) => (
                <div key={biz.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden">
                  <div className={`h-0.5 w-full ${biz.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">{biz.name}</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        biz.is_active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border dark:border-emerald-600/50"
                          : "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300 dark:border dark:border-red-600/50"
                      }`}>
                        {biz.is_active ? "Active" : "Suspended"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                        <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Link</p>
                        <p className="mt-0.5 font-mono text-gray-700 dark:text-slate-300 break-all">/book/{biz.slug}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-slate-700/60 px-2.5 py-2">
                        <p className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-500 uppercase">Joined</p>
                        <p className="mt-0.5 text-gray-700 dark:text-slate-300">{new Date(biz.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                      <a href={`/book/${biz.slug}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                        Open booking page →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Booking URL</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-slate-100">{biz.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded">/book/{biz.slug}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          biz.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border dark:border-emerald-600/50"
                            : "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300 dark:border dark:border-red-600/50"
                        }`}>
                          {biz.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-slate-500">
                        {new Date(biz.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <a href={`/book/${biz.slug}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                          View →
                        </a>
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
