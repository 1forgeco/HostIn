"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";

type PendingSession = {
  accessToken: string;
  intendedDestination?: string;
  requiresPasswordChange?: boolean;
  userName?: string;
};

export default function ChangePasswordPage() {
  const [session, setSession] = useState<PendingSession | null>(null);
  const [message, setMessage] = useState("Create a private password before opening your workspace.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const value = window.sessionStorage.getItem("hostin-session");
      const parsed = value ? JSON.parse(value) : null;
      if (!parsed?.accessToken || !parsed.requiresPasswordChange) window.location.replace("/login");
      else setSession(parsed);
    } catch {
      window.location.replace("/login");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");
    if (password !== confirmation) return setMessage("Passwords do not match.");
    setBusy(true);
    const response = await fetch(`${apiBase}/auth/change-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify({ password }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Unable to update password.");
      setBusy(false);
      return;
    }
    const nextSession = { ...session, requiresPasswordChange: false };
    window.sessionStorage.setItem("hostin-session", JSON.stringify(nextSession));
    window.location.assign(session.intendedDestination || "/login");
  }

  return <main className="passwordSetupPage">
    <header className="commonLoginTop"><Link className="brand" href="/"><span>host</span>in<span>.</span></Link></header>
    <form className="panel passwordSetupCard" onSubmit={submit}>
      <p className="sectionEyebrow">Account security</p>
      <h1>Choose your permanent password.</h1>
      <p>{session?.userName ? `Welcome, ${session.userName}. ` : ""}Your temporary password can only be used for this first sign-in.</p>
      <label><span>New password</span><input minLength={12} name="password" required type="password" autoComplete="new-password" /></label>
      <label><span>Confirm password</span><input minLength={12} name="confirmation" required type="password" autoComplete="new-password" /></label>
      <button className="gradientButton fullButton" disabled={busy || !session} type="submit">{busy ? "Updating..." : "Save password and continue"}</button>
      <p className="formMessage" role="status">{message}</p>
    </form>
  </main>;
}
