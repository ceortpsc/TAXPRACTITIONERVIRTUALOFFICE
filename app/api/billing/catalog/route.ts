import { NextResponse } from "next/server";
import {
  billingCatalogVersion,
  billingCurrency,
  billingMerchant,
  publicCatalog,
  validateCatalogConfiguration,
} from "@/lib/billing/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const validation = validateCatalogConfiguration();
  return NextResponse.json({
    merchant: billingMerchant,
    currency: billingCurrency,
    version: billingCatalogVersion,
    valid: validation.valid,
    items: publicCatalog(),
    controls: {
      cardDataStoredByApplication: false,
      directAmountsAcceptedFromBrowser: false,
      checkoutAmountsResolvedServerSide: true,
      settlementRequiresSignedAgreement: true,
      purchaseOrderMetadataSupported: true,
      providerStatusesAreNotFabricated: true,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
