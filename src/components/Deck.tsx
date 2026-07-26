"use client";

/**
 * The buyer pitch deck (/deck) — presented on a call or sent as a follow-up link.
 *
 * Structure follows the argument that worked in the 2026-07 sales deck: name the problem, prove
 * engagement pays, show the fix, walk the four ways to play, then clear each blocker in turn
 * (approval, inclusion, alternatives, the gambling question) before price and the ask.
 *
 * Two modes, because it does both jobs:
 *   "live" — video slides become GO-LIVE cue cards telling you what to show in the real product.
 *   "send" — the same slides embed walkthrough.mp4 so the deck stands alone.
 *
 * Every stat here is sourced on the slide that uses it. Don't add a number without one.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Mode = "live" | "send";

const TIERS = [
  { name: "Starter", size: "Up to 50 employees", founding: "$400", standard: "$750", save: "−47%", per: "$8.00" },
  { name: "Team", size: "Up to 150 employees", founding: "$900", standard: "$1,800", save: "−50%", per: "$6.00" },
  { name: "Company", size: "Up to 400 employees", founding: "$1,900", standard: "$3,900", save: "−51%", per: "$4.75" },
  { name: "Large", size: "Up to 1,000 employees", founding: "$3,750", standard: "$7,500", save: "−50%", per: "$3.75" },
  { name: "Enterprise", size: "1,000+ / multi-site", founding: "Let's talk", standard: "Custom", save: "", per: "—" },
];

const MODALITIES = [
  {
    n: "01",
    name: "The web",
    who: "Desk staff, phones, anyone with a link",
    line: "Nine games, three calls each. Two minutes and they're done.",
    detail: [
      "A short featured slate — the marquee games, not all sixteen. Nobody is scared off by a wall of picks.",
      "Winner, spread, and over/under on each game, so the casual fan and the sharp both have something to argue about.",
      "One Power Pick a week doubles their points — that's the Friday-afternoon conversation.",
      "No download, no account to manage. They tap a link and play.",
    ],
    proof: "Autofill for the people who just want to be in it: favorites, home teams, or random. Ten seconds, card done.",
  },
  {
    n: "02",
    name: "Text",
    who: "The floor, the road, the night shift",
    line: "It walks them through the week one game at a time, like texting a friend.",
    detail: [
      "They text PLAY and the bot offers each game with the line — they answer in plain words.",
      "\"Steelers, take the over.\" \"Give me the Chiefs.\" Talk-to-text works; we handle the slop.",
      "Every pick gets echoed back, then a full card recap before anything locks.",
      "A weekly nudge lands before lock, so nobody misses a week because they forgot.",
    ],
    proof: "About 80% of the workforce is deskless (Emergence/TalentCards, 2024). An app never reaches them. A text does.",
  },
  {
    n: "03",
    name: "Paper",
    who: "The break room, the shop floor, the holdouts",
    line: "A printed sheet, a pen, and a photo. That's the whole flow.",
    detail: [
      "Print the week's sheet with your league's name and colors on it. Pin it up, stack it by the coffee.",
      "They check boxes with a pen — the way office pools have always worked.",
      "Snap a photo, text it in. We read the sheet and text every pick back in plain English to confirm.",
      "Anything unreadable gets asked one at a time. Corrections in plain words, then it locks.",
    ],
    proof: "The 60-year-old who has picked games on paper for thirty years doesn't have to change a thing.",
  },
  {
    n: "04",
    name: "The concierge line",
    who: "Executives, drivers, and people who just like talking",
    line: "They call a number and talk their picks through with a real conversation.",
    detail: [
      "It greets them by name and walks the slate game by game, at their pace.",
      "Chatty if they want company, rapid-fire if they're between meetings.",
      "Reads the full card back and only submits when they say so.",
      "Premium add-on — and the thing people tell their coworkers about.",
    ],
    proof: "Free for your first season as a founding league.",
  },
];

const EVIDENCE = [
  { n: "63%", l: "fewer safety incidents on the most-engaged teams" },
  { n: "$154B", l: "a year — the U.S. cost of workplace loneliness, a bill your CFO already pays" },
  { n: "7×", l: "more engaged when people have a real friend at work" },
  { n: "~80%", l: "of the workforce is deskless — an app never reaches them" },
  { n: "~47%", l: "of NFL fans are women, but only ~26% of fantasy players" },
  { n: "$3.75–8", l: "per employee a year, against the $100–500 you already spend on team-building" },
];

const APPROVERS = [
  ["HR / People", "A whole-workforce ritual that finally reaches the frontline — with participation reporting to prove it worked."],
  ["Legal", "Zero money anywhere in the game. The sanctioned alternative to the cash pool that's already happening in your building."],
  ["IT / Security", "Nothing to install. No SSO, no directory access, no data grab. The easiest approval they'll give all year."],
  ["Finance", "One flat seasonal rate — a fraction of a single team-building event. No per-head math, no procurement cycle."],
];

const ALTERNATIVES = [
  ["Cash office pool", "Illegal or grey-area in most states — the one version Legal can never bless.", false],
  ["Fantasy football", "Drafts, waivers, hours a week. The diehards love it; everyone else taps out by Week 3.", false],
  ["Engagement apps", "Bonusly, Nectar — not sports, no weekly hook, and $36–72+ per employee before rewards.", false],
  ["Team-building / offsites", "One day, then it's over. Expensive, and it excludes shift, field, and remote staff.", false],
  ["DIY spreadsheet + text", "Manual scoring breaks weekly and burns out the one person running it. Dead by Week 4.", false],
  ["Office Pick'em League", "Fun, inclusive, safe, and cheap — the whole workforce, all season, at $3.75–8 per employee. We run it.", true],
];

const HOW = [
  ["Create your league", "Two minutes: name it, set a PIN, pick your colors. Every game, every week, all season is pre-loaded."],
  ["Share one link", "Break room, group text, newsletter. Players join with a name and a phone number. No email, no password, no app."],
  ["The season runs itself", "Reminders go out, games lock at kickoff, scores grade automatically, standings update. You enjoy the trash talk."],
];

export default function Deck() {
  const [i, setI] = useState(0);
  const [mode, setMode] = useState<Mode>("live");

  const slides = buildSlides(mode);
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
      {/* Raw HTML, not a text child: React escapes angle brackets and quotes inside a server-rendered
          style tag, and the client doesn't, which trips a hydration mismatch and re-renders the page. */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* the deck is a full-screen presentation, so the site chrome only gets in the way */
        body footer{display:none}
        .dk-video{display:block;width:100%;max-height:46vh;aspect-ratio:16/9;background:#0d131d;object-fit:contain}
        .dk-slide{animation:dkIn .32s ease}
        @keyframes dkIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.dk-slide{animation:none}}
        .dk-h1{font-family:var(--font-grotesk),sans-serif;font-weight:700;letter-spacing:-1.2px;line-height:1.04;
          font-size:clamp(32px,5vw,58px);margin:0;text-wrap:balance}
        .dk-h2{font-family:var(--font-grotesk),sans-serif;font-weight:700;letter-spacing:-.6px;line-height:1.1;
          font-size:clamp(24px,3.2vw,38px);margin:0;text-wrap:balance}
        .dk-eye{font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:var(--accent)}
        .dk-lede{color:var(--muted);font-size:clamp(14.5px,1.6vw,18px);line-height:1.6;max-width:64ch}
        .dk-card{background:linear-gradient(180deg,var(--panel),var(--bg2));border:1px solid var(--line);
          border-radius:16px;padding:17px 19px}
        .dk-grid{display:grid;gap:13px}
        .dk-btn{background:transparent;border:1px solid var(--line);color:var(--muted);font:inherit;font-size:13px;
          font-weight:700;padding:9px 14px;border-radius:9px;cursor:pointer}
        .dk-btn:hover:not(:disabled){color:var(--text);border-color:var(--accent)}
        .dk-btn:disabled{opacity:.35;cursor:default}
        .dk-btn.on{color:#fff;background:var(--accent);border-color:var(--accent)}
        .dk-dot{width:7px;height:7px;border-radius:50%;background:var(--line);border:none;padding:0;cursor:pointer}
        .dk-dot.on{background:var(--accent);transform:scale(1.35)}
        .dk-num{font-family:var(--font-grotesk),sans-serif;font-size:13px;font-weight:700;color:var(--accent);letter-spacing:1px}
        .dk-li{display:flex;gap:11px;align-items:flex-start;font-size:14.5px;line-height:1.55;color:var(--muted)}
        .dk-li i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-top:8px}
        .dk-li b{color:var(--text);font-weight:600}
        .dk-th{font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);
          text-align:left;padding:0 10px 10px;border-bottom:2px solid var(--line)}
        .dk-td{padding:11px 10px;border-bottom:1px solid var(--line);font-size:14.5px}
        .dk-cue{border:1px dashed var(--accent);background:rgba(var(--accent-rgb),.06);border-radius:16px;padding:20px 22px}
        .dk-stat .n{font-family:var(--font-grotesk),sans-serif;font-weight:700;font-size:clamp(22px,2.7vw,32px);
          color:var(--accent);line-height:1;font-variant-numeric:tabular-nums}
        .dk-stat .l{color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:7px}
        .dk-src{font-size:11px;color:var(--muted2);margin-top:16px;line-height:1.6;max-width:78ch}
        .dk-dots{display:flex;gap:6px;align-items:center}
        @media (max-width:640px){
          .dk-hide-sm,.dk-dots{display:none}
          .dk-bar{padding:12px 16px} .dk-foot{padding:12px 16px}
          .dk-brand{font-size:13.5px}
        }
      ` }} />

      {/* top bar */}
      <div className="dk-bar" style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 26px", borderBottom: "1px solid var(--line)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: "var(--text)" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(140deg,var(--accent),var(--accent-d))", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, color: "#fff", flex: "none" }}>O</span>
          <span className="dk-brand" style={{ fontFamily: "var(--font-grotesk),sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap" }}>Office Pick&apos;em League</span>
        </Link>
        <span className="muted dk-hide-sm" style={{ fontSize: 12, marginLeft: 4 }}>Founding Season 2026</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span className="muted dk-hide-sm" style={{ fontSize: 11.5, marginRight: 2 }}>Mode</span>
          <button className={`dk-btn ${mode === "live" ? "on" : ""}`} onClick={() => setMode("live")} title="Cue cards for demoing the real product">Live demo</button>
          <button className={`dk-btn ${mode === "send" ? "on" : ""}`} onClick={() => setMode("send")} title="Videos embedded — stands alone if you send the link">Send</button>
        </div>
      </div>

      {/* slide */}
      <div key={`${mode}-${i}`} className="dk-slide" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", alignItems: "center", padding: "28px 26px" }}>
        <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>{s.body}</div>
      </div>

      {/* footer nav */}
      <div className="dk-foot" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 26px", borderTop: "1px solid var(--line)" }}>
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

function Video({ src, poster, caption }: { src: string; poster: string; caption: string }) {
  return (
    <div className="dk-card" style={{ padding: 0, overflow: "hidden" }}>
      <video className="dk-video" controls preload="metadata" playsInline poster={poster}>
        <source src={src} type="video/mp4" />
      </video>
      <div className="muted" style={{ padding: "10px 14px", fontSize: 12.5 }}>{caption}</div>
    </div>
  );
}

function Cue({ title, say, show }: { title: string; say: string; show: string[] }) {
  return (
    <div className="dk-cue">
      <div className="dk-eye" style={{ marginBottom: 8 }}>▶ Go live — {title}</div>
      <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.55, color: "var(--text)" }}>&ldquo;{say}&rdquo;</p>
      <div className="dk-grid">
        {show.map((x) => <div key={x} className="dk-li"><i />{x}</div>)}
      </div>
    </div>
  );
}

function Cards({ items, min = 235 }: { items: (string | boolean)[][]; min?: number }) {
  return (
    <div className="dk-grid" style={{ gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))` }}>
      {items.map(([h, b]) => (
        <div key={String(h)} className="dk-card">
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{h}</div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{b}</div>
        </div>
      ))}
    </div>
  );
}

function buildSlides(mode: Mode) {
  const slides: { id: string; body: React.ReactNode }[] = [];

  slides.push({
    id: "Cover",
    body: (
      <div>
        <div className="dk-eye">Founding Season 2026 · Kickoff Sept 9</div>
        <h1 className="dk-h1" style={{ margin: "16px 0 18px", maxWidth: "17ch" }}>
          The office pool <em style={{ fontStyle: "normal", color: "var(--accent)" }}>everyone</em> can play.
        </h1>
        <p className="dk-lede">
          An NFL prediction game your whole team plays in two minutes a week — by web, by text, on paper, or
          over the phone. No money. No app. Nobody left out.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 26 }}>
          {["No money, no betting", "Players never pay", "Nothing to install"].map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Problem",
    body: (
      <div>
        <div className="dk-eye">The problem</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 20px", maxWidth: "26ch" }}>
          Football season is already in your building. You just can&apos;t sanction it.
        </h2>
        <Cards items={[
          ["The cash pool is a liability", "Money pools are illegal or grey-area in most states. It's happening anyway, in a spreadsheet, run by one exhausted person — and Legal would rather not know."],
          ["Fantasy loses the room", "Drafts, waivers, hours a week. The diehards love it. Everyone else taps out by Week 3."],
          ["Half your people aren't at a desk", "Anything that needs an app, an SSO login, or a laptop leaves out the floor, the road, and the night shift."],
        ]} min={240} />
      </div>
    ),
  });

  slides.push({
    id: "Evidence",
    body: (
      <div>
        <div className="dk-eye">The evidence</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 20px", maxWidth: "28ch" }}>
          Engaged teams are safer and they stay. Half the fun is on the bench.
        </h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))" }}>
          {EVIDENCE.map((e) => (
            <div key={e.n} className="dk-card dk-stat">
              <div className="n">{e.n}</div>
              <div className="l">{e.l}</div>
            </div>
          ))}
        </div>
        <p className="dk-src">
          Sources: Gallup Q12 Meta-Analysis, 11th ed. (2024) · Cigna (2020) · SSRS Sports Poll / FSGA (2025) ·
          Emergence / TalentCards (2024) · O.C. Tanner (2024). Full citations in the evidence pack.
        </p>
      </div>
    ),
  });

  slides.push({
    id: "The fix",
    body: (
      <div>
        <div className="dk-eye">The fix</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 16px", maxWidth: "26ch" }}>
          One league the whole building can actually join.
        </h2>
        <p className="dk-lede" style={{ marginBottom: 22 }}>
          Each week we put up a short slate of marquee games. Your people pick the winner, the spread, and the
          over/under — two minutes, however suits them. Scores grade themselves, the leaderboard moves, and
          Monday morning has something in it.
        </p>
        <Cards items={[
          ["No money changes hands", "Not a pool, not a bet. The company runs it as a perk."],
          ["Players never pay", "You cover it once. Nobody is ever asked for a buy-in."],
          ["Nothing to install", "A link, a text message, a sheet of paper, or a phone call."],
        ]} min={205} />
      </div>
    ),
  });

  slides.push({
    id: "Four ways",
    body: (
      <div>
        <div className="dk-eye">The part that matters</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 14px", maxWidth: "24ch" }}>Four ways to play — so everybody does.</h2>
        <p className="dk-lede" style={{ marginBottom: 22 }}>
          This is the whole difference. Every other pool asks people to come to it. We go to them, in whatever
          way they already communicate.
        </p>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
          {MODALITIES.map((m) => (
            <div key={m.n} className="dk-card">
              <div className="dk-num">{m.n}</div>
              <div style={{ fontFamily: "var(--font-grotesk),sans-serif", fontWeight: 700, fontSize: 18, margin: "8px 0 6px" }}>{m.name}</div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{m.who}</div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 18 }}>
          One promise across all four: nothing counts until the player has seen their picks read back to them.
        </p>
      </div>
    ),
  });

  MODALITIES.forEach((m) => {
    slides.push({
      id: m.name,
      body: (
        <div>
          <div className="dk-eye">{m.n} · How they play</div>
          <h2 className="dk-h2" style={{ margin: "11px 0 8px" }}>{m.name}</h2>
          <p style={{ margin: "0 0 5px", fontSize: 17, color: "var(--text)", fontWeight: 600, maxWidth: "50ch", lineHeight: 1.4 }}>{m.line}</p>
          <p className="muted" style={{ fontSize: 13.5, margin: "0 0 20px" }}>Built for: {m.who}</p>
          <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", alignItems: "start" }}>
            <div className="dk-grid">
              {m.detail.map((d) => <div key={d} className="dk-li"><i />{d}</div>)}
            </div>
            <div className="dk-card" style={{ borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),.07)" }}>
              <div className="dk-eye" style={{ fontSize: 11, marginBottom: 7 }}>Why it wins</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>{m.proof}</div>
            </div>
          </div>
        </div>
      ),
    });
  });

  slides.push({
    id: "See it live",
    body: (
      <div>
        <div className="dk-eye">See it work</div>
        <h2 className="dk-h2" style={{ margin: "11px 0 18px", maxWidth: "24ch" }}>Forty seconds, start to finish.</h2>
        {mode === "send" ? (
          <Video src="/walkthrough.mp4" poster="/walkthrough-poster.jpg" caption="The product tour — picks, standings, insights, and the commissioner console." />
        ) : (
          <Cue
            title="the real product"
            say="Let me just show you the actual thing — this is your league, already set up."
            show={[
              "Picks page: the nine-game slate, three calls per game, one Power Pick.",
              "Hit autofill — show how someone who barely follows football still plays in ten seconds.",
              "Standings: the live leaderboard. Say the words \"this is the water cooler.\"",
              "Text a pick from your phone out loud, then hold up a paper sheet.",
            ]}
          />
        )}
      </div>
    ),
  });

  slides.push({
    id: "Approval",
    body: (
      <div>
        <div className="dk-eye">Built to be approved</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 20px", maxWidth: "28ch" }}>
          Every stakeholder gets a specific reason to say yes.
        </h2>
        <Cards items={APPROVERS} min={235} />
        <p className="muted" style={{ fontSize: 13.5, marginTop: 18 }}>
          <b style={{ color: "var(--text)" }}>And your people:</b> two minutes a week on a device they already
          have, bragging rights, a reason to talk across departments, and nobody left out.
        </p>
      </div>
    ),
  });

  slides.push({
    id: "Equalizer",
    body: (
      <div>
        <div className="dk-eye">The equalizer</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 16px", maxWidth: "26ch" }}>
          Half the fun in your building is sitting on the bench.
        </h2>
        <p className="dk-lede" style={{ marginBottom: 20 }}>
          About 47% of NFL fans are women, but only around a third of fantasy players are. The interest is
          there — the formats exclude it. Ours asks nobody to prove they belong.
        </p>
        <Cards items={[
          ["No test at the door", "No draft, no jargon, no permission needed. Two minutes and you're in."],
          ["Blind grading", "Picks are scored by the engine. The standings don't know who you are."],
          ["Public receipts", "When she tops the board in Week 8, the whole building sees it on the same leaderboard."],
        ]} min={215} />
        <p className="dk-src">Sources: SSRS Sports Poll / FSGA (2025).</p>
      </div>
    ),
  });

  slides.push({
    id: "Alternatives",
    body: (
      <div>
        <div className="dk-eye">The alternatives</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 18px", maxWidth: "30ch" }}>
          Every option wins on at most one thing. Ours wins on all four.
        </h2>
        <div className="dk-grid" style={{ gap: 9 }}>
          {ALTERNATIVES.map(([name, why, us]) => (
            <div key={String(name)} className="dk-card" style={{
              padding: "13px 16px",
              borderColor: us ? "var(--accent)" : "var(--line)",
              background: us ? "rgba(var(--accent-rgb),.09)" : undefined,
              display: "grid", gridTemplateColumns: "minmax(140px,190px) 1fr", gap: 14, alignItems: "baseline",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: us ? "var(--accent)" : "var(--text)" }}>
                {us ? "✓ " : ""}{name}
              </div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{why}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    id: "The map",
    body: (
      <div>
        <div className="dk-eye">The map</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 18px", maxWidth: "26ch" }}>Two questions decide this purchase.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", alignItems: "center" }}>
          <div>
            <div style={{ position: "relative", border: "1px solid var(--line)", borderRadius: 14, padding: 12, background: "var(--bg2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, aspectRatio: "1.25", fontSize: 12 }}>
                {[
                  ["Engagement apps", "Safe, but nobody sticks", false],
                  ["Office Pick'em League", "Whole workforce, easy yes", true],
                  ["Team-building / DIY", "Costly, or it breaks", false],
                  ["Real-money pools", "Fun, but Legal says no", false],
                ].map(([t, s2, us]) => (
                  <div key={String(t)} style={{
                    borderRadius: 10, padding: "11px 12px",
                    border: us ? "1px solid var(--accent)" : "1px solid var(--line)",
                    background: us ? "rgba(var(--accent-rgb),.14)" : "var(--panel)",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                  }}>
                    <div style={{ fontWeight: 700, color: us ? "var(--accent)" : "var(--text)", fontSize: 12.5 }}>{t}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 3, lineHeight: 1.4 }}>{s2}</div>
                  </div>
                ))}
              </div>
              <div className="muted" style={{ fontSize: 10.5, marginTop: 9, display: "flex", justifyContent: "space-between", letterSpacing: ".4px", textTransform: "uppercase" }}>
                <span>← fewer people play</span><span>everyone plays →</span>
              </div>
            </div>
            <div className="muted" style={{ fontSize: 10.5, marginTop: 6, textAlign: "center", letterSpacing: ".4px", textTransform: "uppercase" }}>
              vertical: easy and low-risk to adopt
            </div>
          </div>
          <div className="dk-grid">
            {[
              ["Will the whole workforce actually play?", "Web, text, paper, and phone. That's the only reason the answer is yes."],
              ["Is it easy and low-risk to approve?", "No money, nothing to install, one flat rate, money back through Week 8."],
            ].map(([h, b]) => (
              <div key={h} className="dk-card">
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{h}</div>
                <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{b}</div>
              </div>
            ))}
            <div className="dk-card" style={{ borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),.07)", fontSize: 14, lineHeight: 1.55 }}>
              Everything else answers one or the other. Nothing else answers both.
            </div>
          </div>
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Objection",
    body: (
      <div>
        <div className="dk-eye">The objection</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 16px", maxWidth: "30ch" }}>
          &ldquo;Isn&apos;t this gambling? Won&apos;t it distract people?&rdquo;
        </h2>
        <p className="dk-lede" style={{ marginBottom: 20 }}>
          One in five Americans bet on sports last year, often on work devices and on the clock. The cash pool
          is already in your building. We give people the same fun with zero money — the sanctioned version of
          a thing they are doing anyway.
        </p>
        <Cards items={[
          ["No money, no house", "No buy-ins, no pots, no payouts. Skill-based predictions, not a bet."],
          ["Two minutes a week", "Async, one-tap autofill. Less distraction than the betting apps it replaces."],
          ["Prefer no spread talk?", "Winners-only mode hides the spread and the over/under. Just pick who wins."],
        ]} min={215} />
        <p className="dk-src">Sources: NCPG (2024) · Mintz / SHRM (2024).</p>
      </div>
    ),
  });

  slides.push({
    id: "The math",
    body: (
      <div>
        <div className="dk-eye">The math</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 18px", maxWidth: "26ch" }}>The one-slide business case.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
          {[
            ["$3.75–8", "per employee, per season, at founding rates"],
            ["$36–72+", "per employee for engagement apps, before rewards"],
            ["$100–500", "per employee a year, what team-building already costs you"],
          ].map(([n, l]) => (
            <div key={n} className="dk-card dk-stat">
              <div className="n">{n}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
        <div className="dk-card" style={{ marginTop: 14, borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),.07)" }}>
          <div style={{ fontSize: 15, lineHeight: 1.6 }}>
            A 150-person company pays <b>$900 for the season</b> — about <b>$6 a head</b>, or roughly one catered
            lunch nobody remembers by Friday. It buys eighteen weeks of the plant floor and the front office in
            the same standings.
          </div>
        </div>
        <p className="dk-src">Per-employee figures are the founding rate divided by the top of each tier band.</p>
      </div>
    ),
  });

  slides.push({
    id: "Proof",
    body: (
      <div>
        <div className="dk-eye">Proof · built and live</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 18px", maxWidth: "24ch" }}>This isn&apos;t a roadmap. It&apos;s running.</h2>
        <Cards items={[
          ["All four ways to play work today", "Web, text, paper photo, and the concierge phone line — built, tested, and live right now."],
          ["Scoring runs itself", "Winners, spreads, over/unders, Power Picks, tiebreaks. Automatic every week, all season."],
          ["Texting is registered and approved", "Carrier-verified business messaging on a real local number, not a grey-market workaround."],
          ["The season is loaded", "Every 2026 game, every week, already in. Your league is live the day you say go."],
        ]} min={235} />
      </div>
    ),
  });

  slides.push({
    id: "How it works",
    body: (
      <div>
        <div className="dk-eye">How it works</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 20px", maxWidth: "26ch" }}>Live before your next coffee refill.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {HOW.map(([h, b], n) => (
            <div key={h} className="dk-card">
              <div className="dk-num">{String(n + 1).padStart(2, "0")}</div>
              <div style={{ fontWeight: 700, fontSize: 15.5, margin: "8px 0 6px" }}>{h}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
        <div className="dk-card" style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.6 }}>
          <span className="muted">A whole week&apos;s picks, sent from a flip phone:</span>{" "}
          <b style={{ fontFamily: "ui-monospace,Menlo,monospace" }}>&ldquo;1 PIT 2 BUF u LOCK 1&rdquo;</b>
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Pricing",
    body: (
      <div>
        <div className="dk-eye">Founding Season 2026 · first 50 companies</div>
        <h2 className="dk-h2" style={{ margin: "11px 0 9px" }}>One flat rate. Players never pay.</h2>
        <p className="dk-lede" style={{ marginBottom: 16 }}>
          No per-head math, no metering, no penalty for people who don&apos;t play. Founding pricing is about half
          off and holds for three seasons, through 2028.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                <th className="dk-th">Tier</th>
                <th className="dk-th">Company size</th>
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
                    {t.save ? <span style={{ fontSize: 11, fontWeight: 800, color: "#35d29a", background: "rgba(53,210,154,.14)", borderRadius: 5, padding: "2px 6px", marginLeft: 8 }}>{t.save}</span> : null}
                  </td>
                  <td className="dk-td muted" style={{ textAlign: "right", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>{t.standard}</td>
                  <td className="dk-td muted" style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{t.per}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>Nonprofits and schools: 30% off. Premium add-ons available on any tier.</p>
      </div>
    ),
  });

  slides.push({
    id: "Risk",
    body: (
      <div>
        <div className="dk-eye">Why this is an easy yes</div>
        <h2 className="dk-h2" style={{ margin: "13px 0 20px", maxWidth: "24ch" }}>Start free today. Decide with evidence.</h2>
        <Cards items={[
          ["Nothing due today", "We switch your league on now, free. No card, no deposit. Billing starts at kickoff."],
          ["Money back through Week 8", "If your team isn't more engaged halfway through the season, you get every dollar back."],
          ["Your rate is locked", "Founding price holds for three seasons — 2026, 2027, 2028."],
          ["We do the setup", "Send the roster and your colors. Your league is live the same day."],
        ]} min={240} />
        <div className="dk-card" style={{ marginTop: 14, borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),.07)", fontSize: 14.5, lineHeight: 1.6 }}>
          <b>Founding leagues also get:</b> the concierge phone line free for a season, done-for-you setup and
          branding, printed paper sheets for your sites, and a direct line to me instead of a support queue.
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Close",
    body: (
      <div>
        <div className="dk-eye">Kickoff is September 9</div>
        <h1 className="dk-h1" style={{ margin: "15px 0 16px", maxWidth: "20ch", fontSize: "clamp(28px,4.2vw,50px)" }}>
          Want me to switch your league on <em style={{ fontStyle: "normal", color: "var(--accent)" }}>this week?</em>
        </h1>
        <p className="dk-lede" style={{ marginBottom: 22 }}>
          Give me your league name and colors and your team can be making picks by Friday — free, nothing owed
          until kickoff. A pick&apos;em league that starts in Week 3 doesn&apos;t work, so the real deadline is the
          calendar, not the offer.
        </p>
        <div className="dk-card" style={{ display: "inline-block", padding: "17px 21px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Ankur Doshi</div>
          <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            ankur@officepickemleague.com<br />717.903.5334<br />officepickemleague.com
          </div>
        </div>
      </div>
    ),
  });

  return slides;
}
