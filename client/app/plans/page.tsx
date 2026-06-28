import Link from "next/link";
import Image from "next/image";

const plans = [
  {
    name: "Starter",
    description: "For small PGs taking their first step into organized digital operations.",
    detail: "Core room and tenant operations",
  },
  {
    name: "Growth",
    description: "For active hostels with staff, guards, and daily resident workflows.",
    detail: "Operations, gate, payments, and community",
  },
  {
    name: "Custom",
    description: "For multi-property owners and teams with advanced operating needs.",
    detail: "Tailored modules, workflows, and support",
  },
];

export default function PlansPage() {
  return (
    <main className="marketingPage plansPage">
      <header className="topbar marketingNav">
        <Link className="brand markBrand" href="/" aria-label="Hostin home"><Image src="/brand/hostin-mark.png" alt="" width={52} height={52} priority /></Link>
        <nav className="topnav" aria-label="Plans navigation">
          <Link href="/#features">Features</Link>
          <Link href="/#roles">Who it helps</Link>
          <Link href="/#setup">Setup</Link>
          <Link className="activeNavLink" href="/plans">Plans</Link>
        </nav>
        <div className="navActions">
          <Link className="navDemo" href="/login#demo-accounts">Try demo</Link>
          <Link className="navLogin" href="/login">Log in</Link>
          <Link className="gradientButton" href="/#demo">Book free demo</Link>
        </div>
      </header>

      <section className="plansHero">
        <p className="sectionEyebrow">Flexible plans</p>
        <h1>A plan shaped around your property.</h1>
        <p>Pricing is based on your beds, properties, and selected modules. We’ll refine this page with final plan details soon.</p>
      </section>

      <section className="plansGrid" aria-label="Hostin plans">
        {plans.map((plan, index) => (
          <article className={`pricingCard ${index === 1 ? "popular" : ""}`} key={plan.name}>
            {index === 1 && <span>Most popular</span>}
            <small>{plan.name}</small>
            <h2>Custom pricing</h2>
            <p>{plan.description}</p>
            <strong>✓ {plan.detail}</strong>
            <Link className={index === 1 ? "gradientButton" : "outlineButton"} href="/#demo">Talk to our team</Link>
          </article>
        ))}
      </section>

      <section className="plansNote">
        <div><p className="sectionEyebrow">Need a closer look?</p><h2>Explore Hostin before choosing a plan.</h2></div>
        <div><Link className="outlineButton" href="/login#demo-accounts">Try every role</Link><Link className="gradientButton" href="/#demo">Book free demo</Link></div>
      </section>

      <footer className="marketingFooter">
        <Link className="brand markBrand footerMark" href="/" aria-label="Hostin home"><Image src="/brand/hostin-mark.png" alt="" width={52} height={52} /></Link>
        <p>A fully managed hostel and PG operating system by 1Forge.</p>
        <div><Link href="/">Home</Link><Link href="/login#demo-accounts">Try demo</Link><Link href="/login">Log in</Link></div>
        <small>© {new Date().getFullYear()} 1Forge. Built for better hostel operations.</small>
      </footer>
    </main>
  );
}
