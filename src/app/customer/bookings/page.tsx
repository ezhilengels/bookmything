"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, LogOut, Search, MapPin, Clock, ChevronRight } from "lucide-react";

type Tab = "browse" | "bookings";

export default function CustomerBookingsPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [bookings, setBookings] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filteredBiz, setFilteredBiz] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const name = session.user.user_metadata?.name ?? session.user.email ?? "";
      setUserName(name);

      const [bookingsRes, bizRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*, service:services(name, price), staff:profiles!bookings_staff_id_fkey(name), business:businesses(name, timezone, slug)")
          .eq("customer_id", session.user.id)
          .order("start_time", { ascending: false }),
        supabase
          .from("businesses")
          .select("id, name, slug, description, address, contact_phone")
          .eq("is_active", true)
          .order("name"),
      ]);

      setBookings(bookingsRes.data ?? []);
      setBusinesses(bizRes.data ?? []);
      setFilteredBiz(bizRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFilteredBiz(businesses); return; }
    const q = search.toLowerCase();
    setFilteredBiz(businesses.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q)
    ));
  }, [search, businesses]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function formatDateTime(dateStr: string, timezone: string) {
    return new Date(dateStr).toLocaleString("en-IN", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" });
  }

  function statusColor(status: string) {
    if (status === "confirmed") return "bg-blue-100 text-blue-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "cancelled") return "bg-red-100 text-red-600";
    return "bg-yellow-100 text-yellow-700";
  }

  function statusLabel(status: string) {
    if (status === "new") return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const upcomingCount = bookings.filter(b =>
    new Date(b.start_time) > new Date() && b.status !== "cancelled"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-blue-700 text-lg">BookMyThing</span>
            {userName && (
              <span className="text-sm text-gray-500 ml-2">Hi, {userName.split(" ")[0]}! 👋</span>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          <button
            onClick={() => setTab("browse")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "browse"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Browse & Book
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === "bookings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            My Bookings
            {upcomingCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {upcomingCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── BROWSE TAB ── */}
        {tab === "browse" && (
          <div>
            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search businesses…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredBiz.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-gray-500 font-medium">No businesses found</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBiz.map(biz => (
                  <a
                    key={biz.id}
                    href={`/book/${biz.slug}`}
                    className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border-2 border-transparent hover:border-blue-500 group"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                      {biz.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {biz.name}
                      </p>
                      {biz.description && (
                        <p className="text-gray-500 text-sm mt-0.5 truncate">{biz.description}</p>
                      )}
                      {biz.address && (
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{biz.address}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No bookings yet</p>
                <p className="text-gray-400 text-sm mt-1 mb-5">Find a business and book your first appointment!</p>
                <button
                  onClick={() => setTab("browse")}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Browse Businesses
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const service = b.service as { name: string; price: number } | null;
                  const staff = b.staff as { name: string } | null;
                  const business = b.business as { name: string; timezone: string; slug: string } | null;
                  const canModify = new Date(b.start_time).getTime() - Date.now() > 24 * 60 * 60 * 1000;
                  const isPast = new Date(b.start_time) < new Date();
                  return (
                    <div
                      key={b.id}
                      className={`bg-white rounded-2xl p-5 shadow-sm ${isPast ? "opacity-70" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{service?.name}</p>
                          <p className="text-blue-600 text-sm font-medium">{business?.name}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1.5">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          {business ? formatDateTime(b.start_time, business.timezone) : b.start_time}
                        </p>
                        {staff?.name && (
                          <p className="text-gray-500 text-xs">with {staff.name}</p>
                        )}
                        <p className="font-semibold text-gray-900">₹{service?.price ?? "—"}</p>
                      </div>
                      {canModify && b.status === "confirmed" && (
                        <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                          <a href={`/customer/bookings/${b.id}/reschedule`} className="text-blue-600 text-xs font-medium hover:underline">
                            Reschedule
                          </a>
                          <a href={`/customer/bookings/${b.id}/cancel`} className="text-red-500 text-xs font-medium hover:underline">
                            Cancel
                          </a>
                        </div>
                      )}
                      {business && (
                        <a
                          href={`/book/${business.slug}`}
                          className="mt-3 block text-xs text-blue-600 hover:underline"
                        >
                          Book again →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
