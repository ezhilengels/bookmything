import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const VALID_ROLES = ["customer", "business_admin", "staff"] as const;

const updateRoleSchema = z.object({
  role: z.enum(VALID_ROLES),
  has_chosen_role: z.boolean().optional().default(true),
});

/**
 * PATCH /api/admin/users/[id]
 * Super-admin only: update the role of any user.
 * Only allows setting: customer, business_admin, staff
 * (super_admin role is immutable via this endpoint)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch caller's profile to verify super_admin role server-side
  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (caller?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Prevent accidentally downgrading a super_admin
  const adminSupabase = createServiceClient();
  const { data: target } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", params.id)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "super_admin") {
    return NextResponse.json({ error: "Cannot change role of a super_admin" }, { status: 403 });
  }

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({ role: parsed.data.role, has_chosen_role: parsed.data.has_chosen_role })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
