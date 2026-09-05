import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoute = createRouteMatcher([
  "/office(.*)",
  "/refunds(.*)",
  "/casework(.*)",
  "/master-file(.*)",
  "/settings(.*)",
]);

const configured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const withClerk = clerkMiddleware(async (auth, request) => {
  if (protectedRoute(request)) await auth.protect();
});

export default function proxy(request: NextRequest) {
  if (!configured) {
    if (protectedRoute(request)) {
      return NextResponse.redirect(new URL("/identity/setup-required", request.url));
    }
    return NextResponse.next();
  }
  return withClerk(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
