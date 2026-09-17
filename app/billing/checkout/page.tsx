import Link from "next/link";
import { notFound } from "next/navigation";
import { requireIdentity } from "@/lib/identity";
import { catalogItemByKey, formatCatalogPrice } from "@/lib/billing/catalog";
import EmbeddedCheckout from "./EmbeddedCheckout";
import "../billing.css";

export default async function BillingCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  await requireIdentity();
  const { item: itemKey } = await searchParams;
  if (!itemKey) notFound();
  const item = catalogItemByKey(itemKey);
  if (!item || !item.checkout.enabled) notFound();

  return (
    <main className="checkoutShell">
      <div className="actions" style={{ marginBottom: 20 }}>
        <Link className="button" href="/billing">← Billing catalog</Link>
      </div>
      <EmbeddedCheckout
        itemKey={item.key}
        itemName={item.name}
        priceLabel={formatCatalogPrice(item)}
        requiresSignedAgreement={item.checkout.requires_signed_agreement}
        purchaseOrderAllowed={item.checkout.purchase_order_allowed}
      />
    </main>
  );
}
