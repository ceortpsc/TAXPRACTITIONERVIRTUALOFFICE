import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("homepage embeds the governed brand ambassador experience", async () => {
  const [home, ambassadors, registry] = await Promise.all([
    read("app/page.tsx"),
    read("app/components/BrandAmbassadors.tsx"),
    read("lib/brand-ambassadors.ts"),
  ]);
  assert.match(home, /<BrandAmbassadors\s*\/>/);
  assert.match(ambassadors, /andreaa-persona\.svg/);
  assert.match(registry, /Andreaa Chan’nel/);
  assert.match(registry, /digital persona/i);
  assert.match(registry, /human review/i);
});

test("brand assets and PWA manifest use repository-backed scalable files", async () => {
  const [manifest, layout, logo, persona, appIcon] = await Promise.all([
    read("public/manifest.webmanifest"),
    read("app/layout.tsx"),
    read("public/brand/rtpsc-logo-horizontal.svg"),
    read("public/brand/andreaa-persona.svg"),
    read("public/brand/rtpsc-app-icon.svg"),
  ]);
  assert.doesNotMatch(manifest, /\/icons\/icon-\d+\.png/);
  assert.match(manifest, /rtpsc-app-icon\.svg/);
  assert.match(layout, /favicon\.svg/);
  assert.match(logo, /ROSS TAX PRO/);
  assert.match(persona, /Andreaa Chan/);
  assert.match(appIcon, /Maskable navy application icon/);
});

test("social and Apple image routes are generated in code", async () => {
  const [og, apple] = await Promise.all([
    read("app/opengraph-image.tsx"),
    read("app/apple-icon.tsx"),
  ]);
  assert.match(og, /1200/);
  assert.match(og, /630/);
  assert.match(og, /ImageResponse/);
  assert.match(apple, /180/);
  assert.match(apple, /ImageResponse/);
});
