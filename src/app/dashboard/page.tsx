import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency, bookingStatusColor, bookingStatusLabel, formatDateTime } from "@/lib/utils";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import type { DashboardMetrics } from "@/types";

export const metadata = { title: "Dashboard" };

async function getDashboardMetrics(businessId: string): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const now = new Date();

  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact" })
      .eq("business_id", businessId)
      .gte("start_time", startOfDay(now).toISOString())
      .lte("start_time", endOfDay(now).toISOString()),
    supabase.from("bookings").select("id", { count: "exact" })
      .eq("business_id", businessId)
      .gte("start_time", startOfWeek(now).toISOString()),
    supabase.from("bookings").select("status, payment_status, service_id")
      .eq("business_id", businessId)
      .gte("start_time", startOfMonth(now).toISOString())
      .lte("start_time", endOfMonth(now).toISOString()),
  ]);

  const monthBookings = monthRes.data ?? [];
  const completed = monthBookings.filter((b) => b.status === "completed").length;
  const cancelled = monthBookings.filter((b) => b.status === "cancelled").length;
  const total = monthBookings.length;

  // Rough revenue calculation (would join with services for real price)
  const monthRevenue = monthBookings.filter((b) => b.payment_status === "paid").length * 500;

  return {
    todayBookings: todayRes.count ?? 0,
    weekBookings: weekRes.count ?? 0,
    monthBookings: total,
    monthRevenue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single();
  if (!profile?.business_id) redirect("/onboarding");

  const metrics = await getDashboardMetrics(profile.business_id);

  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("*, service:services(name), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name)")
    .eq("business_id", profile.business_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: business } = await supabase.from("businesses").select("timezone").eq("id", profile.business_id).single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Bookings", value: metrics.todayBookings },
          { label: "This Week", value: metrics.weekBookings },
          { label: "Monthly Revenue", value: formatCurrency(metrics.monthRevenue) },
          { label: "Completion Rate", value: `${metrics.completionRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Staff</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings?.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium">{(b.customer as { name: string })?.name}</td>
                  <td className="px-5 py-3 text-gray-600">{(b.service as { name: string })?.name}</td>
                  <td className="px-5 py-3 text-gray-600">{(b.staff as { name: string })?.name}</td>
                  <td className="px-5 py-3 text-gray-600">{business ? formatDateTime(b.start_time, business.timezone) : b.start_time}</td>
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
      </div>
    </div>
  );
}
