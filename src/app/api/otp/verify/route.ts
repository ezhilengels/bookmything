import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY!;

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function extractBearerToken(request: NextRequest): string {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return "";
}

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate ──────────────────────────────────────────────────────
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

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate input ────────────────────────────────────────────────────
    const body = await request.json();
    const rawPhone = (body.phone ?? "").toString().trim();
    const otp = (body.otp ?? "").toString().trim();

    if (!rawPhone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    if (!/^\d{4,6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 });
    }

    const phone = normalisePhone(rawPhone);

    // ── Verify OTP via MSG91 ──────────────────────────────────────────────
    if (!MSG91_AUTH_KEY) {
      return NextResponse.json(
        { error: "SMS service not configured" },
        { status: 503 }
      );
    }

    const verifyUrl = new URL("https://api.msg91.com/api/v5/otp/verify");
    verifyUrl.searchParams.set("authkey", MSG91_AUTH_KEY);
    verifyUrl.searchParams.set("mobile", phone);
    verifyUrl.searchParams.set("otp", otp);

    const msg91Res = await fetch(verifyUrl.toString(), { method: "GET" });
    const msg91Data = await msg91Res.json();

    if (msg91Data.type === "error" || msg91Data.message === "OTP not match") {
      return NextResponse.json(
        { error: "Incorrect OTP. Please try again." },
        { status: 422 }
      );
    }

    if (msg91Data.type !== "success") {
      console.error("MSG91 verify error:", msg91Data);
      return NextResponse.json(
        { error: msg91Data.message ?? "Verification failed" },
        { status: 502 }
      );
    }

    // ── Mark phone as verified in profile ─────────────────────────────────
    // Strip country code for storage (keep original format user entered)
    const phoneForStorage = phone.startsWith("91") && phone.length === 12
      ? phone.slice(2)   // store as 10-digit
      : phone;

    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        phone: phoneForStorage,
        phone_verified: true,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, phone: phoneForStorage });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
