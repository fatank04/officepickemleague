"use client";
import { useEffect, useRef } from "react";

/**
 * Hero backdrop: faint receding yard lines + drifting dust motes in the brand accent.
 * Plain 2D canvas (no three.js — cheap on phones), DPR-aware, pauses offscreen,
 * disabled entirely under prefers-reduced-motion.
 */
export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // No canvas at all on touch devices. A full-viewport redraw every frame is real GPU load on
    // a phone — iOS scroll jank is compositor jank — and at phone size the dust is barely
    // perceptible. The static gradient + glow carry the hero on mobile.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // `running` starts false: the IntersectionObserver below is the single owner of the loop.
    // Starting a loop here as well as in the observer ran two draw loops at once for the whole
    // first scroll — double canvas work over exactly the stretch the hero occupies.
    let w = 0, h = 0, raf = 0, running = false;
    // dpr 1 on purpose: this layer is faint dust and 5%-alpha lines — invisible sharpness, and
    // retina doubled the redraw to a ~2560×2300 clear+paint every frame while the hero scrolls.
    const dpr = 1;
    const motes = Array.from({ length: 42 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: -0.00006 - Math.random() * 0.00012,
      a: 0.08 + Math.random() * 0.22,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Only start on a false→true edge. The observer can fire "still visible" more than once
    // (resize, threshold recompute); without the edge check each of those spawned another loop.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting === running) return;
      running = e.isIntersecting;
      if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
    });
    io.observe(canvas);

    // A background tab keeps the loop scheduled; stop it and resume on return.
    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (canvas.getBoundingClientRect().bottom > 0 && !running) {
        running = true; raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    function draw() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, w, h);
      // receding yard lines
      ctx.strokeStyle = "rgba(79,140,255,0.05)";
      ctx.lineWidth = 1;
      const horizon = h * 0.18;
      for (let i = 0; i < 9; i++) {
        const t = i / 8;
        const y = horizon + (h - horizon) * t * t;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // dust
      for (const m of motes) {
        m.x += m.vx; m.y += m.vy;
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
        if (m.x < -0.02) m.x = 1.02; else if (m.x > 1.02) m.x = -0.02;
        ctx.beginPath();
        ctx.fillStyle = `rgba(79,140,255,${m.a})`;
        ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect(); io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="ld-hero-canvas" aria-hidden="true" />;
}
