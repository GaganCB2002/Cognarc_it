import { clerkMiddleware } from "@clerk/nextjs/server";

const protectedPaths = [
  "/dashboard",
  "/admin",
  "/student",
  "/hr",
  "/manager",
  "/employee",
  "/trainer",
  "/super-admin",
  "/settings",
  "/profile",
  "/tracking",
  "/tasks",
  "/notes",
  "/calendar",
  "/reports",
  "/analytics",
  "/chat",
  "/career",
  "/curriculum",
  "/trends",
  "/pdf-intelligence",
  "/video-intelligence",
  "/knowledge-vault",
];

export default clerkMiddleware(async (auth, req) => {
  if (protectedPaths.some(p => req.nextUrl.pathname.startsWith(p))) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};
