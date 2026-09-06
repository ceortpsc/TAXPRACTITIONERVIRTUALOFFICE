import Link from "next/link";
import { requireIdentity } from "@/lib/identity";
import { universities, universityPersonas } from "@/lib/university";

export default async function LearningWorkspacePage() {
  const principal = await requireIdentity();
  return <main><section className="pageHero"><p className="eyebrow">ONLINE LEARNING WORKSPACE</p><h1>Welcome to your AI-powered campus.</h1><p className="lede">Signed in as {principal.email ?? principal.subject}. Access is limited to assigned organizations, programs, courses, roles, and approved learning resources.</p></section><section><div className="heading"><div><p className="eyebrow">MY CAMPUS</p><h2>Learn, practice, and progress online.</h2></div><p>Seeded catalog data is demonstrational until the production database, enrollment adapter, and institutional approvals are verified.</p></div><div className="modules">{Object.values(universities).flatMap(u=>u.programs.slice(0,2).map(p=><article key={`${u.code}-${p.code}`}><span>{u.name}</span><h3>{p.title}</h3><p>Lessons, progress, assessments, AI tutoring, faculty review, and credential-readiness gates.</p></article>))}</div></section><section className="dark"><div className="heading"><div><p className="eyebrow">AVAILABLE PERSONAS</p><h2>Your digital faculty and support team.</h2></div></div><div className="cards">{universityPersonas.slice(0,6).map(p=><article key={p.code}><span>{p.title}</span><h3>{p.function}</h3><p>{p.approval}</p></article>)}</div><div className="actions"><Link className="button" href="/office">Return to virtual office</Link></div></section></main>;
}
