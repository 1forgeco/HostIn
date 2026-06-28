"use client";

import Image from "next/image";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="forgeErrorPage">
      <div className="forgeErrorGlow" aria-hidden="true" />
      <header className="forgeErrorHeader">
        <Link href="/" aria-label="Hostin home"><Image src="/brand/hostin-mark.png" alt="" width={54} height={54} priority /></Link>
        <span>Built and managed by <strong>1Forge</strong></span>
      </header>
      <section className="forgeErrorCard">
        <div className="forgeErrorCode compact" aria-hidden="true"><i>!</i></div>
        <p className="sectionEyebrow">1Forge / Something went wrong</p>
        <h1>That wasn&apos;t meant to happen.</h1>
        <p>Your data is untouched. Try loading this view again, or return to Hostin and continue from there.</p>
        <div className="forgeErrorActions">
          <button className="gradientButton" type="button" onClick={reset}>Try again</button>
          <Link className="outlineButton" href="/">Back to Hostin</Link>
        </div>
      </section>
    </main>
  );
}
