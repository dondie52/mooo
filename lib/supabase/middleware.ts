import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing at runtime, fall through rather than crash the request.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
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

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Stale/corrupt session cookie — treat as unauthenticated.
    user = null;
  }

  const previewAuth =
    process.env.NEXT_PUBLIC_DEV_PREVIEW_AUTH === "true" &&
    request.cookies.get("lmhts_dev_auth")?.value === "1";

  const isAuthed = Boolean(user) || previewAuth;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicRoute = pathname === "/" || isAuthRoute;

  // Redirect unauthenticated users to login
  if (!isAuthed && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthed && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Preview cookie is not a real session — never allow /admin
  if (previewAuth && !user && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user) {
    // maybeSingle() returns null if 0 rows rather than throwing.
    // Wrap in try/catch in case the request itself fails (network, RLS edge cases).
    let role: string | undefined;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role = profile?.role;
    } catch {
      role = undefined;
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Vet cannot create animals
    if (pathname === "/animals/new" && role === "vet") {
      const url = request.nextUrl.clone();
      url.pathname = "/animals";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
