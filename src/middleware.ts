import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/staff", "/customer", "/admin", "/onboarding"];
// Routes only accessible when NOT logged in
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() — reads JWT from cookie locally, no network call needed.
  // This works even when the server cannot reach Supabase (e.g. restricted networks).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  const path = request.nextUrl.pathname;

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_ROUTES.some((r) => path.startsWith(r));
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  // Let auth pages handle "already logged in" themselves (client-side)
  // Do NOT redirect here — avoids server-side loops on restricted networks

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/payments/webhook|api/cron).*)",
  ],
};
