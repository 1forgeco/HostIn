"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";

const extensions = [
  {
    id: "guard",
    name: "Guard",
    price: 500,
    icon: "ri-shield-user-line",
    accountNote: "Includes 2 guard accounts",
    description: "Gate pass approvals, visitor entry, check-in and check-out movement controls.",
  },
  {
    id: "mess",
    name: "Mess Manager",
    price: 200,
    icon: "ri-restaurant-2-line",
    accountNote: "Includes 2 mess manager accounts",
    description: "Mess menu publishing, meal updates, resident feedback, and weekly menu operations.",
  },
  {
    id: "vault",
    name: "Vault Management",
    price: 300,
    icon: "ri-folder-shield-2-line",
    accountNote: "Document storage and verification tools",
    description: "Document vault, student records, verification status, and controlled document access.",
  },
] as const;

const packages = [
  {
    name: "Basic",
    badge: "Starter choice",
    range: "10-40 beds",
    minBeds: 10,
    maxBeds: 40,
    rate: 179,
    extensionMode: "₹1,000 bundle",
    description: "For smaller PGs that want structured owner, warden, and tenant operations.",
    bestFor: "10-40 bed PGs",
    highlight: false,
    accent: "neutral",
  },
  {
    name: "Plus",
    badge: "Best value",
    range: "40-100 beds",
    minBeds: 40,
    maxBeds: 100,
    rate: 149,
    extensionMode: "All included",
    description: "For growing properties where gate, mess, and document operations happen daily.",
    bestFor: "40-100 bed hostels",
    highlight: true,
    accent: "teal",
  },
  {
    name: "Premium",
    badge: "Most scalable",
    range: "100-500 beds",
    minBeds: 100,
    maxBeds: 500,
    rate: 129,
    extensionMode: "All included",
    description: "For larger hostels that need full operating visibility across teams and residents.",
    bestFor: "100-500 bed operators",
    highlight: false,
    accent: "gold",
  },
  {
    name: "Enterprise",
    badge: "Lowest per-bed rate",
    range: "500+ beds",
    minBeds: 500,
    maxBeds: Infinity,
    rate: 89,
    extensionMode: "All included",
    description: "For large institutions and operators managing high-capacity properties.",
    bestFor: "500+ bed institutions",
    highlight: false,
    accent: "neutral",
  },
] as const;

function money(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function availabilityBadge(included: boolean, label: string) {
  return (
    <span className={`planAvailability ${included ? "yes" : "no"}`}>
      <i aria-hidden="true" className={included ? "ri-check-line" : "ri-close-line"} />
      {label}
    </span>
  );
}

function packageTotal(plan: (typeof packages)[number], beds: number, wantsExtensions: boolean) {
  const billableBeds = Math.max(beds, plan.minBeds);
  const extensionCost = plan.name === "Basic" && wantsExtensions ? 1000 : 0;
  return billableBeds * plan.rate + extensionCost;
}

function packageFit(plan: (typeof packages)[number], beds: number) {
  if (beds < plan.minBeds) return "nearby";
  if (beds <= plan.maxBeds) return "matched";
  return "outside";
}

export default function PlansPage() {
  const [beds, setBeds] = useState(60);
  const [activePackage, setActivePackage] = useState(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedExtensions, setSelectedExtensions] = useState<Record<string, boolean>>({
    guard: true,
    mess: true,
    vault: true,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePackage((current) => (current + 1) % packages.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const calculator = useMemo(() => {
    const selected = extensions.filter((extension) => selectedExtensions[extension.id]);
    const extensionTotal = selected.reduce((total, extension) => total + extension.price, 0);
    const customTotal = beds * 199 + extensionTotal;
    const wantsExtensions = selected.length > 0;
    const options = packages
      .map((plan) => ({
        plan,
        fit: packageFit(plan, beds),
        total: packageTotal(plan, beds, wantsExtensions),
      }))
      .filter((option) => option.fit !== "outside")
      .sort((a, b) => a.total - b.total);
    const recommended = options[0] ?? {
      plan: packages[packages.length - 1],
      fit: "matched",
      total: packageTotal(packages[packages.length - 1], beds, wantsExtensions),
    };
    const yearlyDiscount = billingCycle === "yearly" ? 0.2 : 0;
    const multiplier = billingCycle === "yearly" ? 12 : 1;
    const customBillingSubtotal = customTotal * multiplier * (1 - yearlyDiscount);
    const recommendedBillingSubtotal = recommended.total * multiplier * (1 - yearlyDiscount);
    const customGst = customTotal * 0.18;
    const recommendedGst = recommended.total * 0.18;
    return {
      billingLabel: billingCycle === "yearly" ? "/ year" : "/ month",
      customBillingGst: customBillingSubtotal * 0.18,
      customBillingGrandTotal: customBillingSubtotal * 1.18,
      customBillingSubtotal,
      customGst,
      customGrandTotal: customTotal + customGst,
      customTotal,
      extensionTotal,
      yearlyDiscount,
      recommended,
      recommendedBillingGst: recommendedBillingSubtotal * 0.18,
      recommendedBillingGrandTotal: recommendedBillingSubtotal * 1.18,
      recommendedBillingSubtotal,
      recommendedGrandTotal: recommended.total + recommendedGst,
      recommendedGst,
      savings: customBillingSubtotal - recommendedBillingSubtotal,
      selected,
    };
  }, [beds, billingCycle, selectedExtensions]);

  return (
    <main className="marketingPage plansPage">
      <header className="topbar marketingNav">
        <Link className="brand markBrand" href="/" aria-label="Hostin home"><Image src="/brand/hostin-mark.png" alt="" width={52} height={52} priority /></Link>
        <nav className="topnav" aria-label="Pricing navigation">
          <Link href="/#features">Features</Link>
          <Link href="/#roles">Who it helps</Link>
          <Link href="/#setup">Setup</Link>
          <Link className="activeNavLink" href="/pricing">Pricing</Link>
        </nav>
        <div className="navActions">
          <Link className="navDemo" href="/login#demo-accounts">Try demo</Link>
          <Link className="navLogin" href="/login">Log in</Link>
          <a className="gradientButton" href="#calculator">Estimate price</a>
        </div>
      </header>

      <section className="plansHero">
        <p className="sectionEyebrow">Hostin pricing</p>
        <h1>Pricing that scales with your beds.</h1>
        <p>Start with owner, warden, and tenant access. Add guard, mess, and vault workflows when your property needs deeper daily operations.</p>
        <div className="plansHeroActions">
          <a className="gradientButton" href="#calculator">Estimate price</a>
          <a className="outlineButton" href="#plans">Compare packages</a>
        </div>
      </section>

      <section className="pricingCarousel" id="plans" aria-label="Hostin pricing plans">
        <div className="pricingIntro">
          <div>
            <p className="sectionEyebrow">Transparent pricing</p>
            <h2>No surprises.</h2>
            <p>Each plan card shows the price, core access, and extension availability in one place.</p>
          </div>
          <div className="billingToggle" aria-label="Billing cycle">
            <button className={billingCycle === "monthly" ? "active" : ""} onClick={() => setBillingCycle("monthly")} type="button">Monthly</button>
            <button className={billingCycle === "yearly" ? "active" : ""} onClick={() => setBillingCycle("yearly")} type="button">Yearly 20% off</button>
          </div>
        </div>
        <div className="plansGrid" style={{ "--active-package": activePackage } as CSSProperties & { "--active-package": number }}>
        {packages.map((plan, index) => (
          <article className={`pricingCard ${index === activePackage ? "isActive" : ""} ${plan.highlight ? "popular" : ""} ${plan.accent === "gold" ? "bestValue" : ""}`} key={plan.name}>
            <span>{plan.badge}</span>
            <small>{plan.range}</small>
            <h2>{plan.name}</h2>
            <strong>{money(plan.rate)} / bed / month</strong>
            <p>{plan.description}</p>
            <div className="planCardMeta">
              <span><i aria-hidden="true" className="ri-hotel-bed-line" />{plan.bestFor}</span>
              <span><i aria-hidden="true" className={index === 0 ? "ri-add-circle-line" : "ri-checkbox-circle-line"} />{plan.extensionMode}</span>
            </div>
            <div className="planComparisonList">
              <div><span>Owner</span>{availabilityBadge(true, "Included")}</div>
              <div><span>Warden</span>{availabilityBadge(true, "Included")}</div>
              <div><span>Tenant</span>{availabilityBadge(true, "Included")}</div>
              {extensions.map((extension) => {
                const included = index > 0;
                return (
                  <div key={extension.id}>
                    <span>{extension.name}</span>
                    {availabilityBadge(included, included ? "Included" : "Not included")}
                  </div>
                );
              })}
            </div>
            <a className={plan.highlight ? "gradientButton" : "outlineButton"} href="#calculator">Estimate this plan</a>
          </article>
        ))}
        </div>
        <div className="pricingCarouselDots" aria-label="Pricing carousel controls">
          {packages.map((plan, index) => (
            <button
              aria-label={`Show ${plan.name} plan`}
              className={index === activePackage ? "active" : ""}
              key={plan.name}
              onClick={() => setActivePackage(index)}
              type="button"
            />
          ))}
        </div>
      </section>

      <section className="priceCalculator" id="calculator" aria-labelledby="price-calculator-title">
        <div className="calculatorLead">
          <p className="sectionEyebrow">Custom price calculator</p>
          <h2 id="price-calculator-title">Estimate your plan in 60 seconds.</h2>
          <p>Tell us your bed count and required operations. Hostin will compare the custom builder against packages and suggest the better buy.</p>
          <a className="outlineButton inverse" href="#calculator-panel">Calculate now</a>
        </div>

        <div className="calculatorPanel" id="calculator-panel">
          <div className="calculatorPanelHeader">
            <div>
              <h3>Custom price calculator</h3>
              <p>Standard builder starts at ₹199 per bed before selected extensions.</p>
            </div>
            <div className="calculatorVisual" aria-hidden="true">
              <i className="ri-building-4-line" />
              <i className="ri-community-line" />
            </div>
          </div>

          <div className="bedInput">
            <label htmlFor="beds">Number of beds</label>
            <div>
              <input
                aria-label="Number of beds"
                id="beds"
                min={1}
                onChange={(event) => setBeds(Math.max(1, Number(event.target.value) || 1))}
                type="number"
                value={beds}
              />
              <input
                aria-label="Bed count slider"
                max={800}
                min={1}
                onChange={(event) => setBeds(Math.max(1, Number(event.target.value) || 1))}
                type="range"
                value={Math.min(beds, 800)}
              />
            </div>
          </div>

          <div className="extensionChecklist" aria-label="Select extensions">
            {extensions.map((extension) => (
              <label key={extension.id}>
                <input
                  checked={selectedExtensions[extension.id]}
                  onChange={(event) => setSelectedExtensions((current) => ({ ...current, [extension.id]: event.target.checked }))}
                  type="checkbox"
                />
                <span>
                  <i aria-hidden="true" className={extension.icon} />
                  <b>{extension.name}</b>
                  <small>{money(extension.price)} / month · {extension.accountNote}</small>
                </span>
              </label>
            ))}
          </div>

          <div className="estimateBreakdown" aria-live="polite">
            <div><span>Base standard price</span><strong>{money(beds * 199)}</strong></div>
            <div><span>Selected extensions</span><strong>{money(calculator.extensionTotal)}</strong></div>
            <div><span>{billingCycle === "yearly" ? "Yearly subtotal after 20% off" : "Subtotal before GST"}</span><strong>{money(calculator.customBillingSubtotal)}</strong></div>
            <div><span>GST at 18%</span><strong>{money(calculator.customBillingGst)}</strong></div>
            <div className="payableRow"><span>Custom payable quote</span><strong>{money(calculator.customBillingGrandTotal)} {calculator.billingLabel}</strong></div>
          </div>

          <div className="recommendationCard">
            <span>Recommended package</span>
            <h3>{calculator.recommended.plan.name}</h3>
            <p>
              {calculator.recommended.fit === "nearby"
                ? `Closest package starts at ${calculator.recommended.plan.minBeds} beds.`
                : `${calculator.recommended.plan.range} at ${money(calculator.recommended.plan.rate)} per bed.`}
            </p>
            <strong>{money(calculator.recommendedBillingGrandTotal)} {calculator.billingLabel}</strong>
            <div className="quoteStrip">
              <b>Quote</b>
              <small>{money(calculator.recommendedBillingSubtotal)} subtotal + {money(calculator.recommendedBillingGst)} GST</small>
            </div>
            {calculator.savings > 0 ? (
              <small>{calculator.recommended.plan.name} saves {money(calculator.savings)} {billingCycle === "yearly" ? "per year" : "per month"} and {calculator.recommended.plan.name === "Basic" ? "can bundle all extensions." : "includes all extensions."}</small>
            ) : (
              <small>Your custom builder estimate is already optimized for this setup.</small>
            )}
          </div>
        </div>
      </section>

      <section className="plansNote">
        <div><p className="sectionEyebrow">Need a closer look?</p><h2>See Hostin with your actual property workflow in mind.</h2></div>
        <div><Link className="outlineButton" href="/login#demo-accounts">Try every role</Link><Link className="gradientButton" href="/#demo">Book free demo</Link></div>
      </section>

      <footer className="marketingFooter">
        <Link className="brand markBrand footerMark" href="/" aria-label="Hostin home"><Image src="/brand/hostin-mark.png" alt="" width={52} height={52} /></Link>
        <p>A fully managed hostel and PG operating system by 1Forge.</p>
        <div><Link href="/">Home</Link><Link href="/pricing">Pricing</Link><Link href="/login#demo-accounts">Try demo</Link><Link href="/login">Log in</Link></div>
        <small>© {new Date().getFullYear()} 1Forge. Built for better hostel operations.</small>
      </footer>
    </main>
  );
}
