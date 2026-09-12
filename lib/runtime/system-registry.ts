import { engineReadiness, runtimeStage } from "@/lib/runtime/engine-registry";
import { workerAssignmentSummary, workerReadiness } from "@/lib/workers";
import { operationsSectionIds } from "@/lib/operations-center";

export const routeRegistry = [
  { path: "/", kind: "public", surface: "marketing" },
  { path: "/sign-in", kind: "public", surface: "identity" },
  { path: "/sign-up", kind: "public", surface: "identity" },
  { path: "/office", kind: "protected", surface: "workspace" },
  { path: "/operations", kind: "protected", surface: "operations" },
  { path: "/master-file", kind: "protected", surface: "tax-operations" },
  { path: "/support-console", kind: "protected", surface: "support" },
  { path: "/learn", kind: "protected", surface: "education" },
  { path: "/api/health", kind: "public-api", surface: "readiness" },
  { path: "/api/engines", kind: "protected-api", surface: "runtime" },
  { path: "/api/workers", kind: "protected-api", surface: "workers" },
  { path: "/api/system/registry", kind: "protected-api", surface: "registry" },
  { path: "/api/cron/workers", kind: "secret-gated-api", surface: "workers" },
] as const;

export const persistenceRegistry = [
  { migration: "015_operational_control_plane.sql", domain: "operations", durableWhen: "DATABASE_URL configured and migration applied" },
  { migration: "016_tax_practitioner_master_files.sql", domain: "master-file", durableWhen: "DATABASE_URL configured and migration applied" },
  { migration: "017_worker_control_plane.sql", domain: "workers", durableWhen: "DATABASE_URL configured and migration applied" },
] as const;

export const integrationRegistry = [
  { code: "clerk", required: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"] },
  { code: "database", required: ["DATABASE_URL"] },
  { code: "irs", required: ["IRS_CLIENT_ID", "IRS_CLIENT_SECRET"] },
  { code: "stripe", required: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { code: "worker_adapter", required: ["WORKER_ADAPTER_URL", "WORKER_ADAPTER_TOKEN"] },
  { code: "ai_gateway", anyOf: ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN"] },
] as const;

function integrationState(env: NodeJS.ProcessEnv = process.env) {
  return integrationRegistry.map((integration) => {
    const allConfigured = "required" in integration
      ? integration.required.every((key) => Boolean(env[key]))
      : integration.anyOf.some((key) => Boolean(env[key]));
    return {
      code: integration.code,
      state: allConfigured ? "configured" : "configuration_required",
    } as const;
  });
}

export function systemRegistrySnapshot(env: NodeJS.ProcessEnv = process.env) {
  return {
    generatedAt: new Date().toISOString(),
    stage: runtimeStage(env),
    routes: routeRegistry,
    operations: operationsSectionIds,
    engines: engineReadiness(env),
    workers: workerReadiness(env),
    assignments: workerAssignmentSummary(),
    persistence: {
      configured: Boolean(env.DATABASE_URL),
      artifacts: persistenceRegistry,
    },
    integrations: integrationState(env),
    controls: {
      returnsSecrets: false,
      providerClaimsRequireEvidence: true,
      dataMutationRequiresDurableAdapter: true,
      protectedRegistryRequiresControlPlaneRole: true,
    },
  } as const;
}
