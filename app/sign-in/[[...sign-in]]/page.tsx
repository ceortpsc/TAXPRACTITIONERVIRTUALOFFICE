import ClerkAuthCard from "@/app/auth/ClerkAuthCard";

export default function SignInPage() {
  return (
    <main>
      <section className="pageHero">
        <p className="eyebrow">ROSS TAX PRO SOFTWARE CO.</p>
        <h1>Secure staff sign-in</h1>
        <p className="lede">Authenticate to access the production Tax Practitioner Virtual Office.</p>
        <ClerkAuthCard mode="sign-in" />
      </section>
    </main>
  );
}
