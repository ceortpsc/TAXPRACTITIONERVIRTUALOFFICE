import catalogSource from "@/config/stripe-catalog.json";

export type BillingKind = "one_time" | "recurring" | "quote" | "custom";
export type CatalogCategory =
  | "tax_services"
  | "payroll"
  | "education"
  | "software"
  | "professional_services"
  | "settlement";

export type CatalogItem = {
  key: string;
  category: CatalogCategory;
  name: string;
  description: string;
  billing: {
    kind: BillingKind;
    amount_cents?: number;
    interval?: "day" | "week" | "month" | "year";
    interval_count?: number;
  };
  stripe: {
    product_id: string;
    lookup_key: string | null;
    seed_strategy: "create_or_verify" | "product_only" | "verify_existing";
  };
  checkout: {
    enabled: boolean;
    purchase_order_allowed: boolean;
    requires_signed_agreement: boolean;
  };
  features: string[];
};

type CatalogSource = {
  version: string;
  currency: string;
  merchant: string;
  items: CatalogItem[];
};

const catalog = catalogSource as CatalogSource;

export const billingCatalogVersion = catalog.version;
export const billingCurrency = catalog.currency;
export const billingMerchant = catalog.merchant;
export const billingCatalog = Object.freeze(catalog.items.map((item) => Object.freeze(item)));

const byKey = new Map(billingCatalog.map((item) => [item.key, item]));

export function catalogItemByKey(key: string) {
  return byKey.get(key) ?? null;
}

export function directCheckoutItems() {
  return billingCatalog.filter((item) =>
    item.checkout.enabled
    && item.stripe.lookup_key
    && (item.billing.kind === "one_time" || item.billing.kind === "recurring"),
  );
}

export function settlementCatalogItems() {
  return billingCatalog.filter((item) => item.billing.kind === "custom");
}

export function publicCatalog() {
  return billingCatalog.map((item) => ({
    key: item.key,
    category: item.category,
    name: item.name,
    description: item.description,
    billing: item.billing,
    checkout: item.checkout,
    features: item.features,
    stripe: {
      productConfigured: Boolean(item.stripe.product_id),
      priceLookupConfigured: Boolean(item.stripe.lookup_key),
      seedStrategy: item.stripe.seed_strategy,
    },
  }));
}

export function formatCatalogPrice(item: CatalogItem) {
  if (item.billing.kind === "quote") return "Quote required";
  if (item.billing.kind === "custom") return "Agreement amount";
  const amount = item.billing.amount_cents;
  if (typeof amount !== "number") return "Configuration required";
  const value = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: billingCurrency.toUpperCase(),
  }).format(amount / 100);
  if (item.billing.kind === "recurring") {
    const count = item.billing.interval_count ?? 1;
    const interval = item.billing.interval ?? "month";
    return count === 1 ? `${value}/${interval}` : `${value} every ${count} ${interval}s`;
  }
  return value;
}

export function validateCatalogConfiguration() {
  const seenKeys = new Set<string>();
  const seenLookup = new Set<string>();
  const errors: string[] = [];

  for (const item of billingCatalog) {
    if (seenKeys.has(item.key)) errors.push(`DUPLICATE_CATALOG_KEY:${item.key}`);
    seenKeys.add(item.key);

    if (item.stripe.lookup_key) {
      if (seenLookup.has(item.stripe.lookup_key)) errors.push(`DUPLICATE_LOOKUP_KEY:${item.stripe.lookup_key}`);
      seenLookup.add(item.stripe.lookup_key);
    }

    if (item.checkout.enabled && !item.stripe.lookup_key) errors.push(`CHECKOUT_LOOKUP_REQUIRED:${item.key}`);
    if ((item.billing.kind === "one_time" || item.billing.kind === "recurring")
      && (!Number.isInteger(item.billing.amount_cents) || (item.billing.amount_cents ?? 0) < 50)) {
      errors.push(`INVALID_FIXED_PRICE:${item.key}`);
    }
    if (item.billing.kind === "recurring" && !item.billing.interval) {
      errors.push(`RECURRING_INTERVAL_REQUIRED:${item.key}`);
    }
  }

  return { valid: errors.length === 0, errors } as const;
}
