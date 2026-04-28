import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/signup", "/privacy", "/terms", "/onboarding"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  console.log(`[PROXY] Path: ${nextUrl.pathname} | LoggedIn: ${isLoggedIn}`);

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/signup";

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return null;
  }

  // Permetti sempre l'onboarding per ora per evitare blocchi in fase di registrazione
  if (nextUrl.pathname === "/onboarding") return null;

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
