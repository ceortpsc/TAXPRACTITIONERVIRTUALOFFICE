import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { billingAdapterConfigured, ingestStripeEvent } from "@/lib/billing/adapter";
import { isRevenueEventType, verifyStripeWebhook } from "@/lib/stripe/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let event;
  try {
    event = verifyStripeWebhook(rawBody, request.headers.get("stripe-signature"));
  } catch (error) {
    const code = error instanceof Error ? error.message : "STRIPE_WEBHOOK_VERIFICATION_FAILED";
    return response({ error: code }, code === "STRIPE_WEBHOOK_NOT_CONFIGURED" ? 503 : 400);
  }

  if (!isRevenueEventType(event.type)) {
    return response({ received: true, ignored: true, eventId: event.id, eventType: event.type });
  }
  if (process.env.STRIPE_CRM_PERSISTENCE_VERIFIED !== "true" || !billingAdapterConfigured()) {
    return response({ error: "BILLING_EVENT_PERSISTENCE_NOT_VERIFIED", eventId: event.id }, 503);
  }

  const correlationId = request.headers.get("x-correlation-id") || randomUUID();
  const payloadSha256 = createHash("sha256").update(rawBody, "utf8").digest("hex");
  try {
    const result = await ingestStripeEvent({
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      created: event.created,
      payloadSha256,
      event,
      receivedAt: new Date().toISOString(),
      correlationId,
    });
    return response({
      received: true,
      persisted: true,
      duplicate: Boolean(result.duplicate),
      eventId: event.id,
      eventType: event.type,
      correlationId,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "BILLING_EVENT_PERSISTENCE_FAILED";
    return response({ error: code, eventId: event.id, correlationId }, 502);
  }
}
