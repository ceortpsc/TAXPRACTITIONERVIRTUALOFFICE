import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import { verifyVercelOidcToken } from "./vercel-oidc.mjs";

const MAX_BODY_BYTES = 256 * 1024;
const MAX_WORKERS_PER_PLAN = 50;
const SERVICE = "rtpsc-worker-adapter";

function json(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
    ...extraHeaders,
  });
  res.end(payload);
}

function configured(name) {
  const value = process.env[name];
  return Boolean(value && value.trim());
}

function safeTokenMatch(actual, expected) {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function oidcConfigured() {
  return Boolean(process.env.VERCEL_EXPECTED_OWNER_ID && process.env.VERCEL_EXPECTED_PROJECT_ID);
}

async function authenticateBearer(presentedToken) {
  if (!presentedToken) return null;
  const expectedToken = process.env.WORKER_ADAPTER_TOKEN;
  if (safeTokenMatch(presentedToken, expectedToken)) return { mode: "shared_token" };
  if (!oidcConfigured()) return null;

  try {
    const identity = await verifyVercelOidcToken(presentedToken);
    return { mode: "vercel_oidc", identity };
  } catch {
    return null;
  }
}

function readiness() {
  const tokenConfigured = configured("WORKER_ADAPTER_TOKEN");
  const workloadIdentityConfigured = oidcConfigured();
  const authenticationConfigured = tokenConfigured || workloadIdentityConfigured;
  const databaseConfigured = configured("DATABASE_URL");
  const executorEnabled = process.env.WORKER_ADAPTER_EXECUTION_ENABLED === "true";
  const ready = authenticationConfigured && databaseConfigured && executorEnabled;
  return {
    status: ready ? "ready" : "degraded",
    service: SERVICE,
    stage: process.env.RENDER_SERVICE_NAME ? "render" : (process.env.NODE_ENV ?? "development"),
    checks: {
      token: tokenConfigured ? "configured" : "not_configured",
      oidc: workloadIdentityConfigured ? "configured" : "not_configured",
      database: databaseConfigured ? "configured" : "not_configured",
      execution: executorEnabled ? "enabled" : "disabled",
    },
    capabilities: {
      authenticatedPlanIntake: authenticationConfigured,
      authenticationModes: [
        ...(tokenConfigured ? ["shared_token"] : []),
        ...(workloadIdentityConfigured ? ["vercel_oidc"] : []),
      ],
      durableExecution: ready,
      dataMutationClaimed: false,
    },
  };
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const error = new Error("PAYLOAD_TOO_LARGE");
      error.code = "PAYLOAD_TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return "Plan must be an object.";
  if (typeof plan.runId !== "string" || plan.runId.length < 8 || plan.runId.length > 128) return "runId is required.";
  if (!Array.isArray(plan.workers) || plan.workers.length < 1 || plan.workers.length > MAX_WORKERS_PER_PLAN) {
    return `workers must contain between 1 and ${MAX_WORKERS_PER_PLAN} entries.`;
  }
  const seen = new Set();
  for (const worker of plan.workers) {
    if (!worker || typeof worker !== "object") return "Each worker must be an object.";
    if (typeof worker.code !== "string" || !/^[a-z0-9_]{3,80}$/.test(worker.code)) return "Invalid worker code.";
    if (seen.has(worker.code)) return "Duplicate worker code in plan.";
    seen.add(worker.code);
    if (typeof worker.group !== "string" || !/^[a-z0-9_]{3,80}$/.test(worker.group)) return "Invalid worker group.";
    if (!Number.isInteger(worker.concurrency) || worker.concurrency < 1 || worker.concurrency > 100) return "Invalid concurrency.";
    if (!Number.isInteger(worker.timeoutSeconds) || worker.timeoutSeconds < 1 || worker.timeoutSeconds > 900) return "Invalid timeoutSeconds.";
  }
  return null;
}

export function createWorkerAdapterServer() {
  return createServer(async (req, res) => {
    const requestId = req.headers["x-worker-run-id"] || randomUUID();
    const headers = { "x-worker-adapter-request-id": String(requestId) };

    if (req.method === "GET" && req.url === "/healthz") {
      return json(res, 200, readiness(), headers);
    }

    if (req.method !== "POST" || (req.url !== "/" && req.url !== "/authz")) {
      return json(res, 404, { error: "NOT_FOUND" }, headers);
    }

    const auth = req.headers.authorization;
    const presentedToken = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
    const authenticated = await authenticateBearer(presentedToken);
    if (!authenticated) return json(res, 401, { error: "UNAUTHORIZED" }, headers);
    headers["x-worker-auth-mode"] = authenticated.mode;

    if (req.url === "/authz") {
      return json(res, 200, {
        authenticated: true,
        mode: authenticated.mode,
        dataMutationClaimed: false,
      }, headers);
    }

    let plan;
    try {
      plan = await readJsonBody(req);
    } catch (error) {
      if (error?.code === "PAYLOAD_TOO_LARGE") return json(res, 413, { error: "PAYLOAD_TOO_LARGE" }, headers);
      return json(res, 400, { error: "INVALID_JSON" }, headers);
    }

    const validationError = validatePlan(plan);
    if (validationError) return json(res, 400, { error: "INVALID_PLAN", detail: validationError }, headers);

    const state = readiness();
    if (state.checks.database !== "configured") {
      return json(res, 503, {
        error: "DATABASE_REQUIRED",
        state: "blocked",
        runId: plan.runId,
        acceptedWorkers: plan.workers.map((worker) => worker.code),
        dataMutationClaimed: false,
      }, headers);
    }

    if (state.checks.execution !== "enabled") {
      return json(res, 503, {
        error: "EXECUTION_DISABLED",
        state: "blocked",
        runId: plan.runId,
        acceptedWorkers: plan.workers.map((worker) => worker.code),
        dataMutationClaimed: false,
      }, headers);
    }

    return json(res, 501, {
      error: "EXECUTOR_NOT_IMPLEMENTED",
      state: "blocked",
      runId: plan.runId,
      acceptedWorkers: plan.workers.map((worker) => worker.code),
      dataMutationClaimed: false,
    }, headers);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 10000);
  const server = createWorkerAdapterServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(JSON.stringify({ service: SERVICE, event: "listening", port, readiness: readiness() }));
  });
}
