import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Sign in directly via Supabase REST API (no SDK dependency)
  let signInData: any;
  try {
    const signInRes = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!signInRes.ok) {
      const errBody = await signInRes.json();
      return NextResponse.json(
        { error: errBody.error_description || errBody.msg || "Invalid credentials" },
        { status: 401 }
      );
    }

    signInData = await signInRes.json();
  } catch (e: any) {
    return NextResponse.json(
      { error: `Cannot reach auth server: ${e?.message ?? e}` },
      { status: 500 }
    );
  }

  const { access_token, refresh_token, expires_in, user } = signInData;

  // Fetch profile to determine redirect
  let profile: { role: string; business_id: string | null } | null = null;
  try {
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role,business_id&limit=1`,
      {
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${access_token}`,
        },
      }
    );
    if (profileRes.ok) {
      const rows = await profileRes.json();
      profile = rows[0] ?? null;
    }
  } catch (_) {
    // profile stays null — will default to customer route
  }

  // Determine redirect destination
  let redirect = "/customer/bookings";
  if (profile?.role === "super_admin") redirect = "/admin";
  else if (profile?.role === "business_admin")
    redirect = profile.business_id ? "/dashboard" : "/onboarding";
  else if (profile?.role === "staff") redirect = "/staff";

  // Build the response and set Supabase session cookies
  const response = NextResponse.json({ redirect });

  // Extract project ref from URL: https://[ref].supabase.co
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionPayload = JSON.stringify({
    access_token,
    refresh_token,
    expires_in,
    expires_at: Math.floor(Date.now() / 1000) + expires_in,
    token_type: "bearer",
    user,
  });

  const cookieOpts = {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: false,
    maxAge: expires_in,
  };

  // Chunk if payload exceeds cookie size limit (~3800 chars per chunk)
  const CHUNK_SIZE = 3800;
  if (sessionPayload.length <= CHUNK_SIZE) {
    response.cookies.set(cookieName, sessionPayload, cookieOpts);
  } else {
    const chunks = Math.ceil(sessionPayload.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      response.cookies.set(
        `${cookieName}.${i}`,
        sessionPayload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        cookieOpts
      );
    }
    // Also set a marker so the reader knows there are N chunks
    response.cookies.set(`${cookieName}.0`, sessionPayload.slice(0, CHUNK_SIZE), cookieOpts);
  }

  return response;
}
