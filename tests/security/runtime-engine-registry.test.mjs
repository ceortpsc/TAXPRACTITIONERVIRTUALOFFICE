import test from "node:test";
import assert from "node:assert/strict";
import { engineRegistry, engineReadiness, runtimeStage } from "../../lib/runtime/engine-registry.ts";

test("engine registry has unique governed engines", () => {
  const codes = engineRegistry.map((engine) => engine.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(engineRegistry.length >= 8);
  assert.ok(engineRegistry.every((engine) => engine.ownerGroup && engine.responsibilities.length > 0));
  assert.ok(engineRegistry.every((engine) => engine.stageScopes.includes("production")));
  assert.ok(engineRegistry.every((engine) => engine.scaling.maxConcurrency > 0 && engine.scaling.timeoutMs > 0));
});

test("runtime stage resolves known environments safely", () => {
  assert.equal(runtimeStage({ NODE_ENV: "test" }), "test");
  assert.equal(runtimeStage({ VERCEL_ENV: "preview" }), "preview");
  assert.equal(runtimeStage({ VERCEL_ENV: "production" }), "production");
  assert.equal(runtimeStage({ VERCEL_ENV: "unexpected" }), "development");
});

test("identity readiness fails closed when keys are absent", () => {
  const readiness = engineReadiness({ VERCEL_ENV: "production" });
  const identity = readiness.find((engine) => engine.code === "clerk_identity");
  assert.ok(identity);
  assert.equal(identity.state, "blocked");
  assert.deepEqual(identity.missingConfiguration.sort(), ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"].sort());
});
