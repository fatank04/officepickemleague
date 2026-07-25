"use client";

/**
 * The buyer pitch deck (/deck) — presented on a call or sent as a follow-up link.
 *
 * Two modes, because it does both jobs:
 *   "live" — video slides become GO-LIVE cue cards telling you what to show in the real product.
 *   "send" — the same slides embed walkthrough.mp4 / promo-hero.mp4 so the deck stands alone.
 *
 * Arrow keys or the footer buttons advance. Slide bodies are plain data below so the copy
 * stays editable without touching layout.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Mode = "live" | "send";

const TIERS = [
  { name: "Starter", size: "Up to 50 employees", founding: "$400", standard: "$750", save: "−47%" },
  { name: "Team", size: "Up to 150 employees", founding: "$900", standard: "$2,250", save: "−60%" },
  { name: "Company", size: "Up to 400 employees", founding: "$1,900", standard: "$5,400", save: "−65%" },
  { name: "Large", size: "Up to 1,000 employees", founding: "$3,750", standard: "$9,900", save: "−62%" },
  { name: "Enterprise", size: "1,000+ / multi-site", founding: "Let's talk", standard: "Custom", save: "" },
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
      "No download, no account for the player to manage. They tap a link and play.",
    ],
    proof: "Autofill for the people who just want to be in it: favorites, home teams, or random.",
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
    proof: "This is the one that gets your deskless people playing. No app has ever managed that.",
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
    proof: "Nobody gets left out because they don't want another app on their phone.",
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

const WEEK = [
  { d: "Tuesday", t: "The nudge", b: "A text goes out with the week's slate. One tap to start, or reply PLAY." },
  { d: "Wed–Sat", t: "Picks trickle in", b: "Web, text, paper, or a phone call — whatever that person prefers. Two minutes each." },
  { d: "Sunday", t: "Game day", b: "Scores grade themselves. The leaderboard moves live while everyone's watching anyway." },
  { d: "Monday", t: "The banter", b: "Results text lands. Someone's bragging by 9am. That's the whole product." },
];

const INCLUDED = [
  ["The full season game", "Winners, spreads, over/unders, and a weekly Power Pick."],
  ["Automatic everything", "Scoring, grading, standings, tiebreaks. You never touch a spreadsheet."],
  ["Your league, your brand", "Your name, colors, logo, and a prize board you control."],
  ["Commissioner console", "Roster tools, reminders, and a week-by-week view of who's in."],
  ["Weekly texts", "Reminders before lock, results after. The rhythm that keeps people playing."],
  ["Every modality, day one", "Web, text, and paper are all included — not upsells."],
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
      <style>{`
        /* the deck is a full-screen presentation — the site chrome would only get in the way */
        body > footer{display:none}
        .dk-video{display:block;width:100%;max-height:46vh;aspect-ratio:16/9;background:#0d131d;object-fit:contain}
        .dk-slide{animation:dkIn .32s ease}
        @keyframes dkIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.dk-slide{animation:none}}
        .dk-h1{font-family:var(--font-grotesk),sans-serif;font-weight:700;letter-spacing:-1.2px;line-height:1.04;
          font-size:clamp(34px,5.4vw,62px);margin:0;text-wrap:balance}
        .dk-h2{font-family:var(--font-grotesk),sans-serif;font-weight:700;letter-spacing:-.6px;line-height:1.1;
          font-size:clamp(26px,3.4vw,40px);margin:0}
        .dk-eye{font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:var(--accent)}
        .dk-lede{color:var(--muted);font-size:clamp(15px,1.7vw,19px);line-height:1.6;max-width:62ch}
        .dk-card{background:linear-gradient(180deg,var(--panel),var(--bg2));border:1px solid var(--line);
          border-radius:16px;padding:20px 22px}
        .dk-grid{display:grid;gap:14px}
        .dk-btn{background:transparent;border:1px solid var(--line);color:var(--muted);font:inherit;font-size:13px;
          font-weight:700;padding:9px 14px;border-radius:9px;cursor:pointer}
        .dk-btn:hover:not(:disabled){color:var(--text);border-color:var(--accent)}
        .dk-btn:disabled{opacity:.35;cursor:default}
        .dk-btn.on{color:#fff;background:var(--accent);border-color:var(--accent)}
        .dk-dot{width:7px;height:7px;border-radius:50%;background:var(--line);border:none;padding:0;cursor:pointer}
        .dk-dot.on{background:var(--accent);transform:scale(1.35)}
        .dk-num{font-family:var(--font-grotesk),sans-serif;font-size:13px;font-weight:700;color:var(--accent);letter-spacing:1px}
        .dk-li{display:flex;gap:11px;align-items:flex-start;font-size:15px;line-height:1.55;color:var(--muted)}
        .dk-li i{flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-top:8px}
        .dk-li b{color:var(--text);font-weight:600}
        .dk-th{font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);
          text-align:left;padding:0 10px 10px;border-bottom:2px solid var(--line)}
        .dk-td{padding:13px 10px;border-bottom:1px solid var(--line);font-size:15px}
        .dk-cue{border:1px dashed var(--accent);background:rgba(var(--accent-rgb),.06);border-radius:16px;padding:22px 24px}
        .dk-dots{display:flex;gap:6px;align-items:center}
        @media (max-width:640px){
          .dk-hide-sm,.dk-dots{display:none}
          .dk-bar{padding:12px 16px} .dk-foot{padding:12px 16px}
          .dk-brand{font-size:13.5px}
        }
      `}</style>

      {/* top bar */}
      <div className="dk-bar" style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 26px", borderBottom: "1px solid var(--line)" }}>
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
      <div key={`${mode}-${i}`} className="dk-slide" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", alignItems: "center", padding: "30px 26px" }}>
        <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>{s.body}</div>
      </div>

      {/* footer nav */}
      <div className="dk-foot" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 26px", borderTop: "1px solid var(--line)" }}>
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
        {show.map((x) => (
          <div key={x} className="dk-li"><i />{x}</div>
        ))}
      </div>
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
        <h1 className="dk-h1" style={{ margin: "16px 0 18px", maxWidth: "18ch" }}>
          The office football pool your whole team <em style={{ fontStyle: "normal", color: "var(--accent)" }}>actually plays.</em>
        </h1>
        <p className="dk-lede">
          No money. No betting. No app. An NFL pick&apos;em game you run for your people — and the folks who never
          joined the fantasy league play too.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 26 }}>
          {["HR-safe by design", "Players never pay", "Two minutes a week"].map((t) => (
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
        <h2 className="dk-h2" style={{ margin: "14px 0 22px", maxWidth: "24ch" }}>Engagement spend reaches the same twenty percent.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {[
            ["The lunch-and-learn problem", "You spend real money on team building and the same handful of people show up. Nobody talks about it on Friday."],
            ["The pool problem", "Every office already has a football pool. It involves cash, a spreadsheet, and one exhausted person chasing people — and HR would rather not know."],
            ["The deskless problem", "Half your team isn't at a computer. Anything that needs an app or a login leaves them out entirely."],
          ].map(([h, b]) => (
            <div key={h} className="dk-card">
              <div style={{ fontWeight: 700, marginBottom: 7, fontSize: 15.5 }}>{h}</div>
              <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    id: "What it is",
    body: (
      <div>
        <div className="dk-eye">What it is</div>
        <h2 className="dk-h2" style={{ margin: "14px 0 18px", maxWidth: "26ch" }}>
          One game, running quietly in the background of your season.
        </h2>
        <p className="dk-lede" style={{ marginBottom: 24 }}>
          Each week we put up a short slate of marquee games. Your people make their picks however suits them.
          Scores grade themselves, the leaderboard moves, and Monday morning has something in it.
        </p>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
          {[
            ["No money changes hands", "Not a pool, not a bet. The company runs it as a perk."],
            ["Players never pay", "You cover it once. Nobody is ever asked for a buy-in."],
            ["Nothing to install", "A link, a text message, or a sheet of paper."],
          ].map(([h, b]) => (
            <div key={h} className="dk-card">
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{h}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Four ways",
    body: (
      <div>
        <div className="dk-eye">The part that matters</div>
        <h2 className="dk-h2" style={{ margin: "14px 0 16px", maxWidth: "24ch" }}>Four ways to play — so everybody does.</h2>
        <p className="dk-lede" style={{ marginBottom: 24 }}>
          This is the whole difference. Every other pool asks people to come to it. We go to them, in whatever way
          they already communicate.
        </p>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))" }}>
          {MODALITIES.map((m) => (
            <div key={m.n} className="dk-card">
              <div className="dk-num">{m.n}</div>
              <div style={{ fontFamily: "var(--font-grotesk),sans-serif", fontWeight: 700, fontSize: 19, margin: "8px 0 6px" }}>{m.name}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{m.who}</div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 20 }}>
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
          <h2 className="dk-h2" style={{ margin: "12px 0 8px" }}>{m.name}</h2>
          <p style={{ margin: "0 0 6px", fontSize: 17, color: "var(--text)", fontWeight: 600, maxWidth: "50ch", lineHeight: 1.4 }}>{m.line}</p>
          <p className="muted" style={{ fontSize: 13.5, margin: "0 0 22px" }}>Built for: {m.who}</p>
          <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", alignItems: "start" }}>
            <div className="dk-grid">
              {m.detail.map((d) => (
                <div key={d} className="dk-li"><i />{d}</div>
              ))}
            </div>
            <div className="dk-card" style={{ borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),.07)" }}>
              <div className="dk-eye" style={{ fontSize: 11, marginBottom: 7 }}>Why it wins</div>
              <div style={{ fontSize: 15, lineHeight: 1.55 }}>{m.proof}</div>
            </div>
          </div>
        </div>
      ),
    });
  });

  slides.push({
    id: "Walkthrough",
    body: (
      <div>
        <div className="dk-eye">See it work</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 20px", maxWidth: "24ch" }}>Forty seconds, start to finish.</h2>
        {mode === "send" ? (
          <Video src="/walkthrough.mp4" poster="/walkthrough-poster.jpg" caption="The product tour — picks, standings, insights, and the commissioner console." />
        ) : (
          <Cue
            title="the real product"
            say="Let me just show you the actual thing — this is your league, already set up."
            show={[
              "Picks page: the nine-game slate, three calls per game, one Power Pick.",
              "Hit autofill to show how someone who barely follows football still plays in ten seconds.",
              "Standings: the live leaderboard. Say the words \"this is the water cooler.\"",
              "Commissioner console: their name, their colors, their prize board.",
            ]}
          />
        )}
      </div>
    ),
  });

  slides.push({
    id: "Text demo",
    body: (
      <div>
        <div className="dk-eye">The one they don&apos;t expect</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 20px", maxWidth: "26ch" }}>Playing by text, in plain words.</h2>
        {mode === "send" ? (
          <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", alignItems: "start" }}>
            <div className="dk-card" style={{ fontSize: 15, lineHeight: 1.7 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>A real exchange</div>
              <div><b>You:</b> PLAY</div>
              <div className="muted">Game 3 of 9 — Pittsburgh at Cleveland, PIT −3.5, total 44.5. Who you got?</div>
              <div style={{ marginTop: 8 }}><b>You:</b> Steelers, take the over</div>
              <div className="muted">Got it — Steelers to win, Steelers cover, over 44.5. Next up…</div>
            </div>
            <div className="dk-card" style={{ borderColor: "var(--accent)", background: "rgba(var(--accent-rgb),.07)" }}>
              <div className="dk-eye" style={{ fontSize: 11, marginBottom: 7 }}>Why it matters</div>
              <div style={{ fontSize: 15, lineHeight: 1.55 }}>
                No app, no login, no training. If someone can text their kid, they can play. This is how you reach
                the half of your workforce that every other engagement tool misses.
              </div>
            </div>
          </div>
        ) : (
          <Cue
            title="text a pick from your own phone"
            say="Watch this — I'm going to play from my phone right now, same as your crew would."
            show={[
              "Text PLAY to the league number, on speaker if you can.",
              "Answer one game out loud in plain words: \"Steelers, take the over.\"",
              "Show the echo coming back, then say: \"no app, no login, nothing to install.\"",
              "Hold up a paper sheet next — \"and for the folks who won't text, this.\"",
            ]}
          />
        )}
      </div>
    ),
  });

  slides.push({
    id: "The week",
    body: (
      <div>
        <div className="dk-eye">What a week feels like</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 22px", maxWidth: "22ch" }}>It runs itself. You just watch it happen.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))" }}>
          {WEEK.map((w) => (
            <div key={w.d} className="dk-card">
              <div className="dk-num">{w.d}</div>
              <div style={{ fontWeight: 700, fontSize: 16, margin: "8px 0 6px" }}>{w.t}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{w.b}</div>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 20 }}>
          Your total time as commissioner: a few clicks a week, if you feel like it.
        </p>
      </div>
    ),
  });

  slides.push({
    id: "Included",
    body: (
      <div>
        <div className="dk-eye">Every league includes</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 22px" }}>No tiers on the features. Only on the size.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(255px,1fr))" }}>
          {INCLUDED.map(([h, b]) => (
            <div key={h} className="dk-card">
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{h}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Pricing",
    body: (
      <div>
        <div className="dk-eye">Founding Season 2026 · first 50 companies</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 10px" }}>One flat rate. Locked for three seasons.</h2>
        <p className="dk-lede" style={{ marginBottom: 20 }}>
          No per-head math, no metering, no penalty for people who don&apos;t play. Founding pricing is more than half
          off and holds through 2028.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead>
              <tr>
                <th className="dk-th">Tier</th>
                <th className="dk-th">Company size</th>
                <th className="dk-th" style={{ textAlign: "right" }}>Founding / season</th>
                <th className="dk-th" style={{ textAlign: "right" }}>Standard</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>Nonprofits &amp; schools: 30% off. Premium add-ons available on any tier.</p>
      </div>
    ),
  });

  slides.push({
    id: "Risk",
    body: (
      <div>
        <div className="dk-eye">Why this is an easy yes</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 22px", maxWidth: "22ch" }}>Start free today. Decide with evidence.</h2>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          {[
            ["Nothing due today", "We switch your league on now, free. No card, no deposit. Billing starts at kickoff."],
            ["Money back through Week 8", "If your team isn't more engaged halfway through the season, you get every dollar back."],
            ["Your rate is locked", "Founding price holds for three seasons — 2026, 2027, 2028."],
            ["We do the setup", "Send us the roster and your colors. Your league is live the same day."],
          ].map(([h, b]) => (
            <div key={h} className="dk-card">
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15.5 }}>{h}</div>
              <div className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    id: "Founding",
    body: (
      <div>
        <div className="dk-eye">Founding leagues only</div>
        <h2 className="dk-h2" style={{ margin: "12px 0 18px", maxWidth: "24ch" }}>What you get for going first.</h2>
        <p className="dk-lede" style={{ marginBottom: 22 }}>
          We&apos;re running a limited number of founding leagues this season, and they get things later customers
          won&apos;t.
        </p>
        <div className="dk-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))" }}>
          {[
            ["Concierge line, free", "The premium phone add-on, included for your first season."],
            ["Done-for-you setup", "We load the roster, brand the league, and print your first paper sheets."],
            ["A direct line to me", "You call me, not a support queue. What you ask for gets built."],
            ["Three seasons of price protection", "Your rate never moves through 2028."],
          ].map(([h, b]) => (
            <div key={h} className="dk-card">
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{h}</div>
              <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 14.5, marginTop: 22, color: "var(--text)" }}>
          The season starts <b>September 9</b>. A pick&apos;em league that launches in Week 3 doesn&apos;t work — so the
          real deadline is the calendar, not the offer.
        </p>
      </div>
    ),
  });

  slides.push({
    id: "Close",
    body: (
      <div>
        <div className="dk-eye">Next step</div>
        <h1 className="dk-h1" style={{ margin: "16px 0 18px", maxWidth: "20ch", fontSize: "clamp(30px,4.4vw,52px)" }}>
          Want me to switch your league on <em style={{ fontStyle: "normal", color: "var(--accent)" }}>this week?</em>
        </h1>
        <p className="dk-lede" style={{ marginBottom: 26 }}>
          Give me your league name and colors. Your team can be making picks by Friday — free, nothing owed
          until kickoff.
        </p>
        <div className="dk-card" style={{ display: "inline-block", padding: "18px 22px" }}>
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
