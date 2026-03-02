import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDateTime, bookingStatusColor, bookingStatusLabel, formatCurrency } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "My Bookings" };

export default async function CustomerBookingsPage() {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) redirect("/login");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, service:services(name, price), staff:profiles!bookings_staff_id_fkey(name), business:businesses(name, timezone, slug)")
    .eq("customer_id", user.id)
    .order("start_time", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

        {!bookings?.length ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">You have no bookings yet.</p>
            <a href="/" className="text-blue-600 hover:underline text-sm">Browse services →</a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const service = b.service as { name: string; price: number } | null;
              const staff = b.staff as { name: string } | null;
              const business = b.business as { name: string; timezone: string; slug: string } | null;
              const canModify = new Date(b.start_time).getTime() - Date.now() > 24 * 60 * 60 * 1000;
              return (
                <div key={b.id} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{service?.name}</p>
                      <p className="text-gray-500 text-sm">{business?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingStatusColor(b.status)}`}>
                      {bookingStatusLabel(b.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {business ? formatDateTime(b.start_time, business.timezone) : b.start_time}</p>
                    <p>👤 {staff?.name}</p>
                    <p>💰 {service ? formatCurrency(service.price) : "–"}</p>
                  </div>
                  {canModify && b.status === "confirmed" && (
                    <div className="flex gap-3 mt-4">
                      <a
                        href={`/customer/bookings/${b.id}/reschedule`}
                        className="text-blue-600 text-xs hover:underline"
                      >
                        Reschedule
                      </a>
                      <a
                        href={`/customer/bookings/${b.id}/cancel`}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Cancel
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
