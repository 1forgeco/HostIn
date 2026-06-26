"use client";

import { useMemo, useState } from "react";

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
  const [propertyName, setPropertyName] = useState("City Complex");
  const [ownerName, setOwnerName] = useState("City Complex Admin");
  const [city, setCity] = useState("Bengaluru");
  const slug = useMemo(() => slugify(propertyName) || "city-complex", [propertyName]);
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  const domain = `${slug}.hostin.local`;

  return (
    <main>
      <header className="topbar">
        <button className="brand" type="button">
          <span>host</span>in<span>.</span>
        </button>
        <nav className="topnav" aria-label="Public navigation">
          <a href="#create">Create workspace</a>
          <a href="#accounts">Role links</a>
          <a href="#platform">Platform</a>
        </nav>
        <a className="gradientButton" href="#create">Get Started</a>
      </header>

      <section className="productHero landingHero">
        <div>
          <p className="pill">Multi-tenant PG & hostel SaaS</p>
          <h1>Every property gets its own private app.</h1>
          <p>
            Create a workspace slug, generate role-based portals, issue login accounts,
            and manage subscriptions from one platform panel.
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
            <div><span>Workspace</span><strong>{titleCase(slug)}</strong></div>
            <div><span>Plan</span><strong>Growth trial</strong></div>
            <div><span>Trial</span><strong>15 days</strong></div>
            <div><span>Status</span><strong>Active</strong></div>
          </div>
          <a className="outlineButton fullButton" href="/platform/admin">Open platform panel</a>
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
              const href = `${baseUrl}/${slug}/${role.key}`;
              return (
                <article className="accountCard" key={role.key}>
                  <div>
                    <p>{role.label}</p>
                    <h3>{email}</h3>
                    <span>Temporary password: {slug}@123</span>
                  </div>
                  <a className="gradientButton" href={`/${slug}/${role.key}`}>Open portal</a>
                  <small>{href}</small>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
