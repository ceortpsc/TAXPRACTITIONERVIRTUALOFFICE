import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireIdentity } from "@/lib/identity";

const operationsRoles = new Set(["owner", "super_admin", "firm_admin", "compliance_officer", "auditor"]);

export default async function OfficePage() {
  const principal = await requireIdentity();
  const canOperate = principal.roles.some((role) => operationsRoles.has(role));

  return (
    <main>
      <section className="pageHero">
        <p className="eyebrow">SECURE VIRTUAL OFFICE</p>
        <h1>Welcome to your controlled workspace.</h1>
        <p className="lede">Signed in as {principal.email ?? principal.subject}. Assigned roles: {principal.roles.join(", ") || "pending assignment"}.</p>
        <div className="actions">
          {canOperate ? <Link className="button primary" href="/operations">Open Operations Control Center</Link> : null}
          <Link className="button" href="/master-file">Open Master File</Link>
        </div>
        <div style={{ marginTop: 24 }}><UserButton /></div>
      </section>
    </main>
  );
}
