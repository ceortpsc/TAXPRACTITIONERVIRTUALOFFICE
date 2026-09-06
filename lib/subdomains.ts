export type SubdomainDefinition = { host: string; destination: string; product: string; access: "public" | "authenticated" | "infrastructure"; dns: "vercel" | "clerk" | "email" };
export const subdomains: readonly SubdomainDefinition[] = [
  { host: "www", destination: "/", product: "Corporate Gateway", access: "public", dns: "vercel" },
  { host: "office", destination: "/office", product: "Tax Practitioner Virtual Office", access: "authenticated", dns: "vercel" },
  { host: "etrac", destination: "/refunds", product: "eTRAC Refund Intelligence", access: "authenticated", dns: "vercel" },
  { host: "casework", destination: "/casework", product: "Casework and Interventions", access: "authenticated", dns: "vercel" },
  { host: "university", destination: "/platforms/ross-tax-pro-university", product: "Ross Tax Pro University", access: "public", dns: "vercel" },
  { host: "learn", destination: "/platforms/ross-tax-pro-university", product: "Ross Learn LMS", access: "authenticated", dns: "vercel" },
  { host: "edrive", destination: "/platforms/ross-e-drive-university", product: "Ross E-Drive University", access: "public", dns: "vercel" },
  { host: "payroll", destination: "/platforms/ross-prime-payroll", product: "Ross Prime Payroll", access: "public", dns: "vercel" },
  { host: "hr", destination: "/platforms/ross-prime-payroll", product: "Ross Human Resources", access: "authenticated", dns: "vercel" },
  { host: "pdf", destination: "/platforms/ross-pdf-editor", product: "Ross PDF Universal Editor", access: "public", dns: "vercel" },
  { host: "training", destination: "/platforms/tax-solutions-training", product: "Tax Solutions and Training", access: "public", dns: "vercel" },
  { host: "support", destination: "/platforms/support", product: "Enterprise Support Desk", access: "public", dns: "vercel" },
  { host: "status", destination: "/api/health", product: "Platform Status", access: "public", dns: "vercel" },
  { host: "clerk", destination: "frontend-api.clerk.services", product: "Clerk Frontend API", access: "infrastructure", dns: "clerk" },
  { host: "accounts", destination: "accounts.clerk.services", product: "Clerk Account Portal", access: "infrastructure", dns: "clerk" },
  { host: "clkmail", destination: "mail.w6xlczsz1u4s.clerk.services", product: "Clerk Primary Email", access: "infrastructure", dns: "email" },
  { host: "clk._domainkey", destination: "dkim1.w6xlczsz1u4s.clerk.services", product: "Clerk DKIM 1", access: "infrastructure", dns: "email" },
  { host: "clk2._domainkey", destination: "dkim2.w6xlczsz1u4s.clerk.services", product: "Clerk DKIM 2", access: "infrastructure", dns: "email" }
] as const;
export function destinationForHost(hostname: string): string | null { const normalized=hostname.toLowerCase().split(":")[0]; if(!normalized.endsWith(".rosstaxsoftware.com")) return null; const host=normalized.slice(0,-".rosstaxsoftware.com".length); return subdomains.find((item)=>item.host===host&&item.dns==="vercel")?.destination??null; }
