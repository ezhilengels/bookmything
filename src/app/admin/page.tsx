"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, Users, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

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
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 text-sm mt-1">All businesses and activity across BookMyThing</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Businesses", value: metrics.totalBusinesses, icon: Building2, color: "text-blue-600 bg-blue-50" },
          { label: "Active Businesses", value: metrics.activeBusinesses, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Total Users", value: metrics.totalUsers, icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Total Bookings", value: metrics.totalBookings, icon: CalendarDays, color: "text-orange-600 bg-orange-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Businesses Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Businesses</h2>
          <span className="text-sm text-gray-500">{metrics.totalBusinesses} total</span>
        </div>
        {!businesses.length ? (
          <div className="p-10 text-center text-gray-500">No businesses registered yet.</div>
        ) : (
          <>
            <div className="md:hidden p-3 space-y-2">
              {businesses.map((biz) => (
                <div key={biz.id} className="rounded-lg border border-gray-200 shadow-sm p-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-gray-900 leading-tight">{biz.name}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      biz.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {biz.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Link</p>
                      <p className="mt-0.5 font-mono text-gray-700 break-all">/book/{biz.slug}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                      <p className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">Joined</p>
                      <p className="mt-0.5 text-gray-700">{new Date(biz.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <a
                      href={`/book/${biz.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-xs font-medium"
                    >
                      Open →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Booking URL</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{biz.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">/book/{biz.slug}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        biz.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {biz.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`/book/${biz.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs mr-3"
                      >
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
