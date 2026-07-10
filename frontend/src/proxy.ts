import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/(dashboard)(.*)",
  "/admin(.*)",
  "/student(.*)",
  "/hr(.*)",
  "/manager(.*)",
  "/employee(.*)",
  "/trainer(.*)",
  "/super-admin(.*)",
  "/dashboard",
  "/settings(.*)",
  "/profile(.*)",
  "/tracking(.*)",
  "/tasks(.*)",
  "/notes(.*)",
  "/calendar(.*)",
  "/reports(.*)",
  "/analytics(.*)",
  "/ai-assistant(.*)",
  "/chat(.*)",
  "/career(.*)",
  "/curriculum(.*)",
  "/trends(.*)",
  "/pdf-intelligence(.*)",
  "/video-intelligence(.*)",
  "/knowledge-vault(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};
