import Link from "next/link";
import { redirect } from "next/navigation";
import { requireIdentity } from "@/lib/identity";
import { authorize } from "@/lib/rbac";
import { billingAdapterConfigured } from "@/lib/billing/adapter";
import { stripeConfiguration } from "@/lib/stripe/server";
import "../billing/billing.css";

const pipeline = [
  ["qualification", "Qualification", "Identify service need, client/account, scope, and authorization path."],
  ["discovery", "Discovery", "Collect approved requirements and supporting records without payment capture."],
  ["proposal", "Proposal", "Build quote, fee schedule, order lines, tax posture, and procurement references."],
  ["agreement", "Agreement", "Require signed engagement where the catalog item or settlement policy requires it."],
  ["authorized", "Authorized", "Create durable order authorization before any embedded Checkout Session is issued."],
  ["won", "Won / paid", "Move only from verified Stripe webhook evidence, not browser redirects or narrative status."],
] as const;

export default async function CrmPage() {
  const principal = await requireIdentity();
  if (!principal.organizationId) redirect("/office");
  const permitted = authorize(
    {
      id: principal.subject,
      tenantId: principal.organizationId,
      roles: principal.roles,
      mfaVerified: principal.mfaVerified,
    },
    "billing.manage",
    { tenantId: principal.organizationId },
  );
  if (!permitted) redirect("/office");

  const stripe = stripeConfiguration();
  const persistenceReady = Boolean(process.env.DATABASE_URL)
    && stripe.crmPersistenceGate
    && billingAdapterConfigured();

  return (
    <main className="billingShell">
      <section className="billingHero">
        <div className="billingPanel">
          <p className="eyebrow">CRM + ORDER CONTROL PLANE</p>
          <h1>Prospect-to-payment without losing the evidence trail.</h1>
          <p className="lede">
            Accounts, contacts, opportunities, purchase orders, signed agreements, sales orders,
            settlement authorizations, Stripe customers, invoices, subscriptions, payments, refunds,
            disputes, and payout evidence share one governed correlation model.
          </p>
          <div className="actions">
            <Link className="button primary" href="/billing">Billing & products</Link>
            <Link className="button" href="/operations">Operations Control Center</Link>
          </div>
        </div>
        <aside className="billingStatus" aria-label="CRM readiness">
          <strong>Durable data gate</strong>
          <div className="statusRow"><span>Database</span><span className="statusValue">{process.env.DATABASE_URL ? "CONFIGURED" : "REQUIRED"}</span></div>
          <div className="statusRow"><span>Migration</span><span className="statusValue">021 REGISTERED</span></div>
          <div className="statusRow"><span>Billing adapter</span><span className="statusValue">{billingAdapterConfigured() ? "CONFIGURED" : "REQUIRED"}</span></div>
          <div className="statusRow"><span>Persistence verification</span><span className="statusValue">{stripe.crmPersistenceGate ? "VERIFIED FLAG" : "REQUIRED"}</span></div>
          <div className="statusRow"><span>Record mutation</span><span className="statusValue">{persistenceReady ? "ADAPTER-GATED" : "FAIL-CLOSED"}</span></div>
        </aside>
      </section>

      <section className="catalogSection">
        <p className="eyebrow">PIPELINE DISCIPLINE</p>
        <h2>One stage model from qualification to provider-confirmed payment.</h2>
        <div className="catalogGrid">
          {pipeline.map(([code, title, description]) => (
            <article className="catalogCard" key={code}>
              <span className="catalogCategory">{code}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="catalogActions"><span className="catalogNote">No synthetic records displayed.</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="catalogSection">
        <p className="eyebrow">DATA MAP</p>
        <h2>CRM, procurement, order, payment, and settlement entities.</h2>
        <div className="gateGrid">
          <article className="gateCard"><h3>Accounts & contacts</h3><p>Tenant-isolated CRM accounts link to existing client records, encrypted billing contact fields, owners, and Stripe customer references.</p></article>
          <article className="gateCard"><h3>Opportunities</h3><p>Catalog-backed opportunities carry pipeline stage, forecast amount, expected close date, engagement reference, PO reference, and accountable owner.</p></article>
          <article className="gateCard"><h3>Purchase orders</h3><p>PO number, authorized amount, supporting document, approval, issue/expiry dates, and fulfillment state remain separate from payment state.</p></article>
          <article className="gateCard"><h3>Sales orders</h3><p>Order number, line items, totals, agreement reference, Checkout Session, PaymentIntent, Subscription, Invoice, Customer, and correlation IDs share one record.</p></article>
          <article className="gateCard"><h3>Settlement authorization</h3><p>Custom-amount settlement requires an agreement reference, bounded amount, requester, separate approver, expiry, and Stripe correlation.</p></article>
          <article className="gateCard"><h3>Provider event ledger</h3><p>Verified Stripe events are append-only and hash-addressed; payment state transitions are driven from provider evidence rather than UI assumptions.</p></article>
        </div>
      </section>
    </main>
  );
}
