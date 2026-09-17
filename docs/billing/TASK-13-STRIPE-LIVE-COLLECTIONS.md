# Task #13 — Stripe Live Collections

Status: **BLOCKED — integration onboarding and production evidence required**

Last reviewed: 2026-09-16

## Provider-account evidence

The connected live Stripe account currently reports:

- `details_submitted = true`
- `charges_enabled = true`
- `payouts_enabled = true`
- account `requirements.currently_due = []`
- account `requirements.past_due = []`
- account `requirements.pending_verification = []`
- major card/ACH/payment capabilities are active; one optional payment-method capability may remain pending independently

This means Task #13 is **not blocked by the basic ability of the Stripe merchant account to accept charges or payouts**.

## RTPSC integration blockers

Task #13 remains blocked until all of the following are completed and verified:

1. **Stripe application permission onboarding**
   - The currently connected Stripe tool/session can read live catalog/account data but returned a permission error for product creation (`product_write` unavailable).
   - Catalog seeding therefore remains unapplied to the live account.
   - Existing live Stripe products/prices are evidence and must not be silently overwritten.

2. **Production Stripe runtime credentials**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - Secrets must exist only in encrypted deployment configuration.

3. **Durable RTPSC database**
   - A dedicated production tax-practice database must be provisioned.
   - Migration `021_stripe_crm_order_operations.sql` must be applied and verified.
   - Do not reuse an unrelated application/nonprofit database.

4. **CRM/order persistence adapter**
   - `BILLING_EVENT_ADAPTER_URL`
   - `BILLING_EVENT_ADAPTER_TOKEN`
   - Adapter must atomically authorize orders, agreements/PO references, checkout-session registration, and provider-event ingestion.
   - `STRIPE_CRM_PERSISTENCE_VERIFIED=true` is permitted only after end-to-end evidence confirms durable reads/writes.

5. **Webhook endpoint verification**
   - Stripe endpoint targets `/api/billing/webhook`.
   - Signature verification must pass using the production endpoint secret.
   - At least one controlled provider event must be received, SHA-256 recorded, idempotently persisted, and correlated to an order before live collections are enabled.

6. **Catalog seed verification**
   - Run `npm run billing:seed` first in dry-run mode.
   - Resolve any product/price conflicts.
   - Set `STRIPE_CATALOG_SEED_APPLY=true` only for an explicitly controlled seed run with `product_write` permission.
   - Re-run dry-run and require every fixed-price lookup key to verify exactly one active matching Stripe Price.

7. **Embedded Checkout verification**
   - CSP permits Stripe.js/embedded Checkout.
   - Authenticated catalog Checkout uses server-resolved price lookup keys; the browser never supplies the charge amount.
   - Signed-agreement products require a durable agreement authorization before Checkout Session creation.
   - Settlement custom amounts are staff-only, bounded, independently authorized, and correlated to a signed agreement.

8. **Settlement truth**
   - Browser redirect is never evidence of payment settlement.
   - Order/payment state changes only from verified Stripe events (`checkout.session.completed`, `payment_intent.succeeded`, `invoice.paid`, refunds, disputes, subscription events, payout events as applicable).

## Activation decision

Task #13 may change from `BLOCKED` to `READY FOR CONTROLLED LIVE COLLECTIONS` only when all integration gates above have provider/runtime evidence.

Until then:

- no synthetic paid/settled status;
- no fabricated Stripe event records;
- no public arbitrary-amount settlement endpoint;
- no live catalog mutation without required Stripe write permission;
- no live Checkout issuance if durable CRM/order authorization cannot be verified.
