"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, Store } from "lucide-react";

export default function WelcomePage() {
  const [loading, setLoading] = useState<"customer" | "business" | null>(null);
  const [userName, setUserName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const name = session?.user?.user_metadata?.name ?? "";
      setUserName(name.split(" ")[0]); // first name only
    });
  }, []);

  async function choose(role: "customer" | "business_admin") {
    setLoading(role === "customer" ? "customer" : "business");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    // Update role + has_chosen_role directly via browser client (works on all networks)
    const { error } = await supabase
      .from("profiles")
      .update({ role, has_chosen_role: true })
      .eq("id", session.user.id);

    if (error) {
      setLoading(null);
      alert("Something went wrong. Please try again.");
      return;
    }

    if (role === "business_admin") {
      window.location.href = "/onboarding";
    } else {
      window.location.href = "/customer/bookings";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">BookMyThing</h1>
          <p className="text-xl font-semibold text-gray-800">
            {userName ? `Welcome, ${userName}! 👋` : "Welcome! 👋"}
          </p>
          <p className="text-gray-500 mt-2">How would you like to use BookMyThing?</p>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Customer card */}
          <button
            onClick={() => choose("customer")}
            disabled={loading !== null}
            className="group bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all text-left disabled:opacity-60"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-500 transition-colors">
              <CalendarDays className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Book a Service</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Browse and book appointments with local businesses — salons, clinics, gyms, and more.
            </p>
            {loading === "customer" && (
              <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Setting up your account…
              </div>
            )}
          </button>

          {/* Business owner card */}
          <button
            onClick={() => choose("business_admin")}
            disabled={loading !== null}
            className="group bg-white rounded-2xl p-8 shadow-sm border-2 border-transparent hover:border-indigo-500 hover:shadow-md transition-all text-left disabled:opacity-60"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-500 transition-colors">
              <Store className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Grow My Business</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              List your business, manage staff, set schedules, and accept bookings online — all in one place.
            </p>
            {loading === "business" && (
              <div className="mt-4 flex items-center gap-2 text-indigo-600 text-sm font-medium">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Setting up your account…
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          You can always switch later from your account settings.
        </p>
      </div>
    </div>
  );
}
