import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDateTime, bookingStatusColor, bookingStatusLabel, formatCurrency } from "@/lib/utils";
import type { BookingStatus } from "@/types";

export const metadata = { title: "Bookings" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single();
  if (!profile?.business_id) redirect("/onboarding");

  const { data: business } = await supabase.from("businesses").select("timezone").eq("id", profile.business_id).single();

  let query = supabase
    .from("bookings")
    .select("*, service:services(name,price), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name,phone)")
    .eq("business_id", profile.business_id)
    .order("start_time", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status as BookingStatus);
  }

  const { data: bookings } = await query.limit(50);

  const STATUS_FILTERS: { value: string; label: string }[] = [
    { value: "", label: "All" },
    { value: "new", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h1>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <a
            key={value}
            href={value ? `?status=${value}` : "/dashboard/bookings"}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (searchParams.status ?? "") === value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border hover:border-blue-400"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
            {bookings?.map((b) => {
              const service = b.service as { name: string; price: number } | null;
              const staff = b.staff as { name: string } | null;
              const customer = b.customer as { name: string; phone: string | null } | null;
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium">{customer?.name}</div>
                    {customer?.phone && <div className="text-gray-400 text-xs">{customer.phone}</div>}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{service?.name}</td>
                  <td className="px-5 py-3 text-gray-600">{staff?.name}</td>
                  <td className="px-5 py-3 text-gray-600">{business ? formatDateTime(b.start_time, business.timezone) : b.start_time}</td>
                  <td className="px-5 py-3 font-medium text-blue-700">{service ? formatCurrency(service.price) : "–"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingStatusColor(b.status)}`}>
                      {bookingStatusLabel(b.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <a href={`/dashboard/bookings/${b.id}`} className="text-blue-600 hover:underline text-xs">
                      View
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!bookings?.length && (
          <div className="p-10 text-center text-gray-500">No bookings found.</div>
        )}
      </div>
    </div>
  );
}
