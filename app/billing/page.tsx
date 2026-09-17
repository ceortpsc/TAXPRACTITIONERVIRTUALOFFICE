import Link from "next/link";
import { requireIdentity } from "@/lib/identity";
import {
  billingCatalog,
  billingCatalogVersion,
  directCheckoutItems,
  formatCatalogPrice,
  settlementCatalogItems,
} from "@/lib/billing/catalog";
import { billingAdapterConfigured } from "@/lib/billing/adapter";
import { stripeConfiguration } from "@/lib/stripe/server";
import "./billing.css";

const categoryLabels: Record<string, string> = {
  tax_services: "Tax services",
  payroll: "Payroll",
  education: "Education",
  software: "Software",
  professional_services: "Professional services",
  settlement: "Settlement",
};

export default async function BillingPage() {
  const principal = await requireIdentity();
  const stripe = stripeConfiguration();
  const adapter = billingAdapterConfigured();
  const billingManage = principal.roles.some((role) => ["owner", "super_admin", "firm_admin", "bursar", "accountant"].includes(role));
  const activationReady = stripe.secretKey
    && stripe.publishableKey
    && stripe.webhookSecret
    && stripe.crmPersistenceGate
    && adapter;

  return (
    <main className="billingShell">
      <section className="billingHero">
        <div className="billingPanel">
          <p className="eyebrow">STRIPE + CRM + ORDER OPERATIONS</p>
          <h1>Revenue operations with settlement gates.</h1>
          <p className="lede">
            Govern catalog pricing, embedded Checkout, subscriptions, invoices, purchase-order references,
            settlement payments, customer records, and webhook evidence without storing raw card data in the application.
          </p>
          <div className="actions">
            <a className="button primary" href="#catalog">Open service catalog</a>
            {billingManage ? <Link className="button" href="/operations">Operations Control Center</Link> : null}
          </div>
        </div>
        <aside className="billingStatus" aria-label="Billing readiness">
          <strong>Activation posture</strong>
          <div className="statusRow"><span>Catalog</span><span className="statusValue">v{billingCatalogVersion}</span></div>
          <div className="statusRow"><span>Stripe server key</span><span className="statusValue">{stripe.secretKey ? "CONFIGURED" : "REQUIRED"}</span></div>
          <div className="statusRow"><span>Stripe.js key</span><span className="statusValue">{stripe.publishableKey ? "CONFIGURED" : "REQUIRED"}</span></div>
          <div className="statusRow"><span>Webhook signing</span><span className="statusValue">{stripe.webhookSecret ? "CONFIGURED" : "REQUIRED"}</span></div>
          <div className="statusRow"><span>CRM persistence</span><span className="statusValue">{stripe.crmPersistenceGate && adapter ? "VERIFIED GATE" : "BLOCKED"}</span></div>
          <div className="statusRow"><span>Money movement</span><span className="statusValue">{activationReady ? "READY TO VERIFY" : "FAIL-CLOSED"}</span></div>
        </aside>
      </section>

      <section id="catalog" className="catalogSection">
        <div className="catalogHeader">
          <div>
            <p className="eyebrow">CONTROLLED CATALOG</p>
            <h2>Services, software, education, payroll, and settlement products.</h2>
          </div>
          <p className="catalogNote">{directCheckoutItems().length} direct-checkout definitions · {settlementCatalogItems().length} settlement definitions</p>
        </div>
        <div className="catalogGrid">
          {billingCatalog.map((item) => (
            <article className="catalogCard" key={item.key}>
              <span className="catalogCategory">{categoryLabels[item.category] ?? item.category}</span>
              <h3>{item.name}</h3>
              <div className="catalogPrice">{formatCatalogPrice(item)}</div>
              <p>{item.description}</p>
              <ul className="catalogFeatures">
                {item.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <div className="catalogActions">
                {item.checkout.enabled ? (
                  <Link className="button primary" href={`/billing/checkout?item=${encodeURIComponent(item.key)}`}>
                    Secure checkout
                  </Link>
                ) : item.billing.kind === "custom" ? (
                  billingManage ? <span className="button">Staff settlement gate</span> : <span className="catalogNote">Staff authorization required</span>
                ) : (
                  <Link className="button" href="/contact">Request quote</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="catalogSection">
        <p className="eyebrow">SETTLEMENT + PO + CRM CONTROLS</p>
        <h2>Every payment has an accountable business record.</h2>
        <div className="gateGrid">
          <article className="gateCard">
            <h3>Embedded payment gate</h3>
            <p>Browser code submits only a catalog key and controlled references. The server resolves the Stripe price and validates the amount before creating Checkout.</p>
          </article>
          <article className="gateCard">
            <h3>Purchase-order + CRM correlation</h3>
            <p>PO number, engagement reference, order number, client reference, actor, organization, and correlation ID are carried into the durable order workflow.</p>
          </article>
          <article className="gateCard">
            <h3>Signed settlement control</h3>
            <p>Variable settlement amounts are staff-only and require a signed-agreement reference plus durable authorization before a Stripe Session can be issued.</p>
          </article>
          <article className="gateCard">
            <h3>Webhook evidence</h3>
            <p>Stripe signatures are HMAC-verified before supported revenue events are forwarded to the durable billing adapter with a SHA-256 payload hash.</p>
          </article>
          <article className="gateCard">
            <h3>PCI boundary</h3>
            <p>Card numbers, CVCs, and raw payment credentials never enter RTPSC application storage. Stripe-hosted payment components remain the card-data boundary.</p>
          </article>
          <article className="gateCard">
            <h3>Provider truth</h3>
            <p>Missing credentials, prices, persistence, webhooks, or settlement evidence block money movement instead of presenting a simulated success state.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
