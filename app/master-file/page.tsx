import Link from "next/link";
import MasterFileWorkspace from "./MasterFileWorkspace";
import { masterFileChecks } from "@/lib/master-file";
import "./master-file.css";
import { requireIdentity } from "@/lib/identity";

export default async function MasterFile() {
  await requireIdentity();
  return (
    <main>
      <header>
        <Link href="/">← Virtual Office</Link>
        <nav><Link href="/refunds">Refunds</Link><Link href="/casework">Casework</Link></nav>
      </header>
      <section className="pageHero">
        <p className="eyebrow">TAX PRACTITIONER MASTER FILE</p>
        <h1>One controlled record.<br/><em>Every material event.</em></h1>
        <p className="lede">Create a canonical taxpayer master file, preserve source provenance, track authorization, and reconcile each material account event without storing a full TIN in this workflow.</p>
        <MasterFileWorkspace />
      </section>
      <section>
        <div className="heading"><div><p className="eyebrow">RECONCILIATION CONTROL</p><h2>Required checkpoints</h2></div><p>Every checkpoint starts as not available until supported by authoritative evidence.</p></div>
        <div className="masterFileChecks">
          {masterFileChecks.map(([code, label], index) => <article className="masterFileCheck" key={code}><span>{String(index + 1).padStart(2, "0")} · {code}</span><h3>{label}</h3><p>PASS · FLAG · HOLD · NOT AVAILABLE</p></article>)}
        </div>
      </section>
      <section className="dark">
        <div className="heading"><div><h2>Reconciliation rules</h2></div><p>Never infer an IRS release from elapsed time. Transaction codes, pending activity, freezes, offsets, authorizations, source dates, and the responsible function must be evaluated together before a practitioner records a conclusion.</p></div>
      </section>
    </main>
  );
}
