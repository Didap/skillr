import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/login", "/privacy", "/terms", "/cookies", "/onboarding", "/events", "/events/"]);

// "/pa" matches /pa and /pa/..., not /password
const isUnder = (pathname: string, segment: string) => pathname === segment || pathname.startsWith(`${segment}/`);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // 1. Early Exit for Onboarding, PA, Events and the dev-only previews (404 in production)
  if (pathname === "/onboarding" || isUnder(pathname, "/events") || isUnder(pathname, "/pa") || isUnder(pathname, "/dev")) {
    return null;
  }

  // 2. Auth Routes Redirect
  const isAuthRoute = pathname === "/login";
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
    // manifest.webmanifest must stay public: the browser fetches it without a session
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?|map)$).*)",
  ],
};
