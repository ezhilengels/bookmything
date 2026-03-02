import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2, Users, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Super Admin" };

export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/login");

  // Platform metrics
  const [bizRes, usersRes, bookingsRes] = await Promise.all([
    supabase.from("businesses").select("id, name, is_active, created_at, slug"),
    supabase.from("profiles").select("id, role", { count: "exact" }),
    supabase.from("bookings").select("id, status, payment_status", { count: "exact" }),
  ]);

  const businesses = bizRes.data ?? [];
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b) => b.is_active).length;
  const totalUsers = usersRes.count ?? 0;
  const totalBookings = bookingsRes.count ?? 0;
  const paidBookings = (bookingsRes.data ?? []).filter((b) => b.payment_status === "paid").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 text-sm mt-1">All businesses and activity across BookMyThing</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Businesses", value: totalBusinesses, icon: Building2, color: "text-blue-600 bg-blue-50" },
          { label: "Active Businesses", value: activeBusinesses, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Total Users", value: totalUsers, icon: Users, color: "text-purple-600 bg-purple-50" },
          { label: "Total Bookings", value: totalBookings, icon: CalendarDays, color: "text-orange-600 bg-orange-50" },
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
          <span className="text-sm text-gray-500">{totalBusinesses} total</span>
        </div>
        {!businesses.length ? (
          <div className="p-10 text-center text-gray-500">
            No businesses registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <Link
                        href={`/book/${biz.slug}`}
                        target="_blank"
                        className="text-blue-600 hover:underline text-xs mr-3"
                      >
                        View →
                      </Link>
                      <Link
                        href={`/admin/businesses/${biz.id}`}
                        className="text-gray-500 hover:underline text-xs"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
