import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

const MSG91_AUTH_KEY  = process.env.MSG91_AUTH_KEY!;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID!;

// Normalise to 91XXXXXXXXXX (strip +, spaces, dashes)
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // If already starts with 91 and is 12 digits — fine
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  // 10-digit Indian number — prepend 91
  if (digits.length === 10) return `91${digits}`;
  // Otherwise return as-is (international numbers with country code)
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

    if (!rawPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const phone = normalisePhone(rawPhone);

    if (phone.length < 10 || phone.length > 15) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // ── Send OTP via MSG91 ────────────────────────────────────────────────
    if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
      return NextResponse.json(
        { error: "SMS service not configured" },
        { status: 503 }
      );
    }

    const msg91Res = await fetch("https://api.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: MSG91_AUTH_KEY,
      },
      body: JSON.stringify({
        template_id: MSG91_TEMPLATE_ID,
        mobile: phone,
        authkey: MSG91_AUTH_KEY,
      }),
    });

    const msg91Data = await msg91Res.json();

    if (!msg91Res.ok || msg91Data.type === "error") {
      console.error("MSG91 send error:", msg91Data);
      return NextResponse.json(
        { error: msg91Data.message ?? "Failed to send OTP" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, phone });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
