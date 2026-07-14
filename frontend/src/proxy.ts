import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/api(.*)",
]);

const isDashboardRoute = createRouteMatcher([
  "/(.*)/dashboard(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const url = req.nextUrl.clone();

  if (userId && (url.pathname === '/login' || url.pathname === '/register' || url.pathname === '/')) {
    const role = (sessionClaims?.metadata as Record<string, unknown>)?.role || 'student';
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  if (isDashboardRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const role = (sessionClaims?.metadata as Record<string, unknown>)?.role || 'student';
    const requestedRole = url.pathname.split('/')[1];
    if (requestedRole !== role && requestedRole !== 'api' && requestedRole !== 'uploads') {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }
  }

  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
