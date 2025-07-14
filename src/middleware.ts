import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Allow access to login page and static files
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon") ||
    request.nextUrl.pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Check for dashboard auth token in localStorage (via cookie fallback)
  const authCookie = request.cookies.get("dashboard_auth");
  if (authCookie?.value === "1") {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
