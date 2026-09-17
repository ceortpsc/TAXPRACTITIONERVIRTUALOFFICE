"use client";

import { useRef, useState } from "react";
import Script from "next/script";

type Props = {
  itemKey: string;
  itemName: string;
  priceLabel: string;
  requiresSignedAgreement: boolean;
  purchaseOrderAllowed: boolean;
};

type EmbeddedCheckoutInstance = {
  mount(target: HTMLElement): void;
  destroy(): void;
};

type StripeBrowserClient = {
  initEmbeddedCheckout(options: { fetchClientSecret: () => Promise<string> }): Promise<EmbeddedCheckoutInstance>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeBrowserClient;
  }
}

export default function EmbeddedCheckout({
  itemKey,
  itemName,
  priceLabel,
  requiresSignedAgreement,
  purchaseOrderAllowed,
}: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const mountRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<EmbeddedCheckoutInstance | null>(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [agreementReference, setAgreementReference] = useState("");
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  async function launch() {
    setError(null);
    if (!publishableKey) {
      setError("Stripe.js is not configured for this deployment.");
      return;
    }
    if (!stripeLoaded || !window.Stripe || !mountRef.current) {
      setError("The secure payment component is still loading. Try again in a moment.");
      return;
    }
    if (requiresSignedAgreement && agreementReference.trim().length < 4) {
      setError("Enter the signed engagement/agreement reference before checkout.");
      return;
    }

    setLaunching(true);
    try {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      const stripe = window.Stripe(publishableKey);
      const checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret: async () => {
          const response = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemKey,
              agreementReference: agreementReference.trim() || undefined,
              purchaseOrder: purchaseOrder.trim() || undefined,
            }),
          });
          const body = await response.json().catch(() => null) as { clientSecret?: string; error?: string } | null;
          if (!response.ok || !body?.clientSecret) throw new Error(body?.error || "CHECKOUT_CREATION_FAILED");
          return body.clientSecret;
        },
      });
      instanceRef.current = checkout;
      checkout.mount(mountRef.current);
      setLaunched(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start secure checkout.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <>
      <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" onLoad={() => setStripeLoaded(true)} />
      <div className="checkoutGrid">
        <aside className="billingPanel">
          <p className="eyebrow">SECURE CHECKOUT</p>
          <h1>{itemName}</h1>
          <div className="catalogPrice">{priceLabel}</div>
          <p className="checkoutNotice">Card details stay inside Stripe. RTPSC receives only Stripe object references, order metadata, and payment-status events.</p>
          <div className="checkoutControls">
            {requiresSignedAgreement ? (
              <label>
                Signed agreement / engagement reference
                <input
                  value={agreementReference}
                  onChange={(event) => setAgreementReference(event.target.value)}
                  maxLength={120}
                  placeholder="Agreement or engagement reference"
                  autoComplete="off"
                />
              </label>
            ) : null}
            {purchaseOrderAllowed ? (
              <label>
                Purchase order (optional)
                <input
                  value={purchaseOrder}
                  onChange={(event) => setPurchaseOrder(event.target.value)}
                  maxLength={80}
                  placeholder="PO / procurement reference"
                  autoComplete="off"
                />
              </label>
            ) : null}
            <button className="button primary" type="button" onClick={launch} disabled={launching || !stripeLoaded}>
              {launching ? "Authorizing…" : launched ? "Restart secure checkout" : "Launch secure checkout"}
            </button>
            {error ? <div className="checkoutError" role="alert">{error}</div> : null}
          </div>
        </aside>
        <section className="checkoutFrame" aria-label="Stripe embedded checkout">
          <div ref={mountRef} className="checkoutMount" />
          {!launched ? <p className="catalogNote">Checkout mounts here only after the order, agreement, CRM, and Stripe gates authorize the session.</p> : null}
        </section>
      </div>
    </>
  );
}
