import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function extractBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const altHeader = request.headers.get("x-supabase-auth") ?? "";
  if (altHeader.startsWith("Bearer ")) {
    return altHeader.slice(7).trim();
  }
  return altHeader.trim();
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const adminSupabase = createServiceClient();

  const { data: { session } } = await supabase.auth.getSession();
  let userId = session?.user?.id ?? null;
  if (!userId) {
    const token = extractBearerToken(request);
    if (token) {
      const { data } = await adminSupabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, business_id").eq("id", userId).single();

  const isAdmin = ["business_admin", "super_admin"].includes(profile?.role ?? "");
  const isStaff = profile?.role === "staff";
  if (!isAdmin && !isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await request.json();
  const allowed = isAdmin
    ? ["confirmed", "completed", "cancelled", "no_show"]
    : ["confirmed", "completed"]; // staff can only confirm or complete

  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify the booking belongs to this business/staff
  const { data: booking } = await adminSupabase
    .from("bookings").select("business_id, staff_id").eq("id", params.id).single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (isAdmin && booking.business_id !== profile?.business_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isStaff && booking.staff_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await adminSupabase
    .from("bookings").update({ status }).eq("id", params.id);

  if (error) return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
