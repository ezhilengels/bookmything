import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify caller is a business_admin
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await supabase
    .from("profiles")
    .select("role, business_id")
    .eq("id", session.user.id)
    .single();

  if (caller?.role !== "business_admin" || !caller.business_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const adminSupabase = createServiceClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Create the auth user via Supabase Admin API (no email confirmation needed)
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // skip email confirmation
      user_metadata: { name },
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    return NextResponse.json(
      { error: createData.msg || createData.message || "Failed to create user" },
      { status: 400 }
    );
  }

  const newUserId = createData.id;

  // Assign staff role + link to this business
  const { error: profileErr } = await adminSupabase
    .from("profiles")
    .update({
      role: "staff",
      business_id: caller.business_id,
      has_chosen_role: true,
      name,
    })
    .eq("id", newUserId);

  if (profileErr) {
    return NextResponse.json({ error: "User created but profile update failed: " + profileErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, staffId: newUserId });
}
