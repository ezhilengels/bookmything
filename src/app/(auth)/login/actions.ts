"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function signInAction(email: string, password: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, business_id")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "super_admin") return { redirect: "/admin" };
  if (profile?.role === "business_admin")
    return { redirect: profile.business_id ? "/dashboard" : "/onboarding" };
  if (profile?.role === "staff") return { redirect: "/staff" };
  return { redirect: "/customer/bookings" };
}
