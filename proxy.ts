import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { destinationForHost } from "@/lib/subdomains";

const protectedPrefixes = [
  "/office",
  "/operations",
  "/refunds",
  "/casework",
  "/master-file",
  "/settings",
  "/support-console",
  "/learn",
  "/billing",
  "/crm",
] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const configured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

function requestState(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const correlationId = request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  requestHeaders.set("x-correlation-id", correlationId);
  const hostDestination = destinationForHost(request.headers.get("host") ?? "");
  const effectivePath = hostDestination && request.nextUrl.pathname === "/"
    ? hostDestination
    : request.nextUrl.pathname;
  return { requestHeaders, correlationId, hostDestination, effectivePath };
}

const withClerk = clerkMiddleware(
  async (auth, request) => {
    const { requestHeaders, correlationId, hostDestination, effectivePath } = requestState(request);

    if (isProtectedPath(effectivePath)) {
      const identity = await auth();
      if (!identity.userId) {
        const target = new URL("/sign-in", request.url);
        target.searchParams.set("redirect_url", `${request.nextUrl.pathname}${request.nextUrl.search}`);
        const response = NextResponse.redirect(target);
        response.headers.set("x-correlation-id", correlationId);
        return response;
      }
    }

    if (hostDestination && request.nextUrl.pathname === "/") {
      const target = request.nextUrl.clone();
      target.pathname = hostDestination;
      const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
      response.headers.set("x-correlation-id", correlationId);
      response.headers.set("x-ross-platform-route", hostDestination);
      return response;
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-correlation-id", correlationId);
    return response;
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    frontendApiProxy: { enabled: true },
  },
);

export default function proxy(request: NextRequest) {
  if (configured) return withClerk(request, {} as never);

  const { requestHeaders, correlationId, hostDestination, effectivePath } = requestState(request);
  if (isProtectedPath(effectivePath)) {
    const response = NextResponse.redirect(new URL("/identity/setup-required", request.url));
    response.headers.set("x-correlation-id", correlationId);
    return response;
  }

  if (hostDestination && request.nextUrl.pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = hostDestination;
    const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
    response.headers.set("x-correlation-id", correlationId);
    response.headers.set("x-ross-platform-route", hostDestination);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
