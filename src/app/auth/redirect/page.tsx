"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthRedirectPage() {
  useEffect(() => {
    async function doRedirect() {
      const supabase = createClient();

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, business_id, has_chosen_role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        window.location.href = "/customer/bookings";
        return;
      }

      // New user — send to welcome screen
      if (!profile.has_chosen_role) {
        window.location.href = "/welcome";
        return;
      }

      switch (profile.role) {
        case "super_admin":
          window.location.href = "/admin";
          break;
        case "business_admin":
          window.location.href = profile.business_id ? "/dashboard" : "/onboarding";
          break;
        case "staff":
          window.location.href = `/dashboard/staff/${user.id}`;
          break;
        case "customer":
        default:
          window.location.href = "/customer/bookings";
          break;
      }
    }

    doRedirect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Redirecting…</p>
      </div>
    </div>
  );
}
