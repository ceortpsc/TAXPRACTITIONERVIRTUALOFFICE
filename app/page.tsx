import Link from "next/link";
import { authorizations, conflicts, modules } from "@/lib/registry";

const label = { active: "Active", review: "Review", test: "Test only", blocked: "Blocked" } as const;

export default function Home() {
  return <main>
    <header><b>ROSS TAX PRO SOFTWARE CO.</b><nav><Link href="/platforms">Platforms</Link><Link href="/solutions">Solutions</Link><Link href="/training">Training</Link><Link href="/support">Support</Link><Link href="/sign-in">Sign In</Link></nav></header>
    <section className="hero"><p className="eyebrow">TAXES · PEOPLE · TECHNOLOGY</p><h1>Tax intelligence for<br/><em>a brighter tomorrow.</em></h1><p className="lede">One corporate gateway for professional tax operations, training, workforce services, document tools, and secure virtual-office support.</p><div className="actions"><Link className="button primary" href="/platforms">Explore platforms</Link><Link className="button" href="/sign-in">Sign in securely</Link></div></section>
    <section><div className="heading"><div><p className="eyebrow">AUTHORIZATION CONTROL</p><h2>Registered authority</h2></div><p>Source status and platform readiness are separate controls. Identifiers remain masked and production credentials remain outside source control.</p></div><div className="table"><table><thead><tr><th>System</th><th>Authority</th><th>Reference</th><th>Environment</th><th>IRS/source status</th><th>Platform gate</th></tr></thead><tbody>{authorizations.map(a=><tr key={a[0]+a[1]}>{a.slice(0,5).map((v,i)=><td key={`${v}-${i}`}>{v}</td>)}<td><span className={`status ${a[5]}`}>{label[a[5]]}</span></td></tr>)}</tbody></table></div></section>
    <section className="dark"><div className="heading"><div><p className="eyebrow">RECONCILIATION GATES</p><h2>Resolve before release</h2></div><p>Application logic blocks production actions wherever identity, authorization, testing, or security evidence is incomplete.</p></div><div className="cards">{conflicts.map((c,i)=><article key={c[1]}><span>0{i+1} · {c[0]}</span><h3>{c[1]}</h3><p>{c[2]}</p><b className={`status ${c[3]}`}>{label[c[3]]}</b></article>)}</div></section>
    <section><div className="heading"><div><p className="eyebrow">OPERATIONS</p><h2>One accountable workspace</h2></div></div><div className="modules">{modules.map((m,i)=><article key={m[0]}><span>0{i+1}</span><h3>{m[0]}</h3><p>{m[1]}</p></article>)}</div></section>
    <footer>Operational workflow software—not legal or tax advice. No refund, release, or IRS action is guaranteed.</footer>
  </main>;
}
