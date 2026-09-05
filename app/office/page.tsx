import { UserButton } from "@clerk/nextjs";
import { requireIdentity } from "@/lib/identity";

export default async function OfficePage() {
  const principal = await requireIdentity();
  return <main><section className="pageHero"><p className="eyebrow">SECURE VIRTUAL OFFICE</p><h1>Welcome to your controlled workspace.</h1><p className="lede">Signed in as {principal.email ?? principal.subject}. Assigned roles: {principal.roles.join(", ") || "pending assignment"}.</p><UserButton /></section></main>;
}
