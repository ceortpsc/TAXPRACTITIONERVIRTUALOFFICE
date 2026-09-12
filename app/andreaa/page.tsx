import Image from "next/image";
import Link from "next/link";

const capabilities = [
  ["Navigate", "Route visitors to tax operations, payroll, education, documents, support, and secure workspaces."],
  ["Explain", "Translate product features, workflow states, and platform terminology into clear next steps."],
  ["Triage", "Help organize questions and direct users toward the appropriate human or governed system surface."],
  ["Guide", "Surface relevant resources, policies, forms, and support paths without claiming unsupported outcomes."],
] as const;

const controls = [
  "No autonomous tax, payroll, legal, academic, lending, or employment determinations.",
  "No guarantee of refunds, approvals, releases, admissions, grades, payments, or government outcomes.",
  "Sensitive actions remain behind identity, authorization, role, and human-review gates.",
  "Production claims must be supported by provider or runtime evidence.",
] as const;

export default function AndreaaPage() {
  return (
    <main className="personaPage">
      <header className="siteHeader">
        <Link className="brandLockup" href="/" aria-label="Ross Tax Pro Software Co. home">
          <Image src="/brand/rtpsc-logo-horizontal.svg" alt="Ross Tax Pro Software Co." width={600} height={130} priority />
        </Link>
        <nav aria-label="Andreaa navigation">
          <Link href="/platforms">Platforms</Link>
          <Link href="/support">Support</Link>
          <Link href="/sign-in">Sign In</Link>
        </nav>
      </header>

      <section className="personaHero">
        <div className="personaHeroMedia">
          <Image src="/brand/andreaa-persona.svg" alt="Stylized Andreaa Chan’nel digital concierge persona" width={1200} height={1500} priority />
        </div>
        <div className="personaHeroCopy">
          <div className="personaStatus"><span aria-hidden="true" /> DIGITAL PERSONA</div>
          <p className="eyebrow">RTPSC GUIDANCE LAYER</p>
          <h1>Andreaa<br /><em>Chan’nel.</em></h1>
          <p className="lede">A branded digital concierge designed to help people move through the Ross Tax Pro Software Co. ecosystem with clearer navigation, product guidance, support triage, and governed assistance.</p>
          <div className="actions">
            <Link className="button primary" href="/support">Start with support</Link>
            <Link className="button" href="/platforms">Explore platforms</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="heading">
          <div><p className="eyebrow">CAPABILITIES</p><h2>Helpful by design. Bounded by control.</h2></div>
          <p>Andreaa is positioned as a product-navigation and guidance persona—not as a substitute for licensed, authorized, or accountable human decision-makers.</p>
        </div>
        <div className="personaCapabilityGrid">
          {capabilities.map(([title, description], index) => (
            <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="dark">
        <div className="heading">
          <div><p className="eyebrow">GOVERNANCE</p><h2>Human review stays in the loop.</h2></div>
          <p>Persona responses can be incomplete or mistaken. Regulated and consequential workflows remain subject to the platform’s identity, authorization, evidence, and approval controls.</p>
        </div>
        <ul className="personaControlList">{controls.map((control) => <li key={control}>{control}</li>)}</ul>
      </section>

      <footer>
        <Image src="/brand/rtpsc-logo-horizontal.svg" alt="Ross Tax Pro Software Co." width={340} height={74} />
        <p>Andreaa is a digital brand persona. Guidance may contain errors and should be reviewed before consequential action.</p>
      </footer>
    </main>
  );
}
