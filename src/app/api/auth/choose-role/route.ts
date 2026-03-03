import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { role, access_token } = await request.json();

  if (!["customer", "business_admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Get user from the access token
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${access_token}`,
    },
  }).catch(() => null);

  if (!userRes?.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await userRes.json();

  // Update role and mark has_chosen_role = true
  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`,
    {
      method: "PATCH",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ role, has_chosen_role: true }),
    }
  ).catch(() => null);

  if (!updateRes?.ok) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
