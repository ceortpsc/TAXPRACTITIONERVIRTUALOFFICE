import { NextResponse } from "next/server";
import { requireBillingPermission } from "@/lib/billing/access";
import { billingCatalogVersion, directCheckoutItems, settlementCatalogItems, validateCatalogConfiguration } from "@/lib/billing/catalog";
import { stripeConfiguration, verifyStripeApiConnection } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireBillingPermission("billing.manage");
  if ("response" in access) return access.response;

  const configuration = stripeConfiguration();
  const stripeApi = await verifyStripeApiConnection();
  const catalog = validateCatalogConfiguration();
  const eventAdapterConfigured = Boolean(
    process.env.BILLING_EVENT_ADAPTER_URL && process.env.BILLING_EVENT_ADAPTER_TOKEN,
  );

  return NextResponse.json({
    module: "stripe-crm-billing",
    catalogVersion: billingCatalogVersion,
    catalog: {
      valid: catalog.valid,
      errors: catalog.errors,
      directCheckoutItems: directCheckoutItems().length,
      settlementItems: settlementCatalogItems().length,
    },
    checks: {
      stripeSecret: configuration.secretKey ? "configured" : "not_configured",
      stripePublishableKey: configuration.publishableKey ? "configured" : "not_configured",
      stripeWebhookSecret: configuration.webhookSecret ? "configured" : "not_configured",
      stripeApi,
      database: process.env.DATABASE_URL ? "configured" : "not_configured",
      crmPersistence: configuration.crmPersistenceGate ? "verified_flag" : "not_verified",
      billingEventAdapter: eventAdapterConfigured ? "configured" : "not_configured",
      automaticTax: configuration.automaticTax ? "enabled" : "disabled",
    },
    activationGate: configuration.secretKey
      && configuration.publishableKey
      && configuration.webhookSecret
      && Boolean(process.env.DATABASE_URL)
      && configuration.crmPersistenceGate
      && eventAdapterConfigured
      && stripeApi === "verified"
      ? "ready"
      : "configuration_required",
    note: "Checkout and settlement money movement fail closed until the Stripe credentials, durable CRM/order persistence, and webhook event adapter are configured and verified.",
  }, { headers: { "Cache-Control": "no-store" } });
}
