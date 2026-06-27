"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
      <Link className="brand" href="/">
        <span>host</span>in<span>.</span>
      </Link>
      <section>
        <div className="commonLoginIntro">
          <p className="pill">One secure entry</p>
          <h1>Welcome back.</h1>
          <p>
            Use the account issued by your property or the 1Forge team. HostIn will open the correct workspace, role,
            and profile automatically.
          </p>
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
              name="email"
              placeholder="your-name@property.hostin.local"
              required
              type="email"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Enter your password"
              required
              type="password"
            />
          </label>
          <button className="gradientButton fullButton" disabled={busy} type="submit">
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
