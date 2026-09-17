import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireBillingPermission } from "@/lib/billing/access";
import { createCustomerPortalSession, stripeConfiguration } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalBody = {
  customerId?: string;
  returnPath?: string;
};

export async function POST(request: Request) {
  const access = await requireBillingPermission("billing.manage");
  if ("response" in access) return access.response;

  const configuration = stripeConfiguration();
  if (!configuration.secretKey) {
    return NextResponse.json(
      { error: "STRIPE_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null) as PortalBody | null;
  if (!body || typeof body.customerId !== "string") {
    return NextResponse.json(
      { error: "INVALID_PORTAL_REQUEST" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const session = await createCustomerPortalSession({
      customerId: body.customerId,
      returnPath: body.returnPath,
      correlationId: request.headers.get("x-correlation-id") || randomUUID(),
    });
    return NextResponse.json(
      { url: session.url },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "CUSTOMER_PORTAL_SESSION_FAILED";
    return NextResponse.json(
      { error: code },
      { status: code.startsWith("STRIPE_") ? 502 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
