"use client";
import { useEffect } from "react";
import { gsap } from "gsap";

/**
 * Page-level motion engine (Linear-style: fast, subtle, once).
 * Reveals are CSS transitions toggled by IntersectionObserver — content
 * visibility never depends on a JS animation loop completing. The `ld-js`
 * class on <html> arms the CSS pre-hide, so no-JS visitors (and search
 * engines) always get fully visible content. GSAP is used only for the
 * magnetic-CTA enhancement; countups run on their own rAF.
 * Reduced motion: nothing is hidden, nothing moves.
 */
export default function LandingFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("ld-js");

    // stagger delays for group children — short: at 80ms×6 the tail of a group was still
    // materializing half a second after you'd scrolled to it
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${Math.min(i * 50, 200)}ms`;
      });
    });

    const countup = (el: HTMLElement) => {
      const end = parseFloat(el.dataset.countup || "0");
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = `${prefix}${Math.round(end * eased)}${suffix}`;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || seen.has(e.target)) continue;
          seen.add(e.target);
          io.unobserve(e.target);
          e.target.classList.add("is-in");
          if ((e.target as HTMLElement).dataset.countup) countup(e.target as HTMLElement);
        }
      },
      // Positive bottom margin = fire BEFORE the element scrolls into view, so the reveal is
      // underway (or done) by the time it's visible. The old -8% fired late, which paired with
      // the slow transition to make sections feel like they loaded as you hit them.
      { rootMargin: "0px 0px 25% 0px" }
    );
    document
      .querySelectorAll<HTMLElement>("[data-reveal],[data-reveal-group],[data-countup]")
      .forEach((el) => io.observe(el));

    // Failsafe: if IO callbacks are suspended (background tab, throttled webview),
    // reveal everything after a few seconds — content must never stay hidden.
    const failsafe = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal],[data-reveal-group],[data-countup]")
        .forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          io.unobserve(el);
          el.classList.add("is-in");
          if (el.dataset.countup) countup(el);
        });
    }, 4000);

    // Magnetic CTAs — pointer devices only; pure enhancement.
    const cleanups: (() => void)[] = [];
    if (window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
        const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.25);
        };
        const leave = () => { xTo(0); yTo(0); };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });
    }

    return () => {
      window.clearTimeout(failsafe);
      io.disconnect();
      cleanups.forEach((fn) => fn());
      root.classList.remove("ld-js");
    };
  }, []);
  return null;
}
