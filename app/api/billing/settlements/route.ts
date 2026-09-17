import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authorizeBillingOrder, billingAdapterConfigured, registerStripeCheckoutSession } from "@/lib/billing/adapter";
import { requireBillingPermission } from "@/lib/billing/access";
import { catalogItemByKey } from "@/lib/billing/catalog";
import { createSettlementCheckout, stripeConfiguration } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SettlementBody = {
  itemKey?: string;
  amountCents?: number;
  agreementReference?: string;
  clientReference?: string;
  purchaseOrder?: string;
};

function fail(code: string, status = 400) {
  return NextResponse.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const access = await requireBillingPermission("billing.manage");
  if ("response" in access) return access.response;

  const configuration = stripeConfiguration();
  if (!configuration.secretKey || !configuration.publishableKey) return fail("STRIPE_NOT_CONFIGURED", 503);
  if (!process.env.DATABASE_URL || !configuration.crmPersistenceGate || !billingAdapterConfigured()) {
    return fail("BILLING_PERSISTENCE_NOT_VERIFIED", 503);
  }

  const body = await request.json().catch(() => null) as SettlementBody | null;
  if (!body || typeof body.itemKey !== "string") return fail("INVALID_SETTLEMENT_REQUEST");
  const item = catalogItemByKey(body.itemKey);
  if (!item || item.billing.kind !== "custom") return fail("SETTLEMENT_ITEM_NOT_AVAILABLE", 404);
  if (!Number.isInteger(body.amountCents) || (body.amountCents ?? 0) < 100 || (body.amountCents ?? 0) > 5_000_000) {
    return fail("SETTLEMENT_AMOUNT_OUT_OF_RANGE");
  }
  if (typeof body.agreementReference !== "string" || body.agreementReference.trim().length < 4 || body.agreementReference.length > 120) {
    return fail("SIGNED_AGREEMENT_REFERENCE_REQUIRED");
  }
  if (typeof body.clientReference !== "string" || body.clientReference.trim().length < 2 || body.clientReference.length > 120) {
    return fail("CLIENT_REFERENCE_REQUIRED");
  }
  if (body.purchaseOrder && (!item.checkout.purchase_order_allowed || body.purchaseOrder.length > 80)) {
    return fail("PURCHASE_ORDER_NOT_ALLOWED");
  }

  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  try {
    const authorization = await authorizeBillingOrder({
      organizationId: access.organizationId,
      actorSubject: access.principal.subject,
      catalogKey: item.key,
      correlationId,
      agreementReference: body.agreementReference.trim(),
      purchaseOrder: body.purchaseOrder?.trim(),
      amountCents: body.amountCents,
    });

    const session = await createSettlementCheckout({
      item,
      amountCents: body.amountCents,
      subject: access.principal.subject,
      organizationId: access.organizationId,
      email: access.principal.email,
      correlationId,
      agreementReference: body.agreementReference.trim(),
      clientReference: body.clientReference.trim(),
      purchaseOrder: body.purchaseOrder?.trim(),
    });
    if (!session.client_secret) throw new Error("STRIPE_EMBEDDED_CLIENT_SECRET_MISSING");

    await registerStripeCheckoutSession({
      organizationId: access.organizationId,
      actorSubject: access.principal.subject,
      orderId: authorization.orderId,
      orderNumber: authorization.orderNumber,
      catalogKey: item.key,
      correlationId,
      stripeSessionId: session.id,
      mode: session.mode,
      amountCents: body.amountCents,
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      orderNumber: authorization.orderNumber,
      catalogKey: item.key,
      amountCents: body.amountCents,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SETTLEMENT_CHECKOUT_FAILED";
    const status = code.startsWith("BILLING_ADAPTER_ERROR") ? 502 : code.startsWith("STRIPE_") ? 502 : 400;
    return fail(code, status);
  }
}
