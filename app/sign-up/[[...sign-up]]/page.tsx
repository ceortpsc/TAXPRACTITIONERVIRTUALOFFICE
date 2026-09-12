import ClerkAuthCard from "@/app/auth/ClerkAuthCard";

export default function SignUpPage() {
  return (
    <main>
      <section className="pageHero">
        <p className="eyebrow">ROSS TAX PRO SOFTWARE CO.</p>
        <h1>Secure account enrollment</h1>
        <p className="lede">Create the first production administrator account, then continue to the protected office workspace.</p>
        <ClerkAuthCard mode="sign-up" />
      </section>
    </main>
  );
}
