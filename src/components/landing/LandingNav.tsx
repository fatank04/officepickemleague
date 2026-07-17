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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close the mobile menu on escape / on resize up to desktop
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 761px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => { window.removeEventListener("keydown", onKey); mq.removeEventListener("change", onMq); };
  }, [open]);

  return (
    <header className={`ld-nav${scrolled || open ? " scrolled" : ""}`}>
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
          <button
            type="button"
            className={`ld-burger${open ? " open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="ld-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
      <div id="ld-mobile-menu" className={`ld-nav-menu${open ? " open" : ""}`}>
        {links.map(([href, label]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
        ))}
        <Link href="/signin" onClick={() => setOpen(false)}>Sign in</Link>
      </div>
    </header>
  );
}
