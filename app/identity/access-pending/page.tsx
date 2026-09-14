import Link from "next/link";

export default function AccessPendingPage() {
  return (
    <main>
      <section className="pageHero">
        <p className="eyebrow">CONTROLLED ACCESS ISSUANCE</p>
        <h1>Enrollment received. Access remains gated.</h1>
        <p className="lede">
          Your identity must have a verified primary email and multifactor authentication
          before an authorized administrator can issue a production role.
        </p>
        <div className="notice">
          IRS-issued identifiers do not authenticate a user and do not grant software access.
          No taxpayer data is available while access is pending.
        </div>
        <div className="actions">
          <Link className="button primary" href="/sign-in">Return to sign in</Link>
        </div>
      </section>
    </main>
  );
}
