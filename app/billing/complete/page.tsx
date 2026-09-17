import Link from "next/link";
import { requireIdentity } from "@/lib/identity";
import "../billing.css";

export default async function BillingCompletePage() {
  await requireIdentity();
  return (
    <main className="billingShell">
      <section className="completeCard">
        <p className="eyebrow">PAYMENT STATUS</p>
        <h1>Stripe received the checkout flow.</h1>
        <p className="lede">
          Final payment, invoice, subscription, refund, dispute, and payout status is recorded only from verified Stripe events.
          This page does not treat a browser redirect as proof of settlement.
        </p>
        <div className="actions">
          <Link className="button primary" href="/billing">Return to billing</Link>
          <Link className="button" href="/office">Virtual Office</Link>
        </div>
      </section>
    </main>
  );
}
