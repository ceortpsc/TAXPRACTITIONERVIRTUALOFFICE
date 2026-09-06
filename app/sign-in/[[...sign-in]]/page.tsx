import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main><section className="pageHero"><p className="eyebrow">IDENTITY CONFIGURATION</p><h1>Sign-in is being secured.</h1><p className="lede">Clerk credentials and the verified SAML connection must be installed before staff access opens.</p></section></main>;
  }
  return <main><section className="pageHero"><p className="eyebrow">ROSS TAX PRO SOFTWARE CO.</p><h1>Secure staff sign-in</h1><SignIn signUpUrl="/sign-up" forceRedirectUrl="/office" /></section></main>;
}
