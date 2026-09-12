export type RuntimeStage = "development" | "preview" | "test" | "production";
export type EngineKind = "routing" | "rendering" | "identity" | "domain" | "workflow" | "worker" | "ai" | "security" | "integration";
export type EngineCriticality = "standard" | "controlled" | "critical";

export type EngineDefinition = {
  code: string;
  name: string;
  kind: EngineKind;
  ownerGroup: string;
  purpose: string;
  responsibilities: readonly string[];
  dependencies: readonly string[];
  stageScopes: readonly RuntimeStage[];
  criticality: EngineCriticality;
  execution: "request" | "background" | "hybrid";
  scaling: {
    mode: "stateless" | "queue-backed" | "provider-managed";
    maxConcurrency: number;
    timeoutMs: number;
  };
};

const allStages = ["development", "preview", "test", "production"] as const;

export const engineRegistry: readonly EngineDefinition[] = [
  {
    code: "edge_router",
    name: "Edge Routing Engine",
    kind: "routing",
    ownerGroup: "platform_engineering",
    purpose: "Resolve host, route, identity boundary, correlation ID, and protected-resource routing.",
    responsibilities: ["host mapping", "request correlation", "route protection", "subdomain dispatch"],
    dependencies: ["Next.js proxy", "Clerk session middleware"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "request",
    scaling: { mode: "stateless", maxConcurrency: 1000, timeoutMs: 5000 },
  },
  {
    code: "app_renderer",
    name: "Application Rendering Engine",
    kind: "rendering",
    ownerGroup: "platform_engineering",
    purpose: "Render App Router server/client boundaries with no-store controls for regulated workspaces.",
    responsibilities: ["server rendering", "client hydration", "route segmentation", "cache policy"],
    dependencies: ["Next.js App Router", "React"],
    stageScopes: allStages,
    criticality: "controlled",
    execution: "request",
    scaling: { mode: "provider-managed", maxConcurrency: 1000, timeoutMs: 300000 },
  },
  {
    code: "clerk_identity",
    name: "Clerk Identity Engine",
    kind: "identity",
    ownerGroup: "identity_security",
    purpose: "Authenticate users, organizations, SSO/OAuth callbacks, sessions, and profile controls.",
    responsibilities: ["authentication", "organization session", "MFA policy", "profile lifecycle"],
    dependencies: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "request",
    scaling: { mode: "provider-managed", maxConcurrency: 1000, timeoutMs: 15000 },
  },
  {
    code: "tax_master_file",
    name: "Tax Practitioner Master File Engine",
    kind: "domain",
    ownerGroup: "tax_operations",
    purpose: "Create canonical taxpayer case master records, reconciliation checkpoints, source provenance, and integrity seals.",
    responsibilities: ["record normalization", "masked identifier handling", "source provenance", "reconciliation state", "integrity sealing"],
    dependencies: ["authenticated organization", "authorized source", "PostgreSQL migration 016 for durable persistence"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "hybrid",
    scaling: { mode: "queue-backed", maxConcurrency: 50, timeoutMs: 30000 },
  },
  {
    code: "workflow_orchestrator",
    name: "Workflow Orchestration Engine",
    kind: "workflow",
    ownerGroup: "business_operations",
    purpose: "Translate domain events into gated tasks, approvals, retries, and terminal outcomes.",
    responsibilities: ["event routing", "task creation", "approval gates", "idempotency", "dead-letter routing"],
    dependencies: ["task registry", "outbox", "audit events"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "hybrid",
    scaling: { mode: "queue-backed", maxConcurrency: 100, timeoutMs: 60000 },
  },
  {
    code: "background_worker",
    name: "Background Worker Engine",
    kind: "worker",
    ownerGroup: "platform_operations",
    purpose: "Run scheduled and event-driven operational jobs using bounded concurrency and retry policy.",
    responsibilities: ["worker dispatch", "lease discipline", "retry/backoff", "dead-letter routing", "run evidence"],
    dependencies: ["CRON_SECRET", "worker registry"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "background",
    scaling: { mode: "queue-backed", maxConcurrency: 25, timeoutMs: 300000 },
  },
  {
    code: "ai_assistant",
    name: "AI Assistant Engine",
    kind: "ai",
    ownerGroup: "ai_operations",
    purpose: "Route sanitized prompts to approved advisory personas with human-review requirements.",
    responsibilities: ["agent selection", "prompt redaction", "provider routing", "output labeling", "review gating"],
    dependencies: ["AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN", "agent directory"],
    stageScopes: allStages,
    criticality: "controlled",
    execution: "request",
    scaling: { mode: "provider-managed", maxConcurrency: 50, timeoutMs: 20000 },
  },
  {
    code: "audit_security",
    name: "Audit and Security Engine",
    kind: "security",
    ownerGroup: "identity_security",
    purpose: "Enforce redaction, append-only audit evidence, security checks, and production release gates.",
    responsibilities: ["redaction", "audit evidence", "security readiness", "release controls"],
    dependencies: ["security policy", "audit registry"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "hybrid",
    scaling: { mode: "stateless", maxConcurrency: 100, timeoutMs: 30000 },
  },
  {
    code: "integration_adapter",
    name: "Integration Adapter Engine",
    kind: "integration",
    ownerGroup: "integrations_delivery",
    purpose: "Normalize external provider contracts behind scoped adapters without exposing credentials.",
    responsibilities: ["provider adapters", "webhook verification", "idempotent transmission", "health state"],
    dependencies: ["integration registry", "secret references"],
    stageScopes: allStages,
    criticality: "critical",
    execution: "hybrid",
    scaling: { mode: "queue-backed", maxConcurrency: 50, timeoutMs: 120000 },
  },
] as const;

export function runtimeStage(env: NodeJS.ProcessEnv = process.env): RuntimeStage {
  const value = env.VERCEL_ENV || env.APP_ENV || env.NODE_ENV || "development";
  if (value === "production" || value === "preview" || value === "test" || value === "development") return value;
  return "development";
}

export function engineReadiness(env: NodeJS.ProcessEnv = process.env) {
  const stage = runtimeStage(env);
  return engineRegistry.map((engine) => {
    const missing = engine.dependencies.filter((dependency) => {
      if (!/^[A-Z0-9_]+(?: or [A-Z0-9_]+)?$/.test(dependency)) return false;
      if (dependency.includes(" or ")) return !dependency.split(" or ").some((key) => Boolean(env[key]));
      return !env[dependency];
    });
    return {
      code: engine.code,
      name: engine.name,
      kind: engine.kind,
      ownerGroup: engine.ownerGroup,
      stage,
      criticality: engine.criticality,
      execution: engine.execution,
      scaling: engine.scaling,
      state: missing.length ? "blocked" : "ready",
      missingConfiguration: missing,
    } as const;
  });
}
