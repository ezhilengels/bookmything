"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleStaffInvite(supabase: ReturnType<typeof createClient>) {
      // Invite param is embedded in the URL (most reliable) or falls back to sessionStorage
      const urlParams = new URLSearchParams(window.location.search);
      const inviteEncoded = urlParams.get("invite") || sessionStorage.getItem("staff_invite");
      sessionStorage.removeItem("staff_invite");

      if (!inviteEncoded) {
        // No invite — normal flow, go to welcome screen
        window.location.href = "/welcome";
        return;
      }

      try {
        const businessId = atob(inviteEncoded);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { window.location.href = "/welcome"; return; }

        // Assign staff role + business to this user's profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            role: "staff",
            business_id: businessId,
            has_chosen_role: true,
          })
          .eq("id", session.user.id);

        if (updateError) {
          console.error("Failed to assign staff role:", updateError);
          window.location.href = "/welcome";
          return;
        }

        // First-time setup: send staff to their own schedule page
        window.location.href = `/dashboard/staff/${session.user.id}?setup=true`;
      } catch {
        window.location.href = "/welcome";
      }
    }

    async function handleConfirm() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get("token_hash");
      const type = params.get("type") as "email" | "signup" | "recovery" | null;

      if (token_hash && type) {
        // Password recovery flow
        if (type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });
          if (error) {
            setError("Reset link is invalid or has expired. Please request a new one.");
            return;
          }
          // Redirect to reset password page
          window.location.href = "/reset-password";
          return;
        }

        // Email confirmation flow (signup)
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type === "signup" ? "signup" : "email",
        });

        if (error) {
          setError("Confirmation link is invalid or has expired. Please register again.");
          return;
        }

        // Check for staff invite stored before signup
        await handleStaffInvite(supabase);
        return;
      }

      // Fallback: PKCE code flow
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("Confirmation failed. Please try again.");
          return;
        }
        // Check if this is a recovery (password reset) code
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.aud === "authenticated" && type === "recovery") {
          window.location.href = "/reset-password";
          return;
        }
        await handleStaffInvite(supabase);
        return;
      }

      setError("Invalid confirmation link. Please register again.");
    }

    handleConfirm();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Confirmation Failed</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/register" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            Register Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Verifying your email…</p>
        <p className="text-gray-400 text-sm mt-1">You'll be redirected shortly</p>
      </div>
    </div>
  );
}
