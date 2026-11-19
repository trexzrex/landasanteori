import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readMaintenanceState } from "@/lib/maintenance";
import { getMaintenanceAccess, isMaintenanceProtectedPath } from "@/lib/maintenance-policy";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect responses must retain cookies refreshed during the session check.
  const redirect = (path: string) => {
    const target = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    target.headers.set("Cache-Control", "no-store, private");
    return target;
  };
  const AUTH_ROUTES = ["/login", "/verify"];

  const isProtected = isMaintenanceProtectedPath(pathname);
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if ((isProtected || pathname === "/maintenance") && !user) {
    return redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  if (user && (isProtected || pathname === "/maintenance")) {
    const [{ data: accessProfile }, state] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      readMaintenanceState(supabase),
    ]);
    const access = getMaintenanceAccess(state, accessProfile?.role);
    if (access === "blocked" && pathname !== "/maintenance") return redirect("/maintenance");
    if (access !== "blocked" && pathname === "/maintenance") return redirect("/dashboard");
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && isProtected && pathname !== "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded, username, password_set")
      .eq("id", user.id)
      .single();

    if (profile && (!profile.onboarded || !profile.username || !profile.password_set)) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  if (user && pathname === "/onboarding") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded, username, password_set")
      .eq("id", user.id)
      .single();

    if (profile?.onboarded && profile.username && profile.password_set) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname === "/admin" || pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}
