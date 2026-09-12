import { securityReadiness } from "@/lib/security/readiness";
import { engineReadiness, runtimeStage } from "@/lib/runtime/engine-registry";
import { workerReadiness } from "@/lib/workers";

export const operationsSectionIds = [
  "deployments",
  "health",
  "security",
  "optimization",
  "quotas",
  "maintenance",
  "support",
  "topology",
] as const;

export type OperationsSectionId = (typeof operationsSectionIds)[number];
export type OperationalStatus = "READY" | "VERIFIED" | "CONFIGURATION_REQUIRED" | "DEGRADED" | "UNKNOWN" | "SCHEDULED";
export type EvidenceClass = "RUNTIME" | "CONFIGURATION" | "PROVIDER_REPORTED" | "POLICY" | "DESIGN_CONTROL";

export type OperationalItem = {
  id: string;
  label: string;
  status: OperationalStatus;
  detail: string;
  evidenceClass: EvidenceClass;
  source: string;
  verifiedAt: string | null;
  action?: string;
};

export type OperationsSection = {
  id: OperationsSectionId;
  title: string;
  description: string;
  items: OperationalItem[];
};

const configured = (value: string | undefined) => Boolean(value && value.trim());
const nowIso = () => new Date().toISOString();

function configItem(id: string, label: string, present: boolean, detail: string, source: string): OperationalItem {
  return {
    id,
    label,
    status: present ? "VERIFIED" : "CONFIGURATION_REQUIRED",
    detail,
    evidenceClass: "CONFIGURATION",
    source: present ? source : `${source} missing`,
    verifiedAt: nowIso(),
  };
}

function deployments(): OperationsSection {
  const deployedOnVercel = process.env.VERCEL === "1";
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
  return {
    id: "deployments",
    title: "Deployments",
    description: "Release identity, environment, immutable commit evidence, and controlled promotion gates.",
    items: [
      {
        id: "runtime-provider",
        label: "Runtime provider",
        status: deployedOnVercel ? "VERIFIED" : "UNKNOWN",
        detail: deployedOnVercel ? `Vercel runtime detected (${env}).` : "Provider metadata is not exposed to this runtime.",
        evidenceClass: deployedOnVercel ? "PROVIDER_REPORTED" : "RUNTIME",
        source: deployedOnVercel ? "VERCEL/VERCEL_ENV" : "runtime environment",
        verifiedAt: nowIso(),
      },
      {
        id: "commit",
        label: "Release commit",
        status: commit ? "VERIFIED" : "UNKNOWN",
        detail: commit ?? "No provider commit SHA is available in this runtime.",
        evidenceClass: commit ? "PROVIDER_REPORTED" : "RUNTIME",
        source: "VERCEL_GIT_COMMIT_SHA",
        verifiedAt: commit ? nowIso() : null,
      },
      {
        id: "promotion-gate",
        label: "Production promotion",
        status: "READY",
        detail: "Production promotion remains evidence-gated; this console does not fabricate deployment success or bypass release review.",
        evidenceClass: "POLICY",
        source: "RTPSC controlled release policy",
        verifiedAt: nowIso(),
        action: "Review release evidence",
      },
    ],
  };
}

function health(): OperationsSection {
  const clerkConfigured = configured(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) && configured(process.env.CLERK_SECRET_KEY);
  const workerAdapterConfigured = configured(process.env.WORKER_ADAPTER_URL) && configured(process.env.WORKER_ADAPTER_TOKEN);
  return {
    id: "health",
    title: "Health & troubleshooting",
    description: "Fail-closed readiness checks for application, database, identity, integrations, workers, payments, and evidence services.",
    items: [
      {
        id: "application",
        label: "Application runtime",
        status: "VERIFIED",
        detail: `Node ${process.version}; runtime stage ${runtimeStage()}; uptime ${Math.floor(process.uptime())} seconds.`,
        evidenceClass: "RUNTIME",
        source: "process runtime",
        verifiedAt: nowIso(),
      },
      configItem("database", "Database", configured(process.env.DATABASE_URL), "PostgreSQL system-of-record connection reference.", "DATABASE_URL"),
      configItem("identity", "Identity", clerkConfigured, "Clerk publishable and server credentials required for authenticated control-plane access.", "Clerk key pair"),
      configItem("irs", "IRS integration boundary", configured(process.env.IRS_CLIENT_ID) && configured(process.env.IRS_CLIENT_SECRET), "Registered IRS client references; absence keeps provider actions gated.", "IRS client key pair"),
      configItem("stripe", "Payment boundary", configured(process.env.STRIPE_SECRET_KEY) && configured(process.env.STRIPE_WEBHOOK_SECRET), "Stripe server and webhook credentials for payment processing.", "Stripe key pair"),
      configItem("worker-adapter", "Durable worker adapter", workerAdapterConfigured, "External adapter required before data-dependent worker mutations can run.", "WORKER_ADAPTER_URL/TOKEN"),
      configItem("audit-key", "Audit signing", configured(process.env.AUDIT_SIGNING_KEY_ID), "Managed audit signing key reference.", "AUDIT_SIGNING_KEY_ID"),
    ],
  };
}

function security(): OperationsSection {
  const controls = securityReadiness();
  return {
    id: "security",
    title: "Security & compliance",
    description: "Security readiness and evidence controls. Readiness labels are engineering controls, not government certification.",
    items: Object.entries(controls).map(([id, control]) => ({
      id,
      label: id.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      status: control.status === "ready" ? "VERIFIED" : "CONFIGURATION_REQUIRED",
      detail: control.detail,
      evidenceClass: "CONFIGURATION",
      source: "RTPSC security readiness registry",
      verifiedAt: nowIso(),
    })),
  };
}

function optimization(): OperationsSection {
  const memory = process.memoryUsage();
  const engines = engineReadiness();
  const blocked = engines.filter((engine) => engine.state === "blocked");
  return {
    id: "optimization",
    title: "Optimization",
    description: "Runtime efficiency, engine readiness, rendering policy, and safe tuning evidence without unsupported performance claims.",
    items: [
      {
        id: "heap",
        label: "Node heap utilization",
        status: "VERIFIED",
        detail: `${Math.round(memory.heapUsed / 1024 / 1024)} MiB used of ${Math.round(memory.heapTotal / 1024 / 1024)} MiB allocated heap.`,
        evidenceClass: "RUNTIME",
        source: "process.memoryUsage()",
        verifiedAt: nowIso(),
      },
      {
        id: "engine-registry",
        label: "Runtime engines",
        status: blocked.length ? "CONFIGURATION_REQUIRED" : "READY",
        detail: `${engines.length} engines registered; ${blocked.length} currently report missing configuration references.`,
        evidenceClass: "RUNTIME",
        source: "runtime engine registry",
        verifiedAt: nowIso(),
      },
      {
        id: "cache-policy",
        label: "Control-plane cache policy",
        status: "READY",
        detail: "Operational status endpoints are no-store so stale provider or authorization state is not presented as current.",
        evidenceClass: "POLICY",
        source: "operations API contract",
        verifiedAt: nowIso(),
      },
      {
        id: "async-work",
        label: "Long-running work",
        status: "READY",
        detail: "Background work is routed to guarded workers instead of blocking interactive request paths.",
        evidenceClass: "DESIGN_CONTROL",
        source: "worker registry",
        verifiedAt: nowIso(),
      },
    ],
  };
}

function quotas(): OperationsSection {
  const maxJobs = process.env.OPS_MAX_CONCURRENT_JOBS ?? "25";
  const maxRetries = process.env.OPS_MAX_JOB_RETRIES ?? "5";
  const evidenceAge = process.env.OPS_MAX_EVIDENCE_AGE_MINUTES ?? "1440";
  return {
    id: "quotas",
    title: "Quotas & reservations",
    description: "Application policy limits. Provider account quotas remain UNKNOWN unless a provider supplies verified quota evidence.",
    items: [
      { id: "concurrency", label: "Concurrent guarded jobs", status: "READY", detail: `Policy ceiling: ${maxJobs}.`, evidenceClass: "POLICY", source: configured(process.env.OPS_MAX_CONCURRENT_JOBS) ? "OPS_MAX_CONCURRENT_JOBS" : "safe policy default", verifiedAt: nowIso() },
      { id: "retries", label: "Maximum job retries", status: "READY", detail: `Bounded retry ceiling: ${maxRetries}.`, evidenceClass: "POLICY", source: configured(process.env.OPS_MAX_JOB_RETRIES) ? "OPS_MAX_JOB_RETRIES" : "safe policy default", verifiedAt: nowIso() },
      { id: "freshness", label: "Maximum evidence age", status: "READY", detail: `${evidenceAge} minutes before evidence is considered stale by policy.`, evidenceClass: "POLICY", source: configured(process.env.OPS_MAX_EVIDENCE_AGE_MINUTES) ? "OPS_MAX_EVIDENCE_AGE_MINUTES" : "safe policy default", verifiedAt: nowIso() },
      { id: "provider-quota", label: "Provider account quota", status: "UNKNOWN", detail: "No provider quota API evidence is available inside the application runtime.", evidenceClass: "PROVIDER_REPORTED", source: "provider quota adapter not configured", verifiedAt: null },
    ],
  };
}

function maintenance(): OperationsSection {
  const workers = workerReadiness();
  const maintenanceWindow = process.env.OPS_MAINTENANCE_WINDOW ?? "Sunday 02:00-04:00 tenant local time (policy default)";
  return {
    id: "maintenance",
    title: "Maintenance",
    description: "Controlled maintenance windows, recurring integrity checks, stale-evidence sweeps, and worker execution policy.",
    items: [
      {
        id: "window",
        label: "Preferred maintenance window",
        status: "SCHEDULED",
        detail: maintenanceWindow,
        evidenceClass: "POLICY",
        source: configured(process.env.OPS_MAINTENANCE_WINDOW) ? "OPS_MAINTENANCE_WINDOW" : "policy default",
        verifiedAt: nowIso(),
      },
      ...workers.map((worker) => ({
        id: worker.code,
        label: worker.code.replaceAll("_", " "),
        status: worker.state === "active" ? "READY" as OperationalStatus : "CONFIGURATION_REQUIRED" as OperationalStatus,
        detail: `${worker.purpose} Schedule: ${worker.schedule}; execution: ${worker.execution}; deployment target: ${worker.deployment}; readiness: ${worker.state}.`,
        evidenceClass: "RUNTIME" as EvidenceClass,
        source: "worker readiness registry",
        verifiedAt: nowIso(),
      })),
    ],
  };
}

function support(): OperationsSection {
  return {
    id: "support",
    title: "Support",
    description: "Incident intake, diagnostic evidence, support-console routing, and escalation without exposing regulated data.",
    items: [
      { id: "support-console", label: "Support console", status: "READY", detail: "Authenticated support workspace is registered at /support-console.", evidenceClass: "DESIGN_CONTROL", source: "application route registry", verifiedAt: nowIso(), action: "Open support console" },
      { id: "guidance-api", label: "Guidance API", status: "READY", detail: "Support guidance endpoint is registered at /api/support/guidance.", evidenceClass: "DESIGN_CONTROL", source: "application route registry", verifiedAt: nowIso() },
      { id: "correlation", label: "Correlation IDs", status: "READY", detail: "Requests receive correlation IDs for evidence-safe troubleshooting and cross-service tracing.", evidenceClass: "DESIGN_CONTROL", source: "proxy request contract", verifiedAt: nowIso() },
    ],
  };
}

function topology(): OperationsSection {
  const nodes = ["Browser / Mobile", "Edge + Identity Gateway", "Versioned Application APIs", "Domain Services", "Private Connector Adapters", "Durable Worker Queues", "PostgreSQL + Evidence Store", "Append-only Audit Ledger"];
  return {
    id: "topology",
    title: "App Topology",
    description: "Controlled dependency graph. Topology describes approved architecture; it is not a claim that every external provider is currently online.",
    items: nodes.map((node, index) => ({
      id: `node-${index + 1}`,
      label: node,
      status: "READY",
      detail: index === 0 ? "Clients terminate at the application edge; browsers never connect directly to IRS, banking, payment, or transcript provider endpoints." : "Registered architecture node in the RTPSC controlled runtime topology.",
      evidenceClass: "DESIGN_CONTROL",
      source: "RTPSC engineering topology",
      verifiedAt: nowIso(),
    })),
  };
}

export function getOperationsSection(section: string): OperationsSection | null {
  switch (section) {
    case "deployments": return deployments();
    case "health": return health();
    case "security": return security();
    case "optimization": return optimization();
    case "quotas": return quotas();
    case "maintenance": return maintenance();
    case "support": return support();
    case "topology": return topology();
    default: return null;
  }
}

export function getOperationsSnapshot() {
  return {
    generatedAt: nowIso(),
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    evidenceRule: "External/provider claims remain UNKNOWN until supported by provider evidence.",
    sections: operationsSectionIds.map((id) => getOperationsSection(id)!),
  };
}
