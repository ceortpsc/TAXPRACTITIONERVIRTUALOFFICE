import Link from "next/link";
import { applicationReadiness, proposedDegreeInventory, regulatoryApplicant, regulatoryHardGates, regulatorySections } from "@/lib/regulatory-application";

export const metadata = {
  title: "Regulatory Application | Ross Tax Pro University",
  description: "Controlled institutional authorization application workspace with seeded autofill, evidence tracking, and hard regulatory gates.",
};

function statusClass(status: string) {
  if (status === "blocked") return "blocked";
  if (status.includes("required")) return "review";
  return "active";
}

export default function RegulatoryApplicationPage() {
  const readiness = applicationReadiness();
  return (
    <main>
      <section className="pageHero">
        <p className="eyebrow">INSTITUTIONAL AUTHORIZATION</p>
        <h1>Application data seeded.<br/><em>Claims still gated.</em></h1>
        <p className="lede">The 26-section regulatory application workspace uses verified institutional source data where available, identifies missing documentary evidence, and blocks degree enrollment, conferral, accreditation, Title IV, NSLDS, and .edu approval claims until independently established.</p>
        <div className="actions">
          <Link className="button" href="/universities/governance">Governance registry</Link>
          <Link className="button primary" href="/universities/academics">Academic programs</Link>
        </div>
      </section>

      <section>
        <div className="heading"><div><p className="eyebrow">MASTER APPLICANT RECORD</p><h2>Controlled autofill source</h2></div><p>Institutional identity values are preloaded from the project record. Externally issued identifiers and approvals remain intentionally unfilled until evidence is attached and verified.</p></div>
        <div className="table"><table><tbody>
          <tr><th>Legal applicant</th><td>{regulatoryApplicant.legalApplicantName}</td></tr>
          <tr><th>Proposed institution</th><td>{regulatoryApplicant.proposedInstitutionName}</td></tr>
          <tr><th>Formation</th><td>{regulatoryApplicant.formationJurisdiction} · {regulatoryApplicant.formationDate} · Entity {regulatoryApplicant.entityId}</td></tr>
          <tr><th>Texas location</th><td>{regulatoryApplicant.proposedTexasLocation}</td></tr>
          <tr><th>Degree authority</th><td><span className="status blocked">{regulatoryApplicant.degreeAuthorityStatus.replaceAll("_", " ")}</span></td></tr>
          <tr><th>Accreditation</th><td><span className="status blocked">{regulatoryApplicant.institutionalAccreditationStatus.replaceAll("_", " ")}</span></td></tr>
          <tr><th>Title IV</th><td><span className="status blocked">{regulatoryApplicant.titleIVStatus}</span></td></tr>
          <tr><th>Actual degree students</th><td>{regulatoryApplicant.actualDegreeStudentCount}</td></tr>
        </tbody></table></div>
      </section>

      <section className="dark">
        <div className="heading"><div><p className="eyebrow">READINESS SNAPSHOT</p><h2>Submission is not yet unlocked.</h2></div><p>{readiness.total} controlled sections · {readiness.evidenceRequired} evidence-required · {readiness.externalVerification} external-verification · {readiness.signatureRequired} signature-required · {readiness.blocked} blocked.</p></div>
        <div className="cards">
          <article><span>INTERNAL REVIEW</span><h3>{readiness.readyForInternalReview} sections</h3><p>Structurally seeded and ready for internal evidence review.</p></article>
          <article><span>TRANSMISSION</span><h3>BLOCKED</h3><p>No regulator-facing submission or federal enrollment transmission is represented as complete.</p></article>
          <article><span>DEGREE CONFERRAL</span><h3>DISABLED</h3><p>Official AA/AS/BA/BS conferral remains locked pending verified legal authority.</p></article>
        </div>
      </section>

      <section>
        <div className="heading"><div><p className="eyebrow">PROPOSED DEGREE INVENTORY</p><h2>Programs under development</h2></div><p>Program records are intentionally marked proposed; they do not constitute regulator authorization.</p></div>
        <div className="table"><table><thead><tr><th>Code</th><th>Credential</th><th>Program</th><th>Status</th></tr></thead><tbody>{proposedDegreeInventory.map((program) => <tr key={program.code}><td>{program.code}</td><td>{program.credential}</td><td>{program.title}</td><td><span className="status review">{program.authorization}</span></td></tr>)}</tbody></table></div>
      </section>

      <section>
        <div className="heading"><div><p className="eyebrow">26-SECTION APPLICATION</p><h2>Autofill + evidence matrix</h2></div><p>Each section exposes the institutional owner, fields available for autofill, documentary evidence still required, and any transmission blocker.</p></div>
        <div className="cards light">{regulatorySections.map((section) => <article key={section.code}><span>{String(section.number).padStart(2, "0")} · {section.code}</span><h3>{section.title}</h3><p><b>Owner:</b> {section.owner}</p><p><b>Autofill:</b> {section.autofill.join(" · ")}</p><p><b>Evidence:</b> {section.requiredEvidence.join(" · ")}</p><p><b>Blockers:</b> {section.blockers.join(" · ")}</p><span className={`status ${statusClass(section.status)}`}>{section.status.replaceAll("_", " ")}</span></article>)}</div>
      </section>

      <section className="dark">
        <div className="heading"><div><p className="eyebrow">HARD GATES</p><h2>Consequential operations stay off.</h2></div><p>These controls are deliberately false until documentary and external prerequisites exist.</p></div>
        <div className="table"><table><thead><tr><th>Capability</th><th>Enabled</th></tr></thead><tbody>{Object.entries(regulatoryHardGates).map(([capability, enabled]) => <tr key={capability}><td>{capability.replaceAll(/([A-Z])/g, " $1")}</td><td><span className={`status ${enabled ? "active" : "blocked"}`}>{enabled ? "YES" : "NO"}</span></td></tr>)}</tbody></table></div>
      </section>

      <section className="disclaimer"><b>Regulatory control notice:</b> Seeded or internally reviewable means the software record is prepared for institutional review. It does not mean the institution, program, degree, accreditation, federal-aid participation, NSLDS access, or .edu domain has been approved by a regulator or accreditor.</section>
    </main>
  );
}
