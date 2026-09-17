import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRODUCTION_WORKER_ADAPTER_URL = "https://rtpsc-worker-adapter.onrender.com";

function workerAdapterUrl() {
  return process.env.WORKER_ADAPTER_URL
    || (process.env.VERCEL_ENV === "production" ? PRODUCTION_WORKER_ADAPTER_URL : undefined);
}

function workerAdapterCredential() {
  return process.env.WORKER_ADAPTER_TOKEN || process.env.VERCEL_OIDC_TOKEN;
}

async function workerAdapterStatus() {
  const url = workerAdapterUrl();
  if (!url) return { state: "not_configured" as const, auth: "not_configured" as const };

  let state: "ready" | "degraded" | "unreachable" | "unknown" = "unknown";
  try {
    const healthUrl = new URL("/healthz", url);
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) state = "unreachable";
    else {
      const body = await response.json() as { status?: string };
      if (body.status === "ready") state = "ready";
      else if (body.status === "degraded") state = "degraded";
      else state = "unknown";
    }
  } catch {
    state = "unreachable";
  }

  const token = workerAdapterCredential();
  if (!token) return { state, auth: "not_configured" as const };

  try {
    const authUrl = new URL("/authz", url);
    const response = await fetch(authUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (response.status === 401) return { state, auth: "rejected" as const };
    if (!response.ok) return { state, auth: "unavailable" as const };
    const body = await response.json() as { authenticated?: boolean; mode?: string; dataMutationClaimed?: boolean };
    if (body.authenticated === true && body.dataMutationClaimed !== true) {
      return { state, auth: "verified" as const, authMode: body.mode === "vercel_oidc" ? "vercel_oidc" as const : "shared_token" as const };
    }
    return { state, auth: "unknown" as const };
  } catch {
    return { state, auth: "unavailable" as const };
  }
}

export async function GET() {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
  const irsConfigured = Boolean(
    process.env.IRS_CLIENT_ID && process.env.IRS_CLIENT_SECRET && process.env.IRS_REDIRECT_URI,
  );
  const stripeServerConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const stripeClientConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const stripeWebhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const billingAdapterConfigured = Boolean(
    process.env.BILLING_EVENT_ADAPTER_URL && process.env.BILLING_EVENT_ADAPTER_TOKEN,
  );
  const stripePersistenceVerified = process.env.STRIPE_CRM_PERSISTENCE_VERIFIED === "true";
  const stripeConfigured = stripeServerConfigured && stripeClientConfigured && stripeWebhookConfigured;
  const stripeBillingReady = stripeConfigured
    && Boolean(process.env.DATABASE_URL)
    && billingAdapterConfigured
    && stripePersistenceVerified;
  const workerAdapter = await workerAdapterStatus();

  return NextResponse.json({
    status: "ok",
    service: "tax-practitioner-virtual-office",
    checks: {
      application: "ready",
      database: process.env.DATABASE_URL ? "configured" : "not_configured",
      identity: clerkConfigured ? "configured" : "not_configured",
      irsApi: irsConfigured ? "configured" : "not_configured",
      stripe: stripeConfigured ? "configured" : "not_configured",
      stripeCheckout: stripeServerConfigured && stripeClientConfigured ? "configured" : "not_configured",
      stripeWebhook: stripeWebhookConfigured ? "configured" : "not_configured",
      stripeCrmPersistence: stripePersistenceVerified && billingAdapterConfigured ? "configured" : "not_configured",
      stripeBilling: stripeBillingReady ? "ready" : "configuration_required",
      workerAdapter: workerAdapter.state,
      workerAdapterAuth: workerAdapter.auth,
      workerAdapterAuthMode: workerAdapter.authMode ?? "none",
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
