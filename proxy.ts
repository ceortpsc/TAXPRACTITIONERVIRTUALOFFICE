import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { destinationForHost } from "@/lib/subdomains";

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
  const requestHeaders = new Headers(request.headers);
  const correlationId = request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  requestHeaders.set("x-correlation-id", correlationId);
  const hostDestination = destinationForHost(request.headers.get("host") ?? "");
  if (hostDestination && request.nextUrl.pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = hostDestination;
    const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
    response.headers.set("x-correlation-id", correlationId);
    response.headers.set("x-ross-platform-route", hostDestination);
    return response;
  }

  if (!configured) {
    if (protectedRoute(request)) {
      return NextResponse.redirect(new URL("/identity/setup-required", request.url));
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-correlation-id", correlationId);
    return response;
  }
  return withClerk(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
