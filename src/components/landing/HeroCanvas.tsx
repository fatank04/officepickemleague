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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) raf = requestAnimationFrame(draw); });
    io.observe(canvas);

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
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <canvas ref={ref} className="ld-hero-canvas" aria-hidden="true" />;
}
