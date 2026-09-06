import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const excluded = new Set(["node_modules", ".next", ".git", "output", ".tools"]);
const findings = [];
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["live Stripe secret", /sk_live_[A-Za-z0-9]{16,}/],
  ["unredacted SSN", /\b\d{3}-\d{2}-\d{4}\b/],
];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (excluded.has(entry)) continue;
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (stat.size < 2_000_000 && !/\.(?:png|jpg|jpeg|pdf|ico|woff2?)$/i.test(entry)) {
      const content = readFileSync(path, "utf8");
      for (const [name, pattern] of patterns) if (pattern.test(content)) findings.push(`${relative(root, path)}: ${name}`);
    }
  }
}

walk(root);
if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}
console.log("Security static checks passed: no committed private keys, live Stripe secrets, or SSN-shaped values.");
