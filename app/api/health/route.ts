import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );

  return NextResponse.json({
    status: "ok",
    service: "tax-practitioner-virtual-office",
    checks: {
      application: "ready",
      database: process.env.DATABASE_URL ? "configured" : "not_configured",
      identity: clerkConfigured ? "configured" : "not_configured",
      irsApi: process.env.IRS_CLIENT_ID ? "configured" : "not_configured",
      stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured",
      workerAdapter: process.env.WORKER_ADAPTER_URL && process.env.WORKER_ADAPTER_TOKEN
        ? "configured"
        : "not_configured",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
