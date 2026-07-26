"use client";

/**
 * The buyer deck (/deck) — shown on a call or sent as a follow-up link.
 *
 * This is customer-facing end to end. Presenter cues live in the call script, never on a slide:
 * the buyer sees the same thing whether Ankur is narrating or they opened the link cold.
 *
 * Structure follows the argument that works: name the problem, prove engagement pays, show the
 * fix, walk the four ways to play with a picture of each, then clear every blocker in turn
 * (approval, IT, inclusion, alternatives, the gambling question) before price and the ask.
 *
 * Every statistic is sourced on the slide that uses it. Don't add a number without one.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const TIERS = [
  { name: "Starter", size: "Up to 50 employees", founding: "$400", standard: "$750", save: "−47%", per: "$8.00" },
  { name: "Team", size: "Up to 150 employees", founding: "$900", standard: "$1,800", save: "−50%", per: "$6.00" },
  { name: "Company", size: "Up to 400 employees", founding: "$1,900", standard: "$3,900", save: "−51%", per: "$4.75" },
  { name: "Large", size: "Up to 1,000 employees", founding: "$3,750", standard: "$7,500", save: "−50%", per: "$3.75" },
  { name: "Enterprise", size: "1,000+ / multi-site", founding: "Let's talk", standard: "Custom", save: "", per: "—" },
];

const EVIDENCE = [
  { n: "63%", l: "fewer safety incidents on the most-engaged teams" },
  { n: "$154B", l: "a year — the U.S. cost of workplace loneliness, a bill your CFO already pays" },
  { n: "7×", l: "more engaged when people have a real friend at work" },
  { n: "~80%", l: "of the workforce is deskless — an app never reaches them" },
  { n: "~47%", l: "of NFL fans are women, but only ~26% of fantasy players" },
  { n: "$3.75–8", l: "per employee a year, against the $100–500 you already spend on team-building" },
];

const APPROVERS: [string, string][] = [
  ["HR / People", "A whole-workforce ritual that finally reaches the frontline — with participation reporting to prove it worked."],
  ["Legal", "Zero money anywhere in the game. The sanctioned alternative to the cash pool that's already happening in your building."],
  ["IT / Security", "Nothing to install, no SSO, no directory sync. We never touch corporate email or anything your team runs."],
  ["Finance", "One flat seasonal rate — a fraction of a single team-building event. No per-head math, no procurement cycle."],
];

const ALTERNATIVES: [string, string, boolean][] = [
  ["Cash office pool", "Illegal or grey-area in most states — the one version Legal can never bless.", false],
  ["Fantasy football", "Drafts, waivers, hours a week. The diehards love it; everyone else taps out by Week 3.", false],
  ["Engagement apps", "Bonusly, Nectar — not sports, no weekly hook, and $36–72+ per employee before rewards.", false],
  ["Team-building / offsites", "One day, then it's over. Expensive, and it excludes shift, field, and remote staff.", false],
  ["DIY spreadsheet + text", "Manual scoring breaks weekly and burns out the one person running it.", false],
  ["Office Pick'em League", "Fun, inclusive, safe, and cheap — the whole workforce, all season, at $3.75–8 per employee. We run it.", true],
];

const HOW: [string, string][] = [
  ["Tell us your league name and colors", "We build it for you. Every game, every week, all season is pre-loaded before you start."],
  ["Share one link with your team", "Break room, group text, newsletter, or a sheet on the wall. People join with a first name — no work email, no password, no app."],
  ["The season runs itself", "Reminders go out, games lock at kickoff, scores grade automatically, standings update. You get the participation report."],
];

export default function Deck() {
  const [i, setI] = useState(0);
  const slides = buildSlides();
  const last = slides.length - 1;
  const go = useCallback((n: number) => setI((p) => Math.min(last, Math.max(0, p + n))), [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const s = slides[Math.min(i, last)];

  return (
    <div style={{ height: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Raw HTML, not a text child: React escapes angle brackets in a server-rendered style tag
          but the client doesn't, which trips a hydration mismatch. */}
      <style dangerouslySetInnerHTML={{ __html: `
        body footer{display:none}
        .dk-slide{animation:dkIn .32s ease}
        @keyframes dkIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.dk-slide{animation:none}}
        .dk-h1{font-family:var(--font-grotesk),sans-serif;font-weight:700;letter-spacing:-1.2px;line-height:1.04;
          font-size:clamp(30px,4.6vw,54px);margin:0;text-wrap:balance}
        .dk-h2{font-family:var(--font-grotesk),sans-serif;font-weight:700;letter-spacing:-.6px;line-height:1.1;
          font-size:clamp(23px,3vw,36px);margin:0;text-wrap:balance}
        .dk-eye{font-size:11.5px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:var(--accent)}
        .dk-lede{color:var(--muted);font-size:clamp(14px,1.5vw,17px);line-height:1.6;max-width:64ch}
        .dk-lede b{color:var(--text)}
        .dk-card{background:linear-gradient(180deg,var(--panel),var(--bg2));border:1px solid var(--line);
          border-radius:15px;padding:16px 18px}
        .dk-card.hot{border-color:var(--accent);background:rgba(var(--accent-rgb),.08)}
        .dk-grid{display:grid;gap:12px}
        .dk-btn{background:transparent;border:1px solid var(--line);color:var(--muted);font:inherit;font-size:13px;
          font-weight:700;padding:9px 14px;border-radius:9px;cursor:pointer}
        .dk-btn:hover:not(:disabled){color:var(--text);border-color:var(--accent)}
        .dk-btn:disabled{opacity:.35;cursor:default}
        .dk-btn.on{color:#fff;background:var(--accent);border-color:var(--accent)}
        .dk-dot{width:7px;height:7px;border-radius:50%;background:var(--line);border:none;padding:0;cursor:pointer}
        .dk-dot.on{background:var(--accent);transform:scale(1.35)}
        .dk-num{font-family:var(--font-grotesk),sans-serif;font-size:12.5px;font-weight:700;color:var(--accent);letter-spacing:1px}
        .dk-li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.5;color:var(--muted);margin-bottom:9px}
        .dk-li i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-top:7px}
        .dk-li b{color:var(--text);font-weight:600}
        .dk-th{font-size:10.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);
          text-align:left;padding:0 9px 9px;border-bottom:2px solid var(--line)}
        .dk-td{padding:10px 9px;border-bottom:1px solid var(--line);font-size:14px}
        .dk-stat .n{font-family:var(--font-grotesk),sans-serif;font-weight:700;font-size:clamp(21px,2.6vw,31px);
          color:var(--accent);line-height:1;font-variant-numeric:tabular-nums}
        .dk-stat .l{color:var(--muted);font-size:12px;line-height:1.42;margin-top:6px}
        .dk-src{font-size:10.5px;color:var(--muted2);margin-top:14px;line-height:1.55;max-width:80ch}
        .dk-dots{display:flex;gap:6px;align-items:center}
        .dk-video{display:block;width:100%;max-height:52vh;aspect-ratio:16/9;background:#0d131d;object-fit:contain}
        /* --- modality mockups --- */
        .mk{background:var(--bg2);border:1px solid var(--line);border-radius:14px;padding:14px;font-size:12.5px}
        .mk-hd{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted2);margin-bottom:9px}
        .mk-team{display:flex;align-items:center;gap:8px;padding:6px 0;font-weight:700;font-size:13.5px}
        .mk-dot{width:14px;height:14px;border-radius:50%;flex:none}
        .mk-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}
        .mk-opt{border:1px solid var(--line);border-radius:8px;padding:7px 4px;text-align:center;font-size:10.5px;
          color:var(--muted);font-weight:700;background:var(--panel)}
        .mk-opt.sel{border-color:var(--accent);background:rgba(var(--accent-rgb),.16);color:var(--text)}
        .mk-bub{max-width:86%;padding:8px 11px;border-radius:13px;margin-bottom:7px;line-height:1.4;font-size:12.5px}
        .mk-in{background:var(--panel2);border:1px solid var(--line);color:var(--muted);border-bottom-left-radius:4px}
        .mk-out{background:var(--accent);color:#fff;margin-left:auto;border-bottom-right-radius:4px;font-weight:600}
        .mk-paper{background:#fbfaf6;color:#1a1a1a;border-radius:10px;padding:13px 15px;font-family:Georgia,serif}
        .mk-prow{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ddd8cc;padding:6px 0;font-size:12px}
        .mk-box{width:15px;height:15px;border:1.5px solid #444;border-radius:3px;display:inline-grid;place-items:center;
          font-family:ui-sans-serif,sans-serif;font-weight:800;color:#0b6b3a;font-size:12px;margin-left:7px}
        .mk-wave{display:flex;align-items:flex-end;gap:2.5px;height:22px}
        .mk-wave i{flex:1;background:var(--accent);border-radius:2px;opacity:.85}
        @media (max-width:640px){
          .dk-hide-sm,.dk-dots{display:none}
          .dk-bar{padding:12px 16px} .dk-foot{padding:12px 16px}
          .dk-brand{font-size:13.5px}
        }
      ` }} />

      <div className="dk-bar" style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 26px", borderBottom: "1px solid var(--line)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--text)" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(140deg,var(--accent),var(--accent-d))", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, color: "#fff", flex: "none" }}>O</span>
          <span className="dk-brand" style={{ fontFamily: "var(--font-grotesk),sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>Office Pick&apos;em League</span>
        </Link>
        <span className="muted dk-hide-sm" style={{ fontSize: 12, marginLeft: 4 }}>Employee engagement · Founding Season 2026</span>
      </div>

      <div key={i} className="dk-slide" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", alignItems: "center", padding: "26px" }}>
        <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>{s.body}</div>
      </div>

      <div className="dk-foot" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 26px", borderTop: "1px solid var(--line)" }}>
        <div className="dk-dots">
          {slides.map((sl, n) => (
            <button key={sl.id} className={`dk-dot ${n === i ? "on" : ""}`} onClick={() => setI(n)} aria-label={`Slide ${n + 1}: ${sl.id}`} />
          ))}
        </div>
        <span className="muted" style={{ fontSize: 12, marginLeft: 6, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{i + 1} / {slides.length}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="dk-btn" onClick={() => go(-1)} disabled={i === 0}>← Back</button>
          <button className="dk-btn on" onClick={() => go(1)} disabled={i === last}>Next →</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function Cards({ items, min = 235 }: { items: [string, string][]; min?: number }) {
  return (
    <div className="dk-grid" style={{ gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))` }}>
      {items.map(([h, b]) => (
        <div key={h} className="dk-card">
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14.5 }}>{h}</div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.48 }}>{b}</div>
        </div>
      ))}
    </div>
  );
}

/** A modality slide: copy on the left, a picture of the real thing on the right. */
function Modality({ n, name, line, who, bullets, why, visual }: {
  n: string; name: string; line: string; who: string; bullets: string[]; why: string; visual: React.ReactNode;
}) {
  return (
    <div>
      <div className="dk-eye">{n} · How your people take part</div>
      <h2 className="dk-h2" style={{ margin: "10px 0 7px" }}>{name}</h2>
      <p style={{ margin: "0 0 4px", fontSize: 16, color: "var(--text)", fontWeight: 600, maxWidth: "48ch", lineHeight: 1.35 }}>{line}</p>
      <p className="muted" style={{ fontSize: 13, margin: "0 0 16px" }}>Built for: {who}</p>
      <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", alignItems: "start" }}>
        <div>
          {bullets.map((b) => <div key={b} className="dk-li"><i />{b}</div>)}
          <div className="dk-card hot" style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.5 }}>{why}</div>
        </div>
        <div>{visual}</div>
      </div>
    </div>
  );
}

/* ───────────────────────── mockups ───────────────────────── */

function WebMock() {
  return (
    <div className="mk">
      <div className="mk-hd">Week 1 · Game 3 of 9</div>
      <div className="mk-team"><span className="mk-dot" style={{ background: "#f7cf57" }} />Pittsburgh</div>
      <div className="mk-team"><span className="mk-dot" style={{ background: "#f0556a" }} />Cleveland</div>
      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>PIT −3.5 · O/U 44.5</div>
      <div className="mk-opts">
        <div className="mk-opt sel">WINNER<br /><b style={{ color: "var(--text)" }}>Pittsburgh</b></div>
        <div className="mk-opt">SPREAD<br />PIT −3.5</div>
        <div className="mk-opt sel">TOTAL<br /><b style={{ color: "var(--text)" }}>Over</b></div>
      </div>
      <div style={{ marginTop: 10, textAlign: "center", background: "var(--accent)", color: "#fff", borderRadius: 8, padding: "8px", fontWeight: 800, fontSize: 12.5 }}>
        Lock your picks
      </div>
    </div>
  );
}

function TextMock() {
  return (
    <div className="mk">
      <div className="mk-hd">A real exchange</div>
      <div className="mk-bub mk-out">PLAY</div>
      <div className="mk-bub mk-in">Game 3 of 9 — Pittsburgh at Cleveland, PIT −3.5, total 44.5. Who you got?</div>
      <div className="mk-bub mk-out">Steelers, take the over</div>
      <div className="mk-bub mk-in">Got it — Steelers to win, Steelers cover, over 44.5. Next up…</div>
      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Plain words. Talk-to-text works too.</div>
    </div>
  );
}

function PaperMock() {
  const rows: [string, string][] = [["Pittsburgh", "Cleveland"], ["Buffalo", "N.Y. Jets"], ["Green Bay", "Chicago"]];
  return (
    <div className="mk">
      <div className="mk-hd">Filled in, photographed, texted back</div>
      <div className="mk-paper">
        <div style={{ fontWeight: 700, fontSize: 13, borderBottom: "2px solid #1a1a1a", paddingBottom: 5, marginBottom: 4 }}>
          Avalotis Pick&apos;em — Week 1
        </div>
        {rows.map(([a, b], idx) => (
          <div className="mk-prow" key={a}>
            <span>{a} <span style={{ color: "#888" }}>at</span> {b}</span>
            <span style={{ whiteSpace: "nowrap" }}>
              <span className="mk-box">{idx !== 1 ? "✕" : ""}</span>
              <span className="mk-box">{idx === 1 ? "✕" : ""}</span>
            </span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: "#666", marginTop: 8, fontFamily: "ui-sans-serif,sans-serif" }}>
          Name: <span style={{ fontFamily: "Georgia,serif", fontStyle: "italic", color: "#1a1a1a" }}>Dave R.</span>
        </div>
      </div>
      <div className="mk-bub mk-in" style={{ maxWidth: "100%", marginTop: 10 }}>
        Got your sheet, Dave — Pittsburgh, N.Y. Jets, Green Bay. Reply LOCK and you&apos;re in.
      </div>
    </div>
  );
}

function VoiceMock() {
  const bars = [7, 13, 20, 11, 17, 22, 9, 15, 19, 8, 14, 21, 10, 16, 12];
  return (
    <div className="mk">
      <div className="mk-hd">Live call · 00:41</div>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(var(--accent-rgb),.18)", border: "1px solid var(--accent)", display: "grid", placeItems: "center", flex: "none", fontSize: 15 }}>☎</div>
        <div className="mk-wave" style={{ flex: 1 }}>
          {bars.map((h, k) => <i key={k} style={{ height: h }} />)}
        </div>
      </div>
      <div className="mk-bub mk-in">Hey Dave, it&apos;s Office Pick&apos;em. Ready for Week 1?</div>
      <div className="mk-bub mk-out">Yeah, give me the games.</div>
      <div className="mk-bub mk-in">Steelers at Browns, Pittsburgh giving three and a half. Who you like?</div>
      <div className="mk-bub mk-out">Steelers all day. And the over.</div>
      <div className="mk-bub mk-in">Locked. Want me to read the whole card back?</div>
      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>It waits, it banters, and it only submits when they say so.</div>
    </div>
  );
}

/** The positioning map: real axes, four quadrants, one occupied corner. */
function MapSvg() {
  return (
    <svg viewBox="0 0 460 400" style={{ width: "100%", maxWidth: 470, display: "block" }} role="img"
      aria-label="Two-by-two: whole-workforce participation against ease of adoption. Office Pick'em League sits alone in the high-high corner.">
      <defs>
        <marker id="ar" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 z" fill="#6b7a94" />
        </marker>
      </defs>
      {/* quadrant fills */}
      <rect x="56" y="26" width="184" height="152" fill="rgba(255,255,255,.02)" />
      <rect x="240" y="26" width="184" height="152" fill="rgba(79,140,255,.14)" stroke="#4f8cff" strokeWidth="1.5" />
      <rect x="56" y="178" width="184" height="152" fill="rgba(255,255,255,.02)" />
      <rect x="240" y="178" width="184" height="152" fill="rgba(255,255,255,.02)" />
      {/* axes */}
      <line x1="56" y1="330" x2="432" y2="330" stroke="#6b7a94" strokeWidth="1.5" markerEnd="url(#ar)" />
      <line x1="56" y1="330" x2="56" y2="18" stroke="#6b7a94" strokeWidth="1.5" markerEnd="url(#ar)" />
      <line x1="240" y1="26" x2="240" y2="330" stroke="#26344a" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="56" y1="178" x2="424" y2="178" stroke="#26344a" strokeWidth="1" strokeDasharray="4 4" />
      {/* labels */}
      <text x="244" y="360" fill="#93a1ba" fontSize="11.5" fontWeight="700">Whole workforce takes part →</text>
      <text x="-300" y="14" transform="rotate(-90)" fill="#93a1ba" fontSize="11.5" fontWeight="700">Easy and low-risk to adopt →</text>
      {/* plotted */}
      <text x="72" y="62" fill="#93a1ba" fontSize="12.5" fontWeight="700">Engagement apps</text>
      <text x="72" y="80" fill="#6b7a94" fontSize="11">Safe, but nobody sticks</text>
      <text x="256" y="62" fill="#4f8cff" fontSize="14" fontWeight="800">Office Pick&apos;em League</text>
      <text x="256" y="82" fill="#eef3fb" fontSize="11.5">Everyone plays. Easiest yes.</text>
      <circle cx="262" cy="104" r="4.5" fill="#4f8cff" />
      <text x="72" y="216" fill="#93a1ba" fontSize="12.5" fontWeight="700">Team-building / DIY</text>
      <text x="72" y="234" fill="#6b7a94" fontSize="11">Costly, or it breaks by Week 4</text>
      <text x="256" y="216" fill="#93a1ba" fontSize="12.5" fontWeight="700">Real-money pools</text>
      <text x="256" y="234" fill="#6b7a94" fontSize="11">Fun, but Legal says no</text>
    </svg>
  );
}

/* ───────────────────────── slides ───────────────────────── */

function buildSlides() {
  const S: { id: string; body: React.ReactNode }[] = [];

  S.push({
    id: "Cover",
    body: (
      <div>
        <div className="dk-eye">Employee engagement · Founding Season 2026 · Kickoff Sept 9</div>
        <h1 className="dk-h1" style={{ margin: "15px 0 16px", maxWidth: "19ch" }}>
          The one company program <em style={{ fontStyle: "normal", color: "var(--accent)" }}>everyone</em> takes part in.
        </h1>
        <p className="dk-lede">
          A season-long NFL prediction game <b>your company runs for its employees</b> — the shop floor and the
          front office in the same standings for eighteen weeks. No money, no betting, and your people never
          pay a cent.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
          {["Employer-paid · players never pay", "No money, no betting", "No app, no logins, no IT project"].map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </div>
    ),
  });

  S.push({
    id: "Problem",
    body: (
      <div>
        <div className="dk-eye">The problem</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 18px", maxWidth: "26ch" }}>
          Football season is already in your building. You just can&apos;t sanction it.
        </h2>
        <Cards min={240} items={[
          ["The cash pool is a liability", "Money pools are illegal or grey-area in most states. It's happening anyway, in a spreadsheet, run by one exhausted person — and Legal would rather not know."],
          ["Fantasy loses the room", "Drafts, waivers, hours a week. The diehards love it. Everyone else taps out by Week 3."],
          ["Most of your people aren't at a desk", "Anything that needs an app, an SSO login, or a laptop leaves out the floor, the road, and the night shift."],
        ]} />
      </div>
    ),
  });

  S.push({
    id: "Evidence",
    body: (
      <div>
        <div className="dk-eye">Why engagement is worth paying for</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 18px", maxWidth: "28ch" }}>
          Engaged teams are safer and they stay.
        </h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {EVIDENCE.map((e) => (
            <div key={e.n} className="dk-card dk-stat"><div className="n">{e.n}</div><div className="l">{e.l}</div></div>
          ))}
        </div>
        <p className="dk-src">
          Sources: Gallup Q12 Meta-Analysis, 11th ed. (2024) · Cigna (2020) · SSRS Sports Poll / FSGA (2025) ·
          Emergence / TalentCards (2024) · O.C. Tanner (2024). Full citations in the evidence pack.
        </p>
      </div>
    ),
  });

  S.push({
    id: "The fix",
    body: (
      <div>
        <div className="dk-eye">The fix</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 14px", maxWidth: "27ch" }}>
          A place for everyone on the payroll — whatever their age or their phone.
        </h2>
        <p className="dk-lede" style={{ marginBottom: 20 }}>
          Each week we put up a short slate of marquee games. Your people pick the winner, the spread, and the
          over/under — about two minutes. <b>Nobody&apos;s participation is limited by technology.</b> There are
          four ways to hand in a card, so the 24-year-old on their phone, the 61-year-old who&apos;d rather use a
          pen, and the driver who&apos;s never at a desk all end up on the same leaderboard.
        </p>
        <Cards min={205} items={[
          ["Every age, every shift", "Web, text, paper, or a phone call. Pick the one that suits you; the standings don't care which."],
          ["No money changes hands", "Not a pool, not a bet. The company runs it as a perk and players never pay."],
          ["Nothing to install, ever", "No app, no logins, no work email. Nothing that touches what IT runs."],
        ]} />
      </div>
    ),
  });

  S.push({
    id: "Four ways",
    body: (
      <div>
        <div className="dk-eye">The part that matters</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 13px", maxWidth: "24ch" }}>Four ways to take part — so everybody does.</h2>
        <p className="dk-lede" style={{ marginBottom: 20 }}>
          Every other pool asks people to come to it. We go to them, in whatever way they already communicate.
        </p>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))" }}>
          {[
            ["01", "The web", "Desk staff, phones, anyone with a link"],
            ["02", "Text message", "The floor, the road, the night shift"],
            ["03", "Paper sheet", "The break room and anyone who prefers a pen"],
            ["04", "Concierge call", "Executives, drivers, and people who like to talk"],
          ].map(([n, t, w]) => (
            <div key={n} className="dk-card">
              <div className="dk-num">{n}</div>
              <div style={{ fontFamily: "var(--font-grotesk),sans-serif", fontWeight: 700, fontSize: 17.5, margin: "7px 0 5px" }}>{t}</div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{w}</div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
          One promise across all four: nothing counts until the player has seen their picks read back to them.
        </p>
      </div>
    ),
  });

  S.push({
    id: "Web",
    body: <Modality n="01" name="The web" line="Nine games, three calls each. Two minutes and they're done."
      who="Desk staff, phones, anyone with a link"
      bullets={[
        "A short featured slate — the marquee games, not all sixteen. Nobody is scared off by a wall of picks.",
        "Winner, spread, and over/under, so the casual fan and the diehard both have something to argue about.",
        "One Power Pick a week doubles their points — that's the Friday-afternoon conversation.",
        "No download, no account to manage. They tap a link and play.",
      ]}
      why="Autofill for the people who just want to be in it: favorites, home teams, or random. Ten seconds, card done."
      visual={<WebMock />} />,
  });

  S.push({
    id: "Text",
    body: <Modality n="02" name="Text message" line="It walks them through the week one game at a time, like texting a friend."
      who="The floor, the road, the night shift"
      bullets={[
        "They text PLAY and it offers each game with the line — they answer in plain words.",
        "Talk-to-text works; we handle the slop. No app to download, no password to forget.",
        "Every pick gets echoed back, then a full card recap before anything locks.",
        "A weekly nudge lands before lock, so nobody misses a week because they forgot.",
      ]}
      why="About 80% of the workforce is deskless. An app never reaches them. A text does."
      visual={<TextMock />} />,
  });

  S.push({
    id: "Paper",
    body: <Modality n="03" name="Paper sheet" line="A printed sheet, a pen, and a photo. That's the whole thing."
      who="The break room, the shop floor, anyone who prefers a pen"
      bullets={[
        "Print the week's sheet with your company name and colors on it. Pin it up, stack it by the coffee.",
        "They check boxes with a pen — the way office pools have always worked.",
        "Snap a photo, text it in. We read the sheet and text every pick back in plain English to confirm.",
        "Anything unreadable gets asked one at a time, then it locks.",
      ]}
      why="Someone who has picked games on paper for thirty years doesn't have to change a thing to be included."
      visual={<PaperMock />} />,
  });

  S.push({
    id: "Concierge",
    body: <Modality n="04" name="The concierge line" line="They call a number and talk it through — and it talks back."
      who="Executives, drivers, and anyone who'd rather just say it out loud"
      bullets={[
        "A real two-way conversation. It greets them by name and walks the slate at their pace.",
        "Chatty if they want the company, rapid-fire if they're between meetings — it reads the room.",
        "\"Steelers all day, and the over.\" It confirms, reads the full card back, and submits only on their say-so.",
        "No buttons, no menu tree, no \"press 1 for\" — they just talk.",
      ]}
      why="This is the one people tell their coworkers about. Free for your first season as a founding league."
      visual={<VoiceMock />} />,
  });

  S.push({
    id: "Watch it",
    body: (
      <div>
        <div className="dk-eye">See the whole thing</div>
        <h2 className="dk-h2" style={{ margin: "11px 0 16px", maxWidth: "24ch" }}>Forty seconds, start to finish.</h2>
        <div className="dk-card" style={{ padding: 0, overflow: "hidden" }}>
          <video className="dk-video" controls preload="metadata" playsInline poster="/walkthrough-poster.jpg">
            <source src="/walkthrough.mp4" type="video/mp4" />
          </video>
          <div className="muted" style={{ padding: "10px 14px", fontSize: 12.5 }}>
            Making picks, the live leaderboard, and the commissioner console you&apos;d run it from.
          </div>
        </div>
      </div>
    ),
  });

  S.push({
    id: "Approval",
    body: (
      <div>
        <div className="dk-eye">Built to be approved</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 18px", maxWidth: "28ch" }}>
          Every stakeholder gets a specific reason to say yes.
        </h2>
        <Cards items={APPROVERS} min={230} />
        <div className="dk-card hot" style={{ marginTop: 13, fontSize: 14, lineHeight: 1.55 }}>
          <b>To be completely clear about IT:</b> we never touch corporate email addresses, your directory, or
          any system your company runs. There is nothing to install, nothing to integrate, and nothing for
          security to review. Employees join with a first name on a web link — which is why this launches in
          days instead of a quarter.
        </div>
      </div>
    ),
  });

  S.push({
    id: "Everyone plays",
    body: (
      <div>
        <div className="dk-eye">Who actually gets included</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 14px", maxWidth: "26ch" }}>
          The people your programs usually miss are the point.
        </h2>
        <p className="dk-lede" style={{ marginBottom: 18 }}>
          Every workplace has people who quietly sit these things out — because the format assumed they
          weren&apos;t interested, or because it needed an app they don&apos;t have. <b>About 47% of NFL fans are
          women, but only around a quarter of fantasy players are.</b> Older and deskless staff get left out for
          a different reason: the technology. Both are design problems, and we fixed both.
        </p>
        <Cards min={210} items={[
          ["No test at the door", "No draft, no jargon, no proving you're a real fan. Two minutes and you're in."],
          ["Blind grading", "Picks are scored by the engine. The standings don't know your age, your role, or your name."],
          ["Four ways in", "Nobody is excluded by the device in their pocket — or by not having one."],
        ]} />
        <p className="dk-src">Sources: SSRS Sports Poll / FSGA (2025).</p>
      </div>
    ),
  });

  S.push({
    id: "Alternatives",
    body: (
      <div>
        <div className="dk-eye">The alternatives</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 16px", maxWidth: "30ch" }}>
          Every option wins on at most one thing. Ours wins on all four.
        </h2>
        <div className="dk-grid" style={{ gap: 8 }}>
          {ALTERNATIVES.map(([name, why, us]) => (
            <div key={name} className="dk-card" style={{
              padding: "12px 15px",
              borderColor: us ? "var(--accent)" : "var(--line)",
              background: us ? "rgba(var(--accent-rgb),.09)" : undefined,
              display: "grid", gridTemplateColumns: "minmax(135px,185px) 1fr", gap: 13, alignItems: "baseline",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: us ? "var(--accent)" : "var(--text)" }}>
                {us ? "✓ " : ""}{name}
              </div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{why}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  S.push({
    id: "The map",
    body: (
      <div>
        <div className="dk-eye">The map</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 16px", maxWidth: "26ch" }}>Two questions decide this purchase.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", alignItems: "center" }}>
          <MapSvg />
          <div className="dk-grid" style={{ marginTop: 0 }}>
            {[
              ["Will the whole workforce actually take part?", "Web, text, paper, and phone. That's the only reason the answer is yes."],
              ["Is it easy and low-risk to approve?", "No money, nothing to install, one flat rate, money back through Week 8."],
            ].map(([h, b]) => (
              <div key={h} className="dk-card">
                <div style={{ fontWeight: 700, marginBottom: 5, fontSize: 14.5 }}>{h}</div>
                <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{b}</div>
              </div>
            ))}
            <div className="dk-card hot" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
              Everything else answers one or the other. Nothing else answers both.
            </div>
          </div>
        </div>
      </div>
    ),
  });

  S.push({
    id: "Objection",
    body: (
      <div>
        <div className="dk-eye">The question you&apos;re going to get</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 14px", maxWidth: "30ch" }}>
          &ldquo;Isn&apos;t this gambling? Won&apos;t it distract people?&rdquo;
        </h2>
        <p className="dk-lede" style={{ marginBottom: 18 }}>
          One in five Americans bet on sports last year, often on work devices and on the clock. The cash pool
          is already in your building. This gives people the same fun with zero money — the sanctioned version
          of something they are doing anyway.
        </p>
        <Cards min={210} items={[
          ["No money, no house", "No buy-ins, no pots, no payouts. Skill-based predictions, not a bet."],
          ["Two minutes a week", "Async, one-tap autofill. Less distraction than the betting apps it replaces."],
          ["Prefer no spread talk?", "Winners-only mode hides the spread and the over/under. Just pick who wins."],
        ]} />
        <p className="dk-src">Sources: NCPG (2024) · Mintz / SHRM (2024).</p>
      </div>
    ),
  });

  S.push({
    id: "The math",
    body: (
      <div>
        <div className="dk-eye">The math</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 16px", maxWidth: "26ch" }}>The one-slide business case.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))" }}>
          {[["$3.75–8", "per employee, per season, at founding rates"],
            ["$36–72+", "per employee for engagement apps, before rewards"],
            ["$100–500", "per employee a year, what team-building already costs you"]].map(([n, l]) => (
            <div key={n} className="dk-card dk-stat"><div className="n">{n}</div><div className="l">{l}</div></div>
          ))}
        </div>
        <div className="dk-card hot" style={{ marginTop: 13, fontSize: 14.5, lineHeight: 1.55 }}>
          A 150-person company pays <b>$900 for the season</b> — about <b>$6 a head</b>, or roughly one catered
          lunch nobody remembers by Friday. It buys eighteen weeks of the plant floor and the front office in
          the same standings.
        </div>
        <p className="dk-src">Per-employee figures are the founding rate divided by the top of each tier band.</p>
      </div>
    ),
  });

  S.push({
    id: "Proof",
    body: (
      <div>
        <div className="dk-eye">Proof · built and live</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 18px", maxWidth: "24ch" }}>This isn&apos;t a roadmap. It&apos;s running.</h2>
        <Cards min={230} items={[
          ["All four ways to take part work today", "Web, text, paper photo, and the concierge phone line — built, tested, and live right now."],
          ["Scoring runs itself", "Winners, spreads, over/unders, Power Picks, tiebreaks. Automatic every week, all season."],
          ["Texting is carrier-registered", "Verified business messaging on a real local number, not a grey-market workaround."],
          ["The season is loaded", "Every 2026 game, every week, already in. Your league is live the day you say go."],
        ]} />
      </div>
    ),
  });

  S.push({
    id: "How it works",
    body: (
      <div>
        <div className="dk-eye">What you actually have to do</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 18px", maxWidth: "26ch" }}>Three things, and none of them take a meeting.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))" }}>
          {HOW.map(([h, b], n) => (
            <div key={h} className="dk-card">
              <div className="dk-num">{String(n + 1).padStart(2, "0")}</div>
              <div style={{ fontWeight: 700, fontSize: 15, margin: "7px 0 6px" }}>{h}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{b}</div>
            </div>
          ))}
        </div>
        <div className="dk-card" style={{ marginTop: 13, fontSize: 14, lineHeight: 1.55 }}>
          <span className="muted">Your total time as commissioner:</span> <b>a few clicks a week, if you feel
          like it.</b> We do the setup, the branding, and the first week&apos;s sheets for you.
        </div>
      </div>
    ),
  });

  S.push({
    id: "Pricing",
    body: (
      <div>
        <div className="dk-eye">Founding Season 2026 · first 50 companies</div>
        <h2 className="dk-h2" style={{ margin: "10px 0 8px" }}>One flat rate. Players never pay.</h2>
        <p className="dk-lede" style={{ marginBottom: 14 }}>
          No per-head math, no metering, no penalty for people who don&apos;t play. Founding pricing is about half
          off and holds for three seasons, through 2028.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th className="dk-th">Tier</th><th className="dk-th">Company size</th>
                <th className="dk-th" style={{ textAlign: "right" }}>Founding / season</th>
                <th className="dk-th" style={{ textAlign: "right" }}>Standard</th>
                <th className="dk-th" style={{ textAlign: "right" }}>Per employee</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.name}>
                  <td className="dk-td" style={{ fontWeight: 700 }}>{t.name}</td>
                  <td className="dk-td muted">{t.size}</td>
                  <td className="dk-td" style={{ textAlign: "right", fontWeight: 800, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                    {t.founding}
                    {t.save ? <span style={{ fontSize: 10.5, fontWeight: 800, color: "#35d29a", background: "rgba(53,210,154,.14)", borderRadius: 5, padding: "2px 6px", marginLeft: 7 }}>{t.save}</span> : null}
                  </td>
                  <td className="dk-td muted" style={{ textAlign: "right", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>{t.standard}</td>
                  <td className="dk-td muted" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{t.per}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>Nonprofits and schools: 30% off. Premium add-ons available on any tier.</p>
      </div>
    ),
  });

  S.push({
    id: "How billing works",
    body: (
      <div>
        <div className="dk-eye">How billing actually works</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 16px", maxWidth: "26ch" }}>Start today. Nothing is charged until kickoff.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
          {([
            ["Today", "You sign a one-page order form and we switch your league on. Your team can start playing this week. No charge."],
            ["Your choice of method", "Put a card on file, or give us your AP contact and we'll invoice on your terms. Whichever your company prefers."],
            ["September 9", "Kickoff. That's the day the card is charged or the invoice is issued — not before."],
            ["Through Week 8", "If your team isn't more engaged halfway through the season, you get every dollar back."],
          ] as [string, string][]).map(([h, b]) => (
            <div key={h} className="dk-card">
              <div className="dk-num">{h}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 7 }}>{b}</div>
            </div>
          ))}
        </div>
        <div className="dk-card hot" style={{ marginTop: 13, fontSize: 14, lineHeight: 1.55 }}>
          <b>Founding leagues also get:</b> the concierge phone line free for a season, done-for-you setup and
          branding, printed paper sheets for your sites, and a direct line to me instead of a support queue.
        </div>
      </div>
    ),
  });

  S.push({
    id: "Close",
    body: (
      <div>
        <div className="dk-eye">Kickoff is September 9</div>
        <h1 className="dk-h1" style={{ margin: "14px 0 15px", maxWidth: "21ch", fontSize: "clamp(27px,4vw,46px)" }}>
          Want me to switch your league on <em style={{ fontStyle: "normal", color: "var(--accent)" }}>this week?</em>
        </h1>
        <p className="dk-lede" style={{ marginBottom: 20 }}>
          Send your league name and colors and your team can be making picks by Friday — free, nothing owed
          until kickoff. A pick&apos;em league that starts in Week 3 doesn&apos;t work, so the real deadline is the
          calendar, not the offer.
        </p>
        <div className="dk-card" style={{ display: "flex", gap: 15, alignItems: "center", maxWidth: 560 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%", flex: "none",
            background: "linear-gradient(140deg,var(--accent),var(--accent-d))",
            display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 21,
            fontFamily: "var(--font-grotesk),sans-serif",
          }}>AD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Ankur Doshi</div>
            <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 3 }}>
              I built Office Pick&apos;em League and I run every founding account myself — setup, branding, and
              the calls. You get me, not a support queue.
            </div>
            <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 7 }}>
              ankur@officepickemleague.com · 717.903.5334
            </div>
          </div>
        </div>
      </div>
    ),
  });

  return S;
}
