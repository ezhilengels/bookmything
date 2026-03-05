import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/validations/schemas";
import { addMinutes, parseISO } from "date-fns";
import type { BookingStatus } from "@/types";

const VALID_BOOKING_STATUSES: BookingStatus[] = ["new", "confirmed", "completed", "cancelled", "no_show"];

function isBookingStatus(value: string): value is BookingStatus {
  return (VALID_BOOKING_STATUSES as string[]).includes(value);
}

function extractBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  // Fallback for proxies/platforms where Authorization can be stripped.
  const altHeader = request.headers.get("x-supabase-auth") ?? "";
  if (altHeader.startsWith("Bearer ")) {
    return altHeader.slice(7).trim();
  }
  return altHeader.trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createServiceClient();

  const { data: { session: _sess } } = await supabase.auth.getSession();
  let user = _sess?.user ?? null;
  if (!user) {
    const token = extractBearerToken(request);
    if (token) {
      const { data } = await adminSupabase.auth.getUser(token);
      user = data.user ?? null;
    }
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { service_id, staff_id, start_time, notes } = parsed.data;

  // Use service client for consistent behavior across web-cookie and mobile-bearer auth.
  const { data: service } = await adminSupabase
    .from("services")
    .select("duration_minutes, business_id, price, is_active")
    .eq("id", service_id)
    .single();

  if (!service || !service.is_active) {
    return NextResponse.json({ error: "Service not found or inactive" }, { status: 404 });
  }

  const { data: staffProfile } = await adminSupabase
    .from("profiles")
    .select("business_id, role")
    .eq("id", staff_id)
    .single();

  if (!staffProfile || staffProfile.business_id !== service.business_id) {
    return NextResponse.json({ error: "Invalid staff selection" }, { status: 400 });
  }

  const endTime = addMinutes(parseISO(start_time), service.duration_minutes).toISOString();

  // Check for slot conflicts (belt-and-suspenders beyond the unique index)
  const { data: conflict } = await adminSupabase
    .from("bookings")
    .select("id")
    .eq("staff_id", staff_id)
    .eq("start_time", start_time)
    .in("status", ["new", "confirmed"])
    .single();

  if (conflict) {
    return NextResponse.json({ error: "This slot is no longer available. Please choose another." }, { status: 409 });
  }

  // Create booking
  const { data: booking, error: insertError } = await adminSupabase
    .from("bookings")
    .insert({
      business_id: service.business_id,
      service_id,
      staff_id,
      customer_id: user.id,
      start_time,
      end_time: endTime,
      notes: notes ?? null,
      status: "new",
      payment_status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "This slot was just taken. Please choose another." }, { status: 409 });
    }
    console.error("[bookings POST]", insertError);
    return NextResponse.json({ error: insertError.message ?? "Failed to create booking" }, { status: 500 });
  }

  return NextResponse.json({ data: booking }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session: _sess } } = await supabase.auth.getSession();
  let user = _sess?.user ?? null;
  if (!user) {
    const token = extractBearerToken(request);
    if (token) {
      const adminSupabase = createServiceClient();
      const { data } = await adminSupabase.auth.getUser(token);
      user = data.user ?? null;
    }
  }
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, business_id").eq("id", user.id).single();

  // Use service client so profile joins (customer/staff names) are not blocked by RLS
  const adminSupabase = createServiceClient();
  const statusParam = request.nextUrl.searchParams.get("status");
  const pageParam = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const limitParam = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10), 200);
  const offset = (pageParam - 1) * limitParam;

  let query = adminSupabase
    .from("bookings")
    .select("*, service:services(name,price), staff:profiles!bookings_staff_id_fkey(name), customer:profiles!bookings_customer_id_fkey(name,phone)")
    .order("start_time", { ascending: false })
    .range(offset, offset + limitParam - 1);

  if (profile?.role === "business_admin" && profile.business_id) {
    query = query.eq("business_id", profile.business_id);
  } else if (profile?.role === "customer") {
    query = query.eq("customer_id", user.id);
  } else if (profile?.role === "staff") {
    query = query.eq("staff_id", user.id);
  }

  if (statusParam && isBookingStatus(statusParam)) {
    query = query.eq("status", statusParam);
  }

  const { data: bookings, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });

  return NextResponse.json({
    data: bookings,
    pagination: { page: pageParam, limit: limitParam },
  });
}
