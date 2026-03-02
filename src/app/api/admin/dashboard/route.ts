import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  const user = _sess?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, business_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["business_admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  if (profile.role === "super_admin") {
    const [bizRes, bookingRes] = await Promise.all([
      supabase.from("businesses").select("id, is_active", { count: "exact" }),
      supabase.from("bookings").select("payment_status", { count: "exact" }),
    ]);

    const totalRevenue = (bookingRes.data ?? []).filter((b) => b.payment_status === "paid").length;

    return NextResponse.json({
      totalBusinesses: bizRes.count ?? 0,
      activeBusinesses: (bizRes.data ?? []).filter((b) => b.is_active).length,
      totalBookings: bookingRes.count ?? 0,
      totalRevenue,
    });
  }

  // Business Admin
  if (!profile.business_id) {
    return NextResponse.json({ error: "Business not linked to profile" }, { status: 400 });
  }

  const { data: monthBookings } = await supabase
    .from("bookings")
    .select("status, payment_status")
    .eq("business_id", profile.business_id)
    .gte("start_time", monthStart)
    .lte("start_time", monthEnd);

  const total = monthBookings?.length ?? 0;
  const completed = (monthBookings ?? []).filter((b) => b.status === "completed").length;
  const cancelled = (monthBookings ?? []).filter((b) => b.status === "cancelled").length;
  const paid = (monthBookings ?? []).filter((b) => b.payment_status === "paid").length;

  return NextResponse.json({
    monthBookings: total,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    paidBookings: paid,
  });
}
