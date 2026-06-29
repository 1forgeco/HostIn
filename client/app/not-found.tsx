import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="forgeErrorPage">
      <div className="forgeErrorGlow" aria-hidden="true" />
      <header className="forgeErrorHeader">
        <Link href="/" aria-label="Hostin home">
          <Image src="/brand/hostin-mark.png" alt="" width={54} height={54} priority />
        </Link>
        <span>Built and managed by <strong>1Forge</strong></span>
      </header>

      <section className="forgeErrorCard">
        <div className="forgeErrorCode" aria-hidden="true"><span>4</span><i>h.</i><span>4</span></div>
        <p className="sectionEyebrow">1Forge / Page not found</p>
        <h1>Oops. This room doesn&apos;t exist.</h1>
        <p>The page may have moved, the link may be old, or this route was never part of the property. Let&apos;s get you somewhere useful.</p>
        <div className="forgeErrorActions">
          <Link className="gradientButton" href="/">Back to Hostin</Link>
          <Link className="outlineButton" href="/plans">View plans</Link>
        </div>
        <nav aria-label="Recovery navigation">
          <Link href="/#features">Features</Link>
          <Link href="/login#demo-accounts">Try demo</Link>
          <Link href="/login">Log in</Link>
        </nav>
      </section>
    </main>
  );
}
