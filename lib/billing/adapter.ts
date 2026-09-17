import "server-only";

const timeoutMs = 5000;

function adapterConfiguration() {
  const url = process.env.BILLING_EVENT_ADAPTER_URL?.trim();
  const token = process.env.BILLING_EVENT_ADAPTER_TOKEN?.trim();
  if (!url || !token) throw new Error("BILLING_EVENT_ADAPTER_NOT_CONFIGURED");
  return { url: url.replace(/\/$/, ""), token };
}

async function adapterPost<T>(path: string, payload: unknown): Promise<T> {
  const { url, token } = adapterConfiguration();
  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const code = body && typeof body === "object" && "error" in body && typeof body.error === "string"
      ? body.error
      : `HTTP_${response.status}`;
    throw new Error(`BILLING_ADAPTER_ERROR:${code}`);
  }
  return body as T;
}

export function billingAdapterConfigured() {
  return Boolean(process.env.BILLING_EVENT_ADAPTER_URL && process.env.BILLING_EVENT_ADAPTER_TOKEN);
}

export type BillingOrderAuthorization = {
  authorized: true;
  orderId: string;
  orderNumber: string;
  clientReference: string;
  stripeCustomerId?: string | null;
};

export async function authorizeBillingOrder(input: {
  organizationId: string;
  actorSubject: string;
  catalogKey: string;
  correlationId: string;
  agreementReference?: string;
  purchaseOrder?: string;
  amountCents?: number;
}) {
  return adapterPost<BillingOrderAuthorization>("/checkout/authorize", input);
}

export async function registerStripeCheckoutSession(input: {
  organizationId: string;
  actorSubject: string;
  orderId: string;
  orderNumber: string;
  catalogKey: string;
  correlationId: string;
  stripeSessionId: string;
  mode: string;
  amountCents?: number | null;
}) {
  return adapterPost<{ accepted: true }>("/checkout/session-created", input);
}

export async function ingestStripeEvent(input: {
  eventId: string;
  eventType: string;
  livemode: boolean;
  created: number;
  payloadSha256: string;
  event: unknown;
  receivedAt: string;
  correlationId: string;
}) {
  return adapterPost<{ accepted: true; duplicate?: boolean }>("/events/stripe", input);
}
