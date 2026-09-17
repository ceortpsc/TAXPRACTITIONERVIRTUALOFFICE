import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checkout = readFileSync(new URL("../../app/api/billing/checkout/route.ts", import.meta.url), "utf8");
const settlement = readFileSync(new URL("../../app/api/billing/settlements/route.ts", import.meta.url), "utf8");
const webhook = readFileSync(new URL("../../app/api/billing/webhook/route.ts", import.meta.url), "utf8");
const stripeServer = readFileSync(new URL("../../lib/stripe/server.ts", import.meta.url), "utf8");
const stripeWebhook = readFileSync(new URL("../../lib/stripe/webhook.ts", import.meta.url), "utf8");
const adapter = readFileSync(new URL("../../lib/billing/adapter.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../../config/stripe-catalog.json", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../database/migrations/021_stripe_crm_order_operations.sql", import.meta.url), "utf8");
const env = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
const proxy = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
const vercel = readFileSync(new URL("../../vercel.json", import.meta.url), "utf8");
const task13 = readFileSync(new URL("../../docs/billing/TASK-13-STRIPE-LIVE-COLLECTIONS.md", import.meta.url), "utf8");

test("Task 13 remains explicitly blocked until integration onboarding evidence exists", () => {
  assert.match(task13, /Status: \*\*BLOCKED/);
  assert.match(task13, /product_write/);
  assert.match(task13, /STRIPE_CRM_PERSISTENCE_VERIFIED=true/);
  assert.match(task13, /browser redirect/i);
});

test("direct checkout resolves Stripe prices server-side and requires durable authorization", () => {
  assert.match(checkout, /authorizeBillingOrder/);
  assert.match(checkout, /BILLING_PERSISTENCE_NOT_VERIFIED/);
  assert.match(stripeServer, /resolveActivePriceByLookupKey/);
  assert.match(stripeServer, /STRIPE_PRICE_AMOUNT_MISMATCH/);
  assert.doesNotMatch(checkout, /amountCents\?:/);
});

test("custom settlement collection is staff-gated, bounded, and agreement-backed", () => {
  assert.match(settlement, /requireBillingPermission\("billing.manage"\)/);
  assert.match(settlement, /SIGNED_AGREEMENT_REFERENCE_REQUIRED/);
  assert.match(settlement, /SETTLEMENT_AMOUNT_OUT_OF_RANGE/);
  assert.match(stripeServer, /input\.amountCents < 100/);
  assert.match(stripeServer, /agreementReference/);
});

test("Stripe webhook events require signature verification and durable provider-event ingestion", () => {
  assert.match(webhook, /verifyStripeWebhook/);
  assert.match(webhook, /BILLING_EVENT_PERSISTENCE_NOT_VERIFIED/);
  assert.match(webhook, /payloadSha256/);
  assert.match(stripeWebhook, /createHmac\("sha256"/);
  assert.match(stripeWebhook, /timingSafeEqual/);
  assert.match(adapter, /\/events\/stripe/);
});

test("CRM migration separates purchase orders, sales orders, settlement authorization, and provider evidence", () => {
  for (const table of [
    "commerce_catalog_items",
    "crm_accounts",
    "crm_contacts",
    "crm_opportunities",
    "purchase_orders",
    "sales_orders",
    "sales_order_lines",
    "billing_settlement_authorizations",
    "stripe_revenue_events",
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE ${table} \\(`));
  }
  assert.match(migration, /No PAN, CVC/);
  assert.match(migration, /append-only evidence/);
});

test("catalog contains fixed, recurring, quote, and controlled settlement products", () => {
  const parsed = JSON.parse(catalog);
  assert.ok(parsed.items.some((item) => item.billing.kind === "one_time"));
  assert.ok(parsed.items.some((item) => item.billing.kind === "recurring"));
  assert.ok(parsed.items.some((item) => item.billing.kind === "quote"));
  assert.ok(parsed.items.some((item) => item.billing.kind === "custom"));
  assert.ok(parsed.items.every((item) => typeof item.stripe.seed_strategy === "string"));
});

test("Stripe secrets and activation gates remain environment-only", () => {
  assert.match(env, /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/);
  assert.match(env, /STRIPE_SECRET_KEY=/);
  assert.match(env, /STRIPE_WEBHOOK_SECRET=/);
  assert.match(env, /STRIPE_CRM_PERSISTENCE_VERIFIED=false/);
  assert.match(env, /BILLING_EVENT_ADAPTER_TOKEN=/);
  assert.doesNotMatch(env, /sk_live_[A-Za-z0-9]/);
});

test("billing and CRM are protected and deployment CSP permits Stripe embedded Checkout", () => {
  assert.match(proxy, /"\/billing"/);
  assert.match(proxy, /"\/crm"/);
  assert.match(vercel, /https:\/\/js\.stripe\.com/);
  assert.match(vercel, /https:\/\/hooks\.stripe\.com/);
  assert.match(vercel, /https:\/\/checkout\.stripe\.com/);
});
