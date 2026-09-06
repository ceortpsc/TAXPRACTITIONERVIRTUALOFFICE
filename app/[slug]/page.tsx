import Link from "next/link";
import { notFound } from "next/navigation";
import { isPublicPageSlug, publicPageContent } from "@/lib/public-content";

export function generateStaticParams() {
  return Object.keys(publicPageContent).map((slug) => ({ slug }));
}

export default async function CorporatePublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPublicPageSlug(slug)) notFound();
  const page = publicPageContent[slug];
  return <main>
    <header><Link href="/"><b>ROSS TAX PRO SOFTWARE CO.</b></Link><nav><Link href="/platforms">Platforms</Link><Link href="/solutions">Solutions</Link><Link href="/training">Training</Link><Link href="/support">Support</Link><Link href="/sign-in">Sign In</Link></nav></header>
    <section className="pageHero"><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="lede">{page.description}</p><div className="actions"><Link className="button primary" href="/sign-in">Enter secure workspace</Link><Link className="button" href="/contact">Contact our team</Link></div></section>
    <section><div className="heading"><div><p className="eyebrow">CAPABILITIES</p><h2>Designed for accountable delivery.</h2></div><p>Availability depends on authorization, configuration, training, and applicable compliance approval. Public descriptions do not activate regulated services.</p></div><div className="modules">{page.items.map((item, index)=><article key={item}><span>{String(index + 1).padStart(2,"0")}</span><h3>{item}</h3><p>Delivered through documented workflows, role-based access, audit events, and human review where required.</p></article>)}</div></section>
    <footer>© 2026 Ross Tax Pro Software Co. Operational information only. No refund, legal, tax, payroll, or financial outcome is guaranteed.</footer>
  </main>;
}
