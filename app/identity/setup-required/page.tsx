import Link from "next/link";

export default function IdentitySetupRequired() {
  return <main><section className="pageHero"><p className="eyebrow">ACCESS CONTROL</p><h1>Identity setup required.</h1><p className="lede">Staff routes remain closed until Clerk and the rosstaxsoftware.com SAML connection pass validation.</p><Link href="/">Return to public site</Link></section></main>;
}
