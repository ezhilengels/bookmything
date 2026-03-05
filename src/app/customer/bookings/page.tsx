"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, LogOut, Search, MapPin, ChevronRight, Sun, Moon } from "lucide-react";

type Tab = "browse" | "bookings";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  contact_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  distance?: number; // km, computed client-side
}

/** Haversine formula — returns distance in km between two GPS coords */
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export default function CustomerBookingsPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [bookings, setBookings] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBiz, setFilteredBiz] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null); // null = show all
  const [isDarkMode, setIsDarkMode] = useState(false);
  const supabase = createClient();

  const RADIUS_OPTIONS: { label: string; value: number | null }[] = [
    { label: "All", value: null },
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
    { label: "20 km", value: 20 },
    { label: "40 km", value: 40 },
  ];

  // Sync dark mode from localStorage / system preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (saved !== "light" && prefersDark);
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const name = session.user.user_metadata?.name ?? session.user.email ?? "";
      setUserName(name);

      // Request user location and fetch businesses in parallel
      const [bookingsRes, bizRes, userPos] = await Promise.all([
        supabase
          .from("bookings")
          .select("*, service:services(name, price), staff:profiles!bookings_staff_id_fkey(name), business:businesses(name, timezone, slug)")
          .eq("customer_id", session.user.id)
          .order("start_time", { ascending: false }),
        supabase
          .from("businesses")
          .select("id, name, slug, description, address, contact_phone, latitude, longitude")
          .eq("is_active", true)
          .order("name"),
        new Promise<GeolocationPosition | null>((resolve) => {
          if (!navigator.geolocation) { resolve(null); return; }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            () => {
              setLocationError("Enable location to see distances");
              resolve(null);
            },
            { timeout: 8000, maximumAge: 60000 }
          );
        }),
      ]);

      // Cast needed until Supabase types are regenerated after migration 003
      const rawBiz: Business[] = (bizRes.data ?? []) as unknown as Business[];

      // TEMP: hardcoded coords for testing — remove after running migration 003
      rawBiz.forEach(b => {
        if (b.name === "ezhil clicnic") {
          b.latitude = 11.940268327891804;  // ← replace with your actual latitude
          b.longitude = 79.80069733123105; // ← replace with your actual longitude
        }
      });

      // Attach distance if we have user coords and business coords
      let enriched: Business[];
      if (userPos) {
        const { latitude: uLat, longitude: uLon } = userPos.coords;
        enriched = rawBiz.map((b) => {
          if (b.latitude != null && b.longitude != null) {
            return { ...b, distance: haversineKm(uLat, uLon, b.latitude, b.longitude) };
          }
          return b;
        });
        // Sort: businesses with distance first (nearest first), then rest alphabetically
        enriched.sort((a, b) => {
          if (a.distance != null && b.distance != null) return a.distance - b.distance;
          if (a.distance != null) return -1;
          if (b.distance != null) return 1;
          return a.name.localeCompare(b.name);
        });
      } else {
        enriched = rawBiz;
      }

      setBookings(bookingsRes.data ?? []);
      setBusinesses(enriched);
      setFilteredBiz(enriched);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let result = businesses;

    // Apply radius filter (only when user location is available)
    if (radiusKm !== null) {
      result = result.filter((b) =>
        b.distance != null && b.distance <= radiusKm
      );
    }

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
      );
    }

    setFilteredBiz(result);
  }, [search, businesses, radiusKm]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function formatDateTime(dateStr: string, timezone: string) {
    return new Date(dateStr).toLocaleString("en-IN", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" });
  }

  function statusColor(status: string) {
    if (status === "confirmed") return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 dark:border dark:border-blue-600/50";
    if (status === "completed") return "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300 dark:border dark:border-green-600/50";
    if (status === "cancelled") return "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300 dark:border dark:border-red-600/50";
    if (status === "no_show") return "bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300 dark:border dark:border-gray-600/50";
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 dark:border dark:border-amber-600/50";
  }

  function statusLabel(status: string) {
    if (status === "new") return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const upcomingCount = bookings.filter(b =>
    new Date(b.start_time) > new Date() && b.status !== "cancelled"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800/95 backdrop-blur border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-700 dark:text-blue-400 text-lg">BookMyThing</span>
            {userName && (
              <span className="text-sm text-gray-500 dark:text-slate-400 ml-1">Hi, {userName.split(" ")[0]}! 👋</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? "bg-slate-700" : "bg-blue-200"
              }`}
              aria-label="Toggle dark mode"
            >
              <span className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-1"}`}>
                {isDarkMode ? <Moon className="w-3 h-3 text-slate-600" /> : <Sun className="w-3 h-3 text-blue-500" />}
              </span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          <button
            onClick={() => setTab("browse")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "browse"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            Browse &amp; Book
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === "bookings"
                ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
          >
            My Bookings
            {upcomingCount > 0 && (
              <span className="bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
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
            {/* Search + Radius filter */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search businesses…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 dark:text-blue-400 pointer-events-none" />
                <select
                  value={radiusKm ?? "all"}
                  onChange={e => setRadiusKm(e.target.value === "all" ? null : Number(e.target.value))}
                  className="h-full pl-8 pr-7 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 appearance-none cursor-pointer transition-colors"
                >
                  {RADIUS_OPTIONS.map(opt => (
                    <option key={opt.label} value={opt.value ?? "all"}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Location permission nudge */}
            {locationError && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-2.5 mb-4">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {locationError}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Loading businesses…</p>
              </div>
            ) : filteredBiz.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-10 text-center shadow-sm">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-gray-500 dark:text-slate-300 font-medium">No businesses found</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                  {radiusKm !== null
                    ? `No businesses within ${radiusKm} km — try a wider range`
                    : "Try a different search term"}
                </p>
                {radiusKm !== null && (
                  <button
                    onClick={() => setRadiusKm(null)}
                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Show all distances
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBiz.map(biz => (
                  <a
                    key={biz.id}
                    href={`/book/${biz.slug}`}
                    className="flex items-center gap-4 bg-white dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg flex-shrink-0">
                      {biz.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {biz.name}
                        </p>
                        {biz.distance != null && (
                          <span className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            <MapPin className="w-3 h-3" />
                            {formatDistance(biz.distance)}
                          </span>
                        )}
                      </div>
                      {biz.description && (
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5 truncate">{biz.description}</p>
                      )}
                      {biz.address && (
                        <p className="text-gray-400 dark:text-slate-500 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{biz.address}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 flex-shrink-0 transition-colors" />
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
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-7 h-7 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Loading bookings…</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-10 text-center shadow-sm">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-blue-300 dark:text-blue-600" />
                </div>
                <p className="text-gray-500 dark:text-slate-300 font-medium">No bookings yet</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm mt-1 mb-5">Find a business and book your first appointment!</p>
                <button
                  onClick={() => setTab("browse")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
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

                  // Status-based accent strip color
                  const accentColor =
                    b.status === "confirmed" ? "bg-blue-500" :
                    b.status === "completed" ? "bg-emerald-500" :
                    b.status === "cancelled" ? "bg-red-400" :
                    b.status === "no_show" ? "bg-gray-400" :
                    "bg-amber-400";

                  return (
                    <div
                      key={b.id}
                      className={`bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden transition-opacity ${isPast ? "opacity-70" : ""}`}
                    >
                      {/* Accent strip */}
                      <div className={`h-0.5 w-full ${accentColor}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-slate-100">{service?.name}</p>
                            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">{business?.name}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(b.status)}`}>
                            {statusLabel(b.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1.5">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                            {business ? formatDateTime(b.start_time, business.timezone) : b.start_time}
                          </p>
                          {staff?.name && (
                            <p className="text-gray-500 dark:text-slate-500 text-xs">with {staff.name}</p>
                          )}
                          <p className="font-semibold text-gray-900 dark:text-slate-100">₹{service?.price ?? "—"}</p>
                        </div>
                        {canModify && b.status === "confirmed" && (
                          <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                            <a href={`/customer/bookings/${b.id}/reschedule`} className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline">
                              Reschedule
                            </a>
                            <a href={`/customer/bookings/${b.id}/cancel`} className="text-red-500 dark:text-red-400 text-xs font-medium hover:underline">
                              Cancel
                            </a>
                          </div>
                        )}
                        {business && (
                          <a
                            href={`/book/${business.slug}`}
                            className="mt-3 block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Book again →
                          </a>
                        )}
                      </div>
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
