"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Brand";

const links: [string, string][] = [
  ["#how", "How it works"],
  ["#features", "Features"],
  ["#pricing", "Pricing"],
  ["#faq", "FAQ"],
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`ld-nav${scrolled ? " scrolled" : ""}`}>
      <div className="ld-nav-inner">
        <Link href="/" className="ld-nav-brand" aria-label="Office Pick'em League home">
          <Mark />
          <span>Office <b>Pick&apos;em</b></span>
        </Link>
        <nav className="ld-nav-links" aria-label="Primary">
          {links.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <div className="ld-nav-cta">
          <Link href="/signin" className="ld-nav-signin">Sign in</Link>
          <a href="#start" className="btn blue sm" data-magnetic>Start a league</a>
        </div>
      </div>
    </header>
  );
}
