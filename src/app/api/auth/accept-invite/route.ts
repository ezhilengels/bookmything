import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyInviteToken } from "@/lib/security.server";

/**
 * POST /api/auth/accept-invite
 * Verifies an HMAC-signed invite token and assigns the currently-logged-in
 * user the staff role for the encoded business.
 *
 * Body: { token: string }
 * Returns: { redirect: string } on success, or { error: string } on failure
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { token } = body as { token?: string };

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
  }

  // Verify the HMAC-signed token server-side — safe from tampering
  const businessId = verifyInviteToken(token);
  if (!businessId) {
    return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Failed to assign staff role" }, { status: 500 });
  }

  return NextResponse.json({
    redirect: `/dashboard/staff/${session.user.id}?setup=true`,
  });
}
