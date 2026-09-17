import { NextResponse } from "next/server";
import { requireBillingPermission } from "@/lib/billing/access";
import { billingAdapterConfigured } from "@/lib/billing/adapter";
import { stripeConfiguration } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireBillingPermission("billing.manage");
  if ("response" in access) return access.response;
  const stripe = stripeConfiguration();
  const database = Boolean(process.env.DATABASE_URL);
  const adapter = billingAdapterConfigured();
  const persistence = stripe.crmPersistenceGate;

  return NextResponse.json({
    module: "crm-order-operations",
    migration: "database/migrations/021_stripe_crm_order_operations.sql",
    entities: [
      "commerce_catalog_items",
      "crm_accounts",
      "crm_contacts",
      "crm_opportunities",
      "purchase_orders",
      "sales_orders",
      "sales_order_lines",
      "billing_settlement_authorizations",
      "stripe_revenue_events",
      "billing_customer_portal_audit",
    ],
    checks: {
      database: database ? "configured" : "not_configured",
      billingAdapter: adapter ? "configured" : "not_configured",
      persistenceVerification: persistence ? "verified_flag" : "not_verified",
    },
    mutationGate: database && adapter && persistence ? "adapter_gated" : "blocked",
    evidenceRule: "Stripe revenue status is derived from verified provider events; UI redirects never establish settlement.",
  }, { headers: { "Cache-Control": "no-store" } });
}
