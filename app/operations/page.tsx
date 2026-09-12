import type { Metadata } from "next";
import Link from "next/link";
import { requireIdentity } from "@/lib/identity";
import { getOperationsSnapshot } from "@/lib/operations-center";
import OperationsConsole from "./OperationsConsole";
import "./operations.css";

export const metadata: Metadata = {
  title: "Operations Control Center",
  description: "RTPSC deployment, health, security, optimization, quota, maintenance, support, and topology control plane.",
};

const operationsRoles = new Set(["owner", "super_admin", "firm_admin", "compliance_officer", "auditor"]);

export default async function OperationsPage() {
  const principal = await requireIdentity();
  const authorized = principal.roles.some((role) => operationsRoles.has(role));

  if (!authorized) {
    return (
      <main className="opsDenied">
        <section>
          <p className="eyebrow">OPERATIONS CONTROL CENTER</p>
          <h1>Access gated.</h1>
          <p className="lede">This workspace requires an owner, super administrator, firm administrator, compliance officer, or auditor role. No operational data was disclosed.</p>
          <Link className="button primary" href="/office">Return to Virtual Office</Link>
        </section>
      </main>
    );
  }

  const snapshot = getOperationsSnapshot();
  return (
    <main className="opsShell">
      <OperationsConsole initialSnapshot={snapshot} principal={{ email: principal.email, roles: principal.roles }} />
    </main>
  );
}
