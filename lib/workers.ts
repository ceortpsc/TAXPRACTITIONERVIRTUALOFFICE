import { engineReadiness, runtimeStage, type RuntimeStage } from "@/lib/runtime/engine-registry";

export type WorkerGroupCode =
  | "tax_operations"
  | "client_service"
  | "identity_security"
  | "platform_operations"
  | "integrations_delivery"
  | "education";

export type WorkerExecution = "scheduled" | "event" | "hybrid";
export type WorkerRisk = "standard" | "controlled" | "high";

export type WorkerDefinition = {
  code: string;
  group: WorkerGroupCode;
  execution: WorkerExecution;
  schedule: "daily" | "event" | "continuous_external";
  queue: string;
  purpose: string;
  responsibilities: readonly string[];
  requiredCapabilities: readonly string[];
  idempotency: string;
  risk: WorkerRisk;
  retry: { maxAttempts: number; baseDelaySeconds: number; deadLetter: boolean };
  concurrency: number;
  timeoutSeconds: number;
};

export const workerGroups = [
  {
    code: "tax_operations",
    name: "Tax Operations",
    accountableFor: ["master-file reconciliation", "transcript exception routing", "refund/case follow-up"],
  },
  {
    code: "client_service",
    name: "Client Service",
    accountableFor: ["service-level sweeps", "outreach queues", "escalation routing"],
  },
  {
    code: "identity_security",
    name: "Identity & Security",
    accountableFor: ["access review", "audit verification", "security exceptions"],
  },
  {
    code: "platform_operations",
    name: "Platform Operations",
    accountableFor: ["runtime readiness", "worker health", "deployment evidence"],
  },
  {
    code: "integrations_delivery",
    name: "Integrations & Delivery",
    accountableFor: ["provider health", "outbox delivery", "webhook recovery"],
  },
  {
    code: "education",
    name: "Education Operations",
    accountableFor: ["student progress", "content freshness", "AI learning usage reconciliation"],
  },
] as const;

export const workerDirectory: readonly WorkerDefinition[] = [
  {
    code: "master_file_reconciliation",
    group: "tax_operations",
    execution: "hybrid",
    schedule: "daily",
    queue: "tax-operations",
    purpose: "Find newly staged master-file records and route incomplete reconciliation checkpoints.",
    responsibilities: ["checkpoint review", "source provenance validation", "exception routing"],
    requiredCapabilities: ["master-file adapter", "audit writer"],
    idempotency: "master-file:{record}:{revision}",
    risk: "high",
    retry: { maxAttempts: 5, baseDelaySeconds: 30, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 120,
  },
  {
    code: "support_sla_sweep",
    group: "client_service",
    execution: "scheduled",
    schedule: "daily",
    queue: "support",
    purpose: "Find overdue acknowledgments and updates and create escalation tasks.",
    responsibilities: ["SLA evaluation", "escalation creation", "owner notification"],
    requiredCapabilities: ["support adapter", "task writer"],
    idempotency: "support-sla:{ticket}:{window}",
    risk: "controlled",
    retry: { maxAttempts: 4, baseDelaySeconds: 60, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 90,
  },
  {
    code: "integration_health",
    group: "integrations_delivery",
    execution: "scheduled",
    schedule: "daily",
    queue: "operations",
    purpose: "Evaluate configured integration health without exposing secrets.",
    responsibilities: ["configuration presence", "provider state", "degradation routing"],
    requiredCapabilities: ["integration registry"],
    idempotency: "integration-health:{provider}:{date}",
    risk: "standard",
    retry: { maxAttempts: 3, baseDelaySeconds: 30, deadLetter: true },
    concurrency: 20,
    timeoutSeconds: 60,
  },
  {
    code: "access_review",
    group: "identity_security",
    execution: "scheduled",
    schedule: "daily",
    queue: "identity",
    purpose: "Flag suspended, expired, or anomalous access assignments for human review.",
    responsibilities: ["entitlement review", "expiry detection", "exception queue"],
    requiredCapabilities: ["identity adapter", "audit writer"],
    idempotency: "access-review:{tenant}:{date}",
    risk: "high",
    retry: { maxAttempts: 3, baseDelaySeconds: 60, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 120,
  },
  {
    code: "knowledge_freshness",
    group: "tax_operations",
    execution: "scheduled",
    schedule: "daily",
    queue: "compliance",
    purpose: "Flag stale source records and time-sensitive tax guidance for practitioner review.",
    responsibilities: ["source-age checks", "review task creation", "stale-content quarantine"],
    requiredCapabilities: ["knowledge registry", "task writer"],
    idempotency: "knowledge-refresh:{source}:{revision}",
    risk: "controlled",
    retry: { maxAttempts: 3, baseDelaySeconds: 60, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 90,
  },
  {
    code: "outbox_dispatch",
    group: "integrations_delivery",
    execution: "hybrid",
    schedule: "continuous_external",
    queue: "delivery",
    purpose: "Dispatch approved outbox events with retry, signature, and dead-letter controls.",
    responsibilities: ["delivery leasing", "provider transmission", "acknowledgment capture", "dead-letter routing"],
    requiredCapabilities: ["outbox adapter", "provider adapter", "audit writer"],
    idempotency: "outbox:{topic}:{idempotency_key}",
    risk: "high",
    retry: { maxAttempts: 8, baseDelaySeconds: 15, deadLetter: true },
    concurrency: 25,
    timeoutSeconds: 240,
  },
  {
    code: "audit_chain_verify",
    group: "identity_security",
    execution: "scheduled",
    schedule: "daily",
    queue: "security",
    purpose: "Verify append-only audit-chain continuity and report gaps.",
    responsibilities: ["chain verification", "gap detection", "security escalation"],
    requiredCapabilities: ["audit reader"],
    idempotency: "audit-chain:{tenant}:{date}",
    risk: "high",
    retry: { maxAttempts: 2, baseDelaySeconds: 120, deadLetter: true },
    concurrency: 5,
    timeoutSeconds: 180,
  },
  {
    code: "runtime_readiness",
    group: "platform_operations",
    execution: "scheduled",
    schedule: "daily",
    queue: "platform",
    purpose: "Evaluate registered routing, rendering, identity, AI, worker, and security engines.",
    responsibilities: ["engine readiness", "missing configuration inventory", "stage evidence"],
    requiredCapabilities: ["engine registry"],
    idempotency: "runtime-readiness:{environment}:{date}",
    risk: "standard",
    retry: { maxAttempts: 2, baseDelaySeconds: 30, deadLetter: false },
    concurrency: 1,
    timeoutSeconds: 30,
  },
  {
    code: "university_student_success",
    group: "education",
    execution: "scheduled",
    schedule: "daily",
    queue: "education",
    purpose: "Flag stalled learning progress and create human-review outreach tasks.",
    responsibilities: ["progress review", "intervention recommendation", "outreach queue"],
    requiredCapabilities: ["education adapter", "task writer"],
    idempotency: "student-success:{enrollment}:{date}",
    risk: "controlled",
    retry: { maxAttempts: 4, baseDelaySeconds: 60, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 120,
  },
  {
    code: "university_content_freshness",
    group: "education",
    execution: "scheduled",
    schedule: "daily",
    queue: "education",
    purpose: "Flag lessons, sources, assessments, and program rules due for human review.",
    responsibilities: ["content-age checks", "source validation", "review routing"],
    requiredCapabilities: ["education registry"],
    idempotency: "content-freshness:{content}:{version}",
    risk: "controlled",
    retry: { maxAttempts: 3, baseDelaySeconds: 60, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 90,
  },
  {
    code: "university_ai_usage_reconcile",
    group: "education",
    execution: "scheduled",
    schedule: "daily",
    queue: "education",
    purpose: "Reconcile AI learning-session status, usage, and missing review outcomes.",
    responsibilities: ["session reconciliation", "usage evidence", "missing-review routing"],
    requiredCapabilities: ["AI usage adapter", "education adapter"],
    idempotency: "ai-learning-usage:{session}",
    risk: "controlled",
    retry: { maxAttempts: 3, baseDelaySeconds: 60, deadLetter: true },
    concurrency: 10,
    timeoutSeconds: 90,
  },
] as const;

export function workerReadiness(env: NodeJS.ProcessEnv = process.env) {
  const stage = runtimeStage(env);
  const durableAdapter = Boolean(env.WORKER_ADAPTER_URL && env.WORKER_ADAPTER_TOKEN);
  return workerDirectory.map((worker) => ({
    ...worker,
    stage,
    state: worker.code === "runtime_readiness" || worker.code === "integration_health" ? "active" : durableAdapter ? "active" : "adapter_required",
    deployment: worker.schedule === "continuous_external" ? "persistent_worker_target" : "vercel_cron",
  } as const));
}

export function workerAssignmentSummary() {
  return workerGroups.map((group) => ({
    ...group,
    workers: workerDirectory.filter((worker) => worker.group === group.code).map((worker) => worker.code),
  }));
}

export function planWorkerSweep(input: { group?: WorkerGroupCode; stage?: RuntimeStage } = {}) {
  const stage = input.stage || runtimeStage();
  const workers = workerDirectory.filter((worker) => !input.group || worker.group === input.group);
  return {
    runId: crypto.randomUUID(),
    stage,
    createdAt: new Date().toISOString(),
    workers: workers.map((worker) => ({
      code: worker.code,
      group: worker.group,
      queue: worker.queue,
      execution: worker.execution,
      risk: worker.risk,
      retry: worker.retry,
      concurrency: worker.concurrency,
      timeoutSeconds: worker.timeoutSeconds,
      status: "planned" as const,
    })),
  };
}

export function runtimeWorkerEvidence(env: NodeJS.ProcessEnv = process.env) {
  return {
    stage: runtimeStage(env),
    engines: engineReadiness(env),
    workers: workerReadiness(env),
    assignments: workerAssignmentSummary(),
  };
}
