import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup", "/privacy", "/terms", "/onboarding"]);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // 1. Early Exit for Onboarding and PA (Public)
  if (pathname === "/onboarding" || pathname.startsWith("/pa")) {
    return null;
  }

  // 2. Auth Routes Redirect
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return null;
  }

  // 3. Protected Routes Check
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?|map)$).*)",
  ],
};
