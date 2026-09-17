import catalog from "../../config/stripe-catalog.json" with { type: "json" };

const apiBase = "https://api.stripe.com/v1";
const secret = process.env.STRIPE_SECRET_KEY?.trim();
const apply = process.env.STRIPE_CATALOG_SEED_APPLY === "true";

if (!secret) {
  console.error("STRIPE_SECRET_KEY is required. Keep it in the encrypted runtime environment only.");
  process.exit(2);
}

function form(input) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params;
}

async function request(path, { method = "GET", body, idempotencyKey, allow404 = false } = {}) {
  const headers = { Authorization: `Bearer ${secret}` };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body?.toString(),
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json().catch(() => null);
  if (allow404 && response.status === 404) return null;
  if (!response.ok) {
    const code = payload?.error?.code || payload?.error?.type || `HTTP_${response.status}`;
    throw new Error(`${path}:${code}`);
  }
  return payload;
}

async function getProduct(id) {
  return request(`/products/${encodeURIComponent(id)}`, { allow404: true });
}

async function ensureProduct(item) {
  const existing = await getProduct(item.stripe.product_id);
  if (existing) {
    if (!existing.active) throw new Error(`${item.key}:PRODUCT_INACTIVE`);
    return { product: existing, action: "verified" };
  }
  if (item.stripe.seed_strategy === "verify_existing") {
    throw new Error(`${item.key}:EXPECTED_EXISTING_PRODUCT_MISSING`);
  }
  if (!apply) {
    return { product: { id: item.stripe.product_id }, action: "would_create" };
  }
  const body = form({
    id: item.stripe.product_id,
    name: item.name,
    description: item.description,
    type: "service",
    "metadata[catalog_key]": item.key,
    "metadata[catalog_version]": catalog.version,
    "metadata[company]": catalog.merchant,
    "metadata[seed_owner]": "rtpsc_app",
  });
  const product = await request("/products", {
    method: "POST",
    body,
    idempotencyKey: `rtpsc-product-${catalog.version}-${item.key}`,
  });
  return { product, action: "created" };
}

async function pricesByLookupKey(lookupKey) {
  const params = new URLSearchParams();
  params.append("lookup_keys[]", lookupKey);
  params.set("active", "true");
  params.set("limit", "10");
  const list = await request(`/prices?${params.toString()}`);
  return list.data.filter((price) => price.lookup_key === lookupKey && price.active);
}

function verifyPrice(item, price) {
  if (price.currency !== catalog.currency) throw new Error(`${item.key}:PRICE_CURRENCY_MISMATCH`);
  if (price.product !== item.stripe.product_id) throw new Error(`${item.key}:PRICE_PRODUCT_MISMATCH`);
  if (item.billing.kind === "one_time") {
    if (price.type !== "one_time" || price.unit_amount !== item.billing.amount_cents) {
      throw new Error(`${item.key}:PRICE_AMOUNT_OR_TYPE_MISMATCH`);
    }
  }
  if (item.billing.kind === "recurring") {
    if (price.type !== "recurring" || price.unit_amount !== item.billing.amount_cents) {
      throw new Error(`${item.key}:PRICE_AMOUNT_OR_TYPE_MISMATCH`);
    }
    if (!price.recurring
      || price.recurring.interval !== item.billing.interval
      || price.recurring.interval_count !== (item.billing.interval_count || 1)) {
      throw new Error(`${item.key}:PRICE_INTERVAL_MISMATCH`);
    }
  }
}

async function ensurePrice(item, productId) {
  if (!item.stripe.lookup_key) return { price: null, action: "not_applicable" };
  const existing = await pricesByLookupKey(item.stripe.lookup_key);
  if (existing.length > 1) throw new Error(`${item.key}:DUPLICATE_ACTIVE_LOOKUP_KEY`);
  if (existing.length === 1) {
    verifyPrice(item, existing[0]);
    return { price: existing[0], action: "verified" };
  }
  if (item.stripe.seed_strategy === "verify_existing") {
    throw new Error(`${item.key}:EXPECTED_EXISTING_PRICE_MISSING`);
  }
  if (item.billing.kind !== "one_time" && item.billing.kind !== "recurring") {
    return { price: null, action: "not_applicable" };
  }
  if (!apply) {
    return { price: { id: "dry_run_price", product: productId }, action: "would_create" };
  }

  const body = form({
    currency: catalog.currency,
    unit_amount: item.billing.amount_cents,
    product: productId,
    lookup_key: item.stripe.lookup_key,
    "metadata[catalog_key]": item.key,
    "metadata[catalog_version]": catalog.version,
    ...(item.billing.kind === "recurring" ? {
      "recurring[interval]": item.billing.interval,
      "recurring[interval_count]": item.billing.interval_count || 1,
    } : {}),
  });
  const price = await request("/prices", {
    method: "POST",
    body,
    idempotencyKey: `rtpsc-price-${catalog.version}-${item.key}`,
  });
  verifyPrice(item, price);
  return { price, action: "created" };
}

async function setDefaultPrice(item, productId, priceId) {
  if (!apply || !priceId || priceId === "dry_run_price") return "not_applied";
  const body = form({ default_price: priceId });
  await request(`/products/${encodeURIComponent(productId)}`, {
    method: "POST",
    body,
    idempotencyKey: `rtpsc-default-price-${catalog.version}-${item.key}`,
  });
  return "updated";
}

const summary = [];
let failed = false;
for (const item of catalog.items) {
  try {
    const { product, action: productAction } = await ensureProduct(item);
    const { price, action: priceAction } = await ensurePrice(item, product.id);
    const defaultPriceAction = price?.id ? await setDefaultPrice(item, product.id, price.id) : "not_applicable";
    summary.push({
      key: item.key,
      product: product.id,
      productAction,
      price: price?.id || null,
      priceAction,
      defaultPriceAction,
    });
  } catch (error) {
    failed = true;
    summary.push({ key: item.key, error: error instanceof Error ? error.message : String(error) });
  }
}

console.log(JSON.stringify({
  mode: apply ? "apply" : "dry_run",
  catalogVersion: catalog.version,
  processed: summary.length,
  failed,
  results: summary,
}, null, 2));

if (failed) process.exit(1);
