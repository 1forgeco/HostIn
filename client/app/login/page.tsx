"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
const demoPassword = "city-complex@123";
const demoAccounts = [
  { role: "Owner", email: "owner@city-complex.hostin.local", detail: "Business, occupancy, dues, and reports" },
  { role: "Warden", email: "warden@city-complex.hostin.local", detail: "Rooms, residents, passes, and operations" },
  { role: "Guard", email: "security@city-complex.hostin.local", detail: "Gate passes, visitors, and entry logs" },
  { role: "Mess Manager", email: "staff@city-complex.hostin.local", detail: "Meals, menus, feedback, and resident support" },
  { role: "Tenant", email: "tenant@city-complex.hostin.local", detail: "Dues, requests, community, and mess" },
  { role: "Parent", email: "parent@city-complex.hostin.local", detail: "Ward updates, dues, and announcements" },
];

export default function LoginPage() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => setReady(true), []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Finding your workspace...");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiBase}/auth/resolve-login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.destination || !data.session) {
        setMessage(data.error ?? "Login failed. Check your email and password.");
        return;
      }
      window.sessionStorage.setItem("hostin-session", JSON.stringify(data.session));
      window.location.assign(data.destination);
    } catch {
      setMessage("The login service is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="commonLoginPage">
      <header className="commonLoginTop">
        <Link className="brand" href="/"><span>host</span>in<span>.</span></Link>
        <span className="loginManagedThemeNote">Theme managed by 1Forge</span>
      </header>
      <section>
        <div className="commonLoginIntro">
          <p className="pill">One secure entry</p>
          <h1>Welcome back.</h1>
          <p>
            Use the account issued by your property or the 1Forge team. HostIn will open the correct workspace, role,
            and profile automatically.
          </p>
          <div className="demoAccounts" id="demo-accounts">
            <div className="demoAccountsHeader">
              <div><p className="sectionEyebrow">Explore the demo</p><h2>Try every Hostin role.</h2></div>
              <span>Click any account to fill the login form</span>
            </div>
            <div className="demoAccountGrid">
              {demoAccounts.map((account) => (
                <button
                  aria-label={`Use ${account.role} demo account`}
                  key={account.role}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(demoPassword);
                    setMessage(`${account.role} demo selected. Continue when ready.`);
                  }}
                  type="button"
                >
                  <i>{account.role.charAt(0)}</i>
                  <span><strong>{account.role}</strong><small>{account.detail}</small></span>
                  <span className="demoCredentials"><code>{account.email}</code><code>{demoPassword}</code></span>
                  <em>Use account →</em>
                </button>
              ))}
            </div>
          </div>
        </div>
        <form className="panel commonLoginCard" onSubmit={login}>
          <div>
            <p className="sectionEyebrow">Account login</p>
            <h2>Sign in to HostIn</h2>
          </div>
          <label>
            <span>Email address</span>
            <input
              autoComplete="email"
              disabled={!ready}
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your-name@property.hostin.local"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              disabled={!ready}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
          </label>
          <button className="gradientButton fullButton" disabled={busy || !ready} type="submit">
            {busy ? "Signing in..." : "Continue"}
          </button>
          <p className="formMessage" role="status">
            {message}
          </p>
          <small>Accounts and access are managed by your property administrator and the 1Forge operations team.</small>
        </form>
      </section>
    </main>
  );
}
