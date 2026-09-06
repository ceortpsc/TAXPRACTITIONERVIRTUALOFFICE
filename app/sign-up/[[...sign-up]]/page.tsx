import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main><section className="pageHero"><p className="eyebrow">IDENTITY CONFIGURATION</p><h1>Account enrollment is not active.</h1><p className="lede">Connect the designated Clerk application and validate the rosstaxsoftware.com SAML connection before inviting staff.</p></section></main>;
  }
  return <main><section className="pageHero"><p className="eyebrow">ROSS TAX PRO SOFTWARE CO.</p><h1>Secure account enrollment</h1><SignUp signInUrl="/sign-in" forceRedirectUrl="/office" /></section></main>;
}
