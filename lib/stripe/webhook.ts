import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type StripeEventEnvelope = {
  id: string;
  object: "event";
  api_version?: string | null;
  created: number;
  livemode: boolean;
  pending_webhooks?: number;
  type: string;
  data: { object: Record<string, unknown> };
};

function parseSignature(header: string) {
  const values = header.split(",").map((part) => part.trim()).filter(Boolean);
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const value of values) {
    const [key, raw] = value.split("=", 2);
    if (key === "t" && /^\d+$/.test(raw ?? "")) timestamp = Number(raw);
    if (key === "v1" && /^[a-f0-9]{64}$/i.test(raw ?? "")) signatures.push(raw.toLowerCase());
  }
  return { timestamp, signatures };
}

function constantTimeHexEquals(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export function verifyStripeWebhook(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_NOT_CONFIGURED");
  if (!signatureHeader) throw new Error("STRIPE_SIGNATURE_MISSING");

  const { timestamp, signatures } = parseSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) throw new Error("STRIPE_SIGNATURE_INVALID");

  const tolerance = Math.min(
    Math.max(Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || "300"), 60),
    900,
  );
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) throw new Error("STRIPE_SIGNATURE_EXPIRED");

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  if (!signatures.some((candidate) => constantTimeHexEquals(candidate, expected))) {
    throw new Error("STRIPE_SIGNATURE_INVALID");
  }

  const event = JSON.parse(rawBody) as StripeEventEnvelope;
  if (!event || event.object !== "event" || !/^evt_[A-Za-z0-9]+$/.test(event.id) || typeof event.type !== "string") {
    throw new Error("STRIPE_EVENT_INVALID");
  }
  return event;
}

export const stripeRevenueEventTypes = Object.freeze([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
  "credit_note.created",
  "payout.paid",
  "payout.failed",
] as const);

export function isRevenueEventType(type: string) {
  return (stripeRevenueEventTypes as readonly string[]).includes(type);
}
