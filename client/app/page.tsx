"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useColorTheme } from "./components/theme-system";

const roles = [
  { key: "owner", label: "Owner", email: "owner" },
  { key: "warden", label: "Warden", email: "warden" },
  { key: "security", label: "Security", email: "security" },
  { key: "tenant", label: "Tenant", email: "tenant" },
  { key: "parent", label: "Parent", email: "parent" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export default function LandingPage() {
  useColorTheme();
  const [propertyName, setPropertyName] = useState("City Complex");
  const [ownerName, setOwnerName] = useState("City Complex Admin");
  const [city, setCity] = useState("Bengaluru");
  const slug = useMemo(() => slugify(propertyName) || "city-complex", [propertyName]);
  const domain = `${slug}.hostin.local`;

  return (
    <main>
      <header className="topbar">
        <button className="brand" type="button">
          <span>host</span>in<span>.</span>
        </button>
        <nav className="topnav" aria-label="Public navigation">
          <a href="#about">About</a>
          <a href="#pricing">Pricing</a>
          <a href="#consultation">Consultation</a>
          <a href="#careers">Careers</a>
          <a href="#contact">Contact</a>
        </nav>
        <Link className="gradientButton" href="/login">
          Get Started
        </Link>
      </header>

      <section className="productHero landingHero">
        <div>
          <p className="pill">Multi-tenant PG & hostel SaaS</p>
          <h1>Every property gets its own private app.</h1>
          <p>
            Create a workspace slug, generate role-based portals, issue login accounts, and manage subscriptions from
            one platform panel.
          </p>
        </div>
        <div className="heroConsole">
          <div>
            <span>Workspace URL</span>
            <strong>/{slug}</strong>
          </div>
          <div>
            <span>Main account</span>
            <strong>{roles.length}</strong>
          </div>
          <div>
            <span>Billing state</span>
            <strong>Trial</strong>
          </div>
        </div>
      </section>

      <section className="landingSection aboutSection" id="about">
        <div className="landingSectionHeader">
          <p className="sectionEyebrow">About HostIn</p>
          <h2>One operating system for PGs, hostels, and shared living properties.</h2>
          <p>
            HostIn gives every customer a private workspace with role-based portals for owners, wardens, security teams,
            tenants, parents, staff, and platform admins.
          </p>
        </div>
        <div className="serviceCards">
          {[
            ["Private workspaces", "Each property runs on its own slug, users, roles, and data."],
            ["Role-aware app", "Owners, wardens, tenants, parents, and security see only their allowed modules."],
            ["Operations ready", "Rooms, dues, visitors, gate passes, complaints, mess, documents, and notices."],
          ].map(([title, copy]) => (
            <article className="serviceCard" key={title}>
              <span>{title.slice(0, 2)}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection pricingSection" id="pricing">
        <div className="landingSectionHeader">
          <p className="sectionEyebrow">Pricing</p>
          <h2>Start with a trial, then scale by property size.</h2>
          <p>Keep billing tied to the same workspace that stores every room, tenant, and module permission.</p>
        </div>
        <div className="pricingGrid">
          {[
            ["Starter", "For single PGs testing digital operations", "15-day trial", "Rooms, tenants, dues, notices"],
            [
              "Growth",
              "For active hostels with staff workflows",
              "Most useful",
              "Gate, visitors, complaints, documents",
            ],
            ["Portfolio", "For owners managing multiple properties", "Custom", "Multi-property controls and support"],
          ].map(([title, copy, badge, features]) => (
            <article className="pricingCard" key={title}>
              <span>{badge}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <strong>{features}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="landingSection consultationSection" id="consultation">
        <div className="consultationPanel">
          <div>
            <p className="sectionEyebrow">Consultation</p>
            <h2>Map your property setup before launch.</h2>
            <p>
              We collect floors, rooms, capacities, staff roles, subscription needs, and module access, then generate
              the workspace and first login accounts.
            </p>
          </div>
          <a className="gradientButton" href="#contact">
            Start setup
          </a>
        </div>
      </section>

      <section className="landingSection careersSection" id="careers">
        <div className="landingSectionHeader">
          <p className="sectionEyebrow">Careers</p>
          <h2>Build practical software for real hostel operations.</h2>
          <p>We keep roles lean and product-focused: engineering, implementation, support, and customer onboarding.</p>
        </div>
        <div className="careerGrid">
          {["Full-stack product engineer", "Implementation specialist", "Customer support associate"].map(
            (roleName) => (
              <article className="careerCard" key={roleName}>
                <h3>{roleName}</h3>
                <p>Help properties move from manual work to clean daily workflows.</p>
                <a href="#contact">Contact team</a>
              </article>
            )
          )}
        </div>
      </section>

      <section className="landingWorkspace" id="create">
        <section className="panel setupPanel">
          <div className="panelTitle">
            <h2>Create customer workspace</h2>
            <span>Public landing</span>
          </div>
          <div className="setupGrid">
            <label>
              <span>PG / Hostel name</span>
              <input value={propertyName} onChange={(event) => setPropertyName(event.target.value)} />
            </label>
            <label>
              <span>Owner / main account name</span>
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
            </label>
            <label>
              <span>City</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} />
            </label>
            <label>
              <span>Generated slug</span>
              <input value={slug} readOnly />
            </label>
          </div>
        </section>

        <aside className="panel subscriptionPanel" id="platform">
          <div className="panelTitle">
            <h2>Subscription control</h2>
            <span>Platform</span>
          </div>
          <div className="billingRows">
            <div>
              <span>Workspace</span>
              <strong>{titleCase(slug)}</strong>
            </div>
            <div>
              <span>Plan</span>
              <strong>Growth trial</strong>
            </div>
            <div>
              <span>Trial</span>
              <strong>15 days</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>Active</strong>
            </div>
          </div>
          <Link className="outlineButton fullButton" href="/login">
            Open platform panel
          </Link>
        </aside>
      </section>

      <section className="landingWorkspace accountsSection" id="accounts">
        <section className="panel widePanel">
          <div className="panelTitle">
            <h2>Generated role portals</h2>
            <span>{domain}</span>
          </div>
          <div className="accountGrid">
            {roles.map((role) => {
              const email = `${role.email}@${slug}.hostin.local`;
              return (
                <article className="accountCard" key={role.key}>
                  <div>
                    <p>{role.label}</p>
                    <h3>{email}</h3>
                    <span>Temporary password: {slug}@123</span>
                  </div>
                  <Link className="gradientButton" href="/login">
                    Common login
                  </Link>
                  <small>Routes automatically after sign-in</small>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className="landingSection contactSection" id="contact">
        <div className="contactGrid">
          <div>
            <p className="sectionEyebrow">Contact</p>
            <h2>Bring your PG or hostel online with one clean workspace.</h2>
            <p>
              Use the setup panel above to preview role emails and slugs, then connect the workspace to live onboarding.
            </p>
          </div>
          <div className="contactCard">
            <span>Email</span>
            <strong>hello@hostin.local</strong>
            <span>Demo workspace</span>
            <strong>/{slug}/owner</strong>
            <Link className="gradientButton fullButton" href="/login">
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
