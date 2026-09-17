import "server-only";
import type { CatalogItem } from "@/lib/billing/catalog";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export type StripePrice = {
  id: string;
  active: boolean;
  currency: string;
  lookup_key: string | null;
  product: string | { id: string };
  type: "one_time" | "recurring";
  unit_amount: number | null;
  recurring: { interval: string; interval_count: number } | null;
};

export type StripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  client_secret?: string | null;
  url?: string | null;
  mode: "payment" | "subscription" | "setup";
  status?: "open" | "complete" | "expired" | null;
  payment_status?: "paid" | "unpaid" | "no_payment_required";
  customer?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
  subscription?: string | { id: string } | null;
  invoice?: string | { id: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string>;
};

export type StripePortalSession = {
  id: string;
  url: string;
};

type StripeList<T> = { object: "list"; data: T[]; has_more: boolean };

type StripeErrorPayload = {
  error?: {
    type?: string;
    code?: string;
    message?: string;
    param?: string;
  };
};

function secretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  return key;
}

export function stripeConfiguration() {
  return {
    secretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    publishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    crmPersistenceGate: process.env.STRIPE_CRM_PERSISTENCE_VERIFIED === "true",
    automaticTax: process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true",
  } as const;
}

function cleanMetadata(value: string | undefined, max = 180) {
  if (!value) return undefined;
  const normalized = value.trim().replace(/[\r\n\t]+/g, " ");
  if (!normalized) return undefined;
  return normalized.slice(0, max);
}

async function stripeRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    params?: URLSearchParams;
    idempotencyKey?: string;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey()}`,
  };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers,
    body: method === "POST" ? options.params?.toString() : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 7000),
  });

  const payload = await response.json().catch(() => null) as T | StripeErrorPayload | null;
  if (!response.ok) {
    const stripeError = payload && typeof payload === "object" && "error" in payload
      ? (payload as StripeErrorPayload).error
      : undefined;
    const code = stripeError?.code || stripeError?.type || `HTTP_${response.status}`;
    throw new Error(`STRIPE_API_ERROR:${code}`);
  }
  return payload as T;
}

export async function verifyStripeApiConnection() {
  if (!process.env.STRIPE_SECRET_KEY) return "not_configured" as const;
  try {
    await stripeRequest<StripeList<{ id: string }>>("/products?limit=1", { timeoutMs: 2500 });
    return "verified" as const;
  } catch {
    return "unavailable" as const;
  }
}

export async function resolveActivePriceByLookupKey(lookupKey: string) {
  const query = new URLSearchParams();
  query.append("lookup_keys[]", lookupKey);
  query.set("active", "true");
  query.set("limit", "10");
  const result = await stripeRequest<StripeList<StripePrice>>(`/prices?${query.toString()}`);
  const exact = result.data.filter((price) => price.lookup_key === lookupKey && price.active);
  if (exact.length !== 1) throw new Error(exact.length === 0 ? "STRIPE_PRICE_NOT_SEEDED" : "STRIPE_PRICE_AMBIGUOUS");
  return exact[0];
}

function expectedAmount(item: CatalogItem) {
  if (item.billing.kind !== "one_time" && item.billing.kind !== "recurring") {
    throw new Error("DIRECT_CHECKOUT_NOT_ALLOWED");
  }
  if (!Number.isInteger(item.billing.amount_cents) || (item.billing.amount_cents ?? 0) < 50) {
    throw new Error("CATALOG_PRICE_INVALID");
  }
  return item.billing.amount_cents as number;
}

function verifyResolvedPrice(item: CatalogItem, price: StripePrice) {
  const amount = expectedAmount(item);
  if (price.currency !== "usd") throw new Error("STRIPE_PRICE_CURRENCY_MISMATCH");
  if (price.unit_amount !== amount) throw new Error("STRIPE_PRICE_AMOUNT_MISMATCH");
  if (item.billing.kind === "one_time" && price.type !== "one_time") throw new Error("STRIPE_PRICE_TYPE_MISMATCH");
  if (item.billing.kind === "recurring") {
    if (price.type !== "recurring" || !price.recurring) throw new Error("STRIPE_PRICE_TYPE_MISMATCH");
    if (price.recurring.interval !== item.billing.interval
      || price.recurring.interval_count !== (item.billing.interval_count ?? 1)) {
      throw new Error("STRIPE_PRICE_INTERVAL_MISMATCH");
    }
  }
}

function checkoutReturnUrl() {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/billing/complete?session_id={CHECKOUT_SESSION_ID}`;
}

export async function createCatalogCheckout(input: {
  item: CatalogItem;
  subject: string;
  organizationId: string;
  email: string | null;
  correlationId: string;
  purchaseOrder?: string;
}) {
  if (!input.item.checkout.enabled || !input.item.stripe.lookup_key) throw new Error("DIRECT_CHECKOUT_NOT_ALLOWED");
  if (input.item.checkout.requires_signed_agreement && process.env.STRIPE_CRM_PERSISTENCE_VERIFIED !== "true") {
    throw new Error("SIGNED_AGREEMENT_PERSISTENCE_NOT_VERIFIED");
  }
  const price = await resolveActivePriceByLookupKey(input.item.stripe.lookup_key);
  verifyResolvedPrice(input.item, price);

  const mode = input.item.billing.kind === "recurring" ? "subscription" : "payment";
  const params = new URLSearchParams();
  params.set("mode", mode);
  params.set("ui_mode", "embedded");
  params.set("return_url", checkoutReturnUrl());
  params.set("line_items[0][price]", price.id);
  params.set("line_items[0][quantity]", "1");
  params.set("billing_address_collection", "required");
  params.set("allow_promotion_codes", "true");
  params.set("client_reference_id", input.subject.slice(0, 200));
  if (input.email) params.set("customer_email", input.email);
  if (process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true") params.set("automatic_tax[enabled]", "true");
  if (mode === "payment") {
    params.set("customer_creation", "always");
    params.set("invoice_creation[enabled]", "true");
  }
  if (input.item.checkout.purchase_order_allowed) params.set("tax_id_collection[enabled]", "true");

  const metadata: Record<string, string | undefined> = {
    catalog_key: input.item.key,
    catalog_version: process.env.STRIPE_CATALOG_VERSION || "2026-09-16",
    organization_id: input.organizationId,
    actor_subject: input.subject,
    correlation_id: input.correlationId,
    purchase_order: cleanMetadata(input.purchaseOrder, 80),
  };
  for (const [key, value] of Object.entries(metadata)) {
    if (value) params.set(`metadata[${key}]`, value);
  }
  if (mode === "subscription") {
    params.set("subscription_data[metadata][catalog_key]", input.item.key);
    params.set("subscription_data[metadata][organization_id]", input.organizationId);
    params.set("subscription_data[metadata][correlation_id]", input.correlationId);
  } else {
    params.set("payment_intent_data[metadata][catalog_key]", input.item.key);
    params.set("payment_intent_data[metadata][organization_id]", input.organizationId);
    params.set("payment_intent_data[metadata][correlation_id]", input.correlationId);
  }

  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    params,
    idempotencyKey: `checkout:${input.organizationId}:${input.subject}:${input.item.key}:${input.correlationId}`.slice(0, 255),
  });
}

export async function createSettlementCheckout(input: {
  item: CatalogItem;
  amountCents: number;
  subject: string;
  organizationId: string;
  email: string | null;
  correlationId: string;
  agreementReference: string;
  clientReference: string;
  purchaseOrder?: string;
}) {
  if (input.item.billing.kind !== "custom" || !input.item.stripe.product_id) throw new Error("SETTLEMENT_ITEM_REQUIRED");
  if (process.env.STRIPE_CRM_PERSISTENCE_VERIFIED !== "true") throw new Error("SETTLEMENT_PERSISTENCE_NOT_VERIFIED");
  if (!Number.isInteger(input.amountCents) || input.amountCents < 100 || input.amountCents > 5_000_000) {
    throw new Error("SETTLEMENT_AMOUNT_OUT_OF_RANGE");
  }
  const agreementReference = cleanMetadata(input.agreementReference, 120);
  const clientReference = cleanMetadata(input.clientReference, 120);
  if (!agreementReference || !clientReference) throw new Error("SETTLEMENT_REFERENCE_REQUIRED");

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("ui_mode", "embedded");
  params.set("return_url", checkoutReturnUrl());
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
  params.set("line_items[0][price_data][product]", input.item.stripe.product_id);
  params.set("line_items[0][quantity]", "1");
  params.set("billing_address_collection", "required");
  params.set("allow_promotion_codes", "false");
  params.set("customer_creation", "always");
  params.set("invoice_creation[enabled]", "true");
  params.set("client_reference_id", input.subject.slice(0, 200));
  if (input.email) params.set("customer_email", input.email);
  if (input.purchaseOrder) params.set("metadata[purchase_order]", cleanMetadata(input.purchaseOrder, 80) ?? "");
  params.set("metadata[catalog_key]", input.item.key);
  params.set("metadata[agreement_reference]", agreementReference);
  params.set("metadata[client_reference]", clientReference);
  params.set("metadata[organization_id]", input.organizationId);
  params.set("metadata[actor_subject]", input.subject);
  params.set("metadata[correlation_id]", input.correlationId);
  params.set("payment_intent_data[metadata][catalog_key]", input.item.key);
  params.set("payment_intent_data[metadata][agreement_reference]", agreementReference);
  params.set("payment_intent_data[metadata][client_reference]", clientReference);
  params.set("payment_intent_data[metadata][organization_id]", input.organizationId);
  params.set("payment_intent_data[metadata][correlation_id]", input.correlationId);

  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    params,
    idempotencyKey: `settlement:${input.organizationId}:${input.item.key}:${agreementReference}:${input.amountCents}`.slice(0, 255),
  });
}

export async function retrieveCheckoutSession(sessionId: string) {
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("INVALID_CHECKOUT_SESSION_ID");
  return stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export async function createCustomerPortalSession(input: {
  customerId: string;
  returnPath?: string;
  correlationId: string;
}) {
  if (!/^cus_[A-Za-z0-9]+$/.test(input.customerId)) throw new Error("INVALID_STRIPE_CUSTOMER_ID");
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const returnPath = input.returnPath?.startsWith("/") ? input.returnPath : "/billing";
  const params = new URLSearchParams();
  params.set("customer", input.customerId);
  params.set("return_url", `${base}${returnPath}`);
  return stripeRequest<StripePortalSession>("/billing_portal/sessions", {
    method: "POST",
    params,
    idempotencyKey: `portal:${input.customerId}:${input.correlationId}`.slice(0, 255),
  });
}
