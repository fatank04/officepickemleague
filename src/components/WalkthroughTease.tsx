"use client";

import { useRef, useState, useCallback } from "react";

type Chapter = { t: number; label: string; sub: string };

const CHAPTERS: Chapter[] = [
  { t: 6, label: "Standings", sub: "Live leaderboard" },
  { t: 16, label: "Make your picks", sub: "Two minutes a week" },
  { t: 26.5, label: "Insights", sub: "Your record & trends" },
  { t: 35.5, label: "Commissioner tools", sub: "Run the whole league" },
];

export default function WalkthroughTease() {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(0);

  const play = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    v.play();
    setPlaying(true);
  }, []);

  const seek = useCallback((i: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = CHAPTERS[i].t + 0.15;
    setActive(i);
    v.play();
    setPlaying(true);
  }, []);

  const onTime = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    const t = v.currentTime;
    let idx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) if (t >= CHAPTERS[i].t) idx = i;
    setActive(idx);
  }, []);

  return (
    <section style={{ marginTop: 30 }}>
      <div className="center" style={{ marginBottom: 12 }}>
        <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>
          See it in action
        </div>
        <h2 style={{ fontSize: 19, margin: "4px 0 0" }}>Inside the league</h2>
        <p className="muted small" style={{ margin: "4px auto 0", maxWidth: 460 }}>
          The real app your team sees once you&apos;re in — no sign-up required to watch.
        </p>
      </div>

      {/* Browser-frame player */}
      <div className="card" style={{ padding: 0, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 14px",
            borderBottom: "1px solid var(--line)",
            background: "rgba(var(--accent-rgb),.04)",
          }}
        >
          <span style={{ display: "flex", gap: 6 }}>
            <i style={{ width: 10, height: 10, borderRadius: "50%", background: "#f0556a", display: "inline-block" }} />
            <i style={{ width: 10, height: 10, borderRadius: "50%", background: "#f7cf57", display: "inline-block" }} />
            <i style={{ width: 10, height: 10, borderRadius: "50%", background: "#3ecf8e", display: "inline-block" }} />
          </span>
          <span
            className="muted small"
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "ui-monospace,Menlo,monospace",
              fontSize: 11,
              opacity: 0.85,
            }}
          >
            officepickemleague.com
          </span>
          <span style={{ width: 44 }} />
        </div>

        <div style={{ position: "relative", background: "#0b1220", lineHeight: 0 }}>
          <video
            ref={ref}
            src="/walkthrough.mp4"
            poster="/walkthrough-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            onTimeUpdate={onTime}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={() => (playing ? ref.current?.pause() : play())}
            style={{ width: "100%", display: "block", cursor: "pointer" }}
          />
          {!playing && (
            <button
              type="button"
              onClick={play}
              aria-label="Play the walkthrough"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
                cursor: "pointer",
                background: "rgba(6,12,26,.34)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,var(--accent),var(--accent-d))",
                  boxShadow: "0 10px 34px rgba(var(--accent-rgb),.5)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span
                  style={{
                    width: 0,
                    height: 0,
                    marginLeft: 6,
                    borderTop: "15px solid transparent",
                    borderBottom: "15px solid transparent",
                    borderLeft: "24px solid #fff",
                  }}
                />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Chapter captions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}
      >
        {CHAPTERS.map((c, i) => {
          const on = i === active && playing;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => seek(i)}
              style={{
                textAlign: "left",
                padding: "9px 11px",
                borderRadius: 11,
                cursor: "pointer",
                border: on ? "1px solid var(--accent)" : "1px solid var(--line)",
                background: on ? "rgba(var(--accent-rgb),.12)" : "var(--panel)",
                transition: "all .18s ease",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: on ? "var(--accent)" : "inherit",
                }}
              >
                {i + 1}. {c.label}
              </div>
              <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>
                {c.sub}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
