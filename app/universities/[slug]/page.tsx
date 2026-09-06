import Link from "next/link";
import { notFound } from "next/navigation";
import { universities, universityBySlug } from "@/lib/university";

export function generateStaticParams() { return Object.values(universities).map(({ slug }) => ({ slug })); }

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const university = universityBySlug((await params).slug);
  if (!university) notFound();
  return <main><section className="pageHero"><p className="eyebrow">100% ONLINE · AI-ASSISTED</p><h1>{university.name}</h1><p className="lede">{university.statement}</p><div className="actions"><Link className="button primary" href="/sign-up">Create student account</Link><Link className="button" href="/universities">University directory</Link></div></section><section><div className="heading"><div><p className="eyebrow">PROGRAM DIRECTORY</p><h2>Structured, measurable learning.</h2></div><p>All catalog details remain subject to published enrollment terms, instructor oversight, applicable approvals, and program-specific completion requirements.</p></div><div className="modules">{university.programs.map(program=><article key={program.code}><span>{program.code} · {program.mode.replaceAll("_"," ")}</span><h3>{program.title}</h3><p>{program.hours} planned instructional hours with lessons, practice, assessments, progress checks, and human-governed completion review.</p></article>)}</div></section><footer><p>© 2026 Ross Tax Pro Software Co. AI personas support instruction; authorized humans retain consequential academic authority.</p><Link href="/support">Support</Link></footer></main>;
}
