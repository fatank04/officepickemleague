"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { fbTrack } from "@/lib/pixel";

/**
 * The page a kit's QR opens — and the buyer's whole decision path, in descending commitment:
 *
 *   1. Start the league  — one form: founding order (no card; billed at kickoff) + launch.
 *   2. 20-minute walkthrough — self-serve booking, or text/call directly.
 *   3. Questions — the six real buyer objections answered inline, the deck, and the live
 *      concierge line they can call this second.
 *
 * Nobody should hit a dead end: every door ends in either a launched league, a booked call,
 * or a way to reach Ankur in one tap.
 */

type Week1 = { away: string; home: string; homeSpread: number; total: number };

const OWNER_TEL = "7179035334";
const CONCIERGE_TEL = "4127999395"; // the league line — its voice side is the concierge

// Cal.com event links. Leave empty until the account + event types exist; the UI
// falls back to text/call automatically so the page never shows a broken button.
const CAL = { demo: "", onboarding: "" };

const TIERS = [
  { id: "starter", label: "Up to 50 people", price: "$400", std: "$750" },
  { id: "team", label: "Up to 150 people", price: "$900", std: "$1,800" },
  { id: "company", label: "Up to 400 people", price: "$1,900", std: "$3,900" },
  { id: "large", label: "Up to 1,000 people", price: "$3,750", std: "$7,500" },
];

const FAQ: [string, string][] = [
  ["Is this gambling? Will HR object?",
    "No money anywhere in the game — no buy-ins, no pots, no payouts. It's a free, skill-based prediction game the company runs as a perk. It exists to replace the grey-area cash pool, not to be one."],
  ["What does IT have to install or review?",
    "Nothing. No app, no SSO, no directory access — and we never touch work email. Employees join with a first name on a web link, a text, or a paper sheet."],
  ["Will it eat work time?",
    "It can't — it's time-boxed by design. Nine games, about two minutes, and there's nothing else in it: no feed, no chat, nothing to scroll. Picks lock at kickoff, then it's quiet until next week. One reminder text a week, no streaks or badges engineered for daily opens. The league page even shows the median picking time so you can prove it."],
  ["What does it cost?",
    "One flat rate for the season by company size — $400 to $3,750 at founding pricing, which is about half off and locked through 2028. Players never pay a cent."],
  ["When am I charged?",
    "Not today. Sign up now, your league goes live immediately, and nothing is billed until kickoff on Sept 9 — by card link or an invoice to your AP, whichever you prefer. If your team isn't more engaged by Week 8, every dollar back."],
  ["How much work is it for me?",
    "We set it up — your name, colors, roster, and first paper sheets. After that it runs itself: reminders go out, games lock, scores grade, standings update. A few clicks a week if you feel like it."],
  ["Will my whole crew actually use it?",
    "That's the design. Four ways to hand in picks — web, text message, paper sheet, or a phone call — so nobody is left out by their age, their phone, or where they work."],
];

export default function KitClient({
  company, teamCity, teamName, contact, kitSlug, week1,
}: {
  company: string; teamCity: string | null; teamName: string | null; contact: string | null;
  kitSlug: string; week1?: Week1 | null;
}) {
  const router = useRouter();
  const leagueDefault = /pick'?em/i.test(company) ? company : `${company} Pick'em`;

  // door 1 — order + launch in one pass
  const [cName, setCName] = useState(contact ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState("");
  const [terms, setTerms] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const smsHref = (body: string) => `sms:+1${OWNER_TEL}?&body=${encodeURIComponent(body)}`;

  async function startLeague() {
    setErr("");
    if (!cName.trim()) { setErr("Add your name."); return; }
    if (!email.trim() && !phone.trim()) { setErr("Add an email or phone so we can confirm your setup."); return; }
    if (!tier) { setErr("Pick your company size."); return; }
    if (!terms) { setErr("Check the founding-terms box."); return; }
    if (!/^\d{4}$/.test(pin)) { setErr("Set a 4-digit PIN for your commissioner login."); return; }
    setBusy(true);

    // Record the founding order first — it also texts Ankur — then launch the league.
    const orderRes = await fetch("/api/kit-signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: kitSlug, company, name: cName, email, phone, tier, terms }),
    });
    if (!orderRes.ok) {
      setBusy(false);
      const d = await orderRes.json().catch(() => ({}));
      setErr(d.error || "Something went wrong."); return;
    }
    const res = await fetch("/api/league", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueName: leagueDefault, commishName: cName, pin, kitSlug }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
    fbTrack("Lead");
    router.push(`/l/${data.slug}/picks`);
  }

  const teamLine = teamCity ? `${teamCity}${teamName ? ` ${teamName}` : ""} season — ` : "";

  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
        <div style={{ display: "inline-block" }}><Brand /></div>
      </div>

      <div className="hero">
        <span className="hero-line">{teamLine}<em>{company}&apos;s league is ready.</em></span>
      </div>
      <p className="muted small center" style={{ margin: "10px 0 18px" }}>
        {contact ? `${contact} — three` : "Three"} ways forward. Pick whichever fits.
      </p>

      {/* ── Door 1: start now ─────────────────────────────────── */}
      <div className="card pad" style={{ borderColor: "var(--accent)" }}>
        <div className="b" style={{ fontSize: 18, marginBottom: 4 }}>1 · Start your league</div>
        <p className="muted small" style={{ marginTop: 0 }}>
          Two minutes, no card. Your league goes live today and <b style={{ color: "var(--text)" }}>nothing is
          billed until kickoff, Sept&nbsp;9</b> — card link or AP invoice, your choice, confirmed at onboarding.
        </p>

        <label>Your name</label>
        <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Your name" />
        <label>Work email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="you@company.com" />
        <label>Cell (optional — for setup texts)</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(555) 555-5555" />

        <label>Company size</label>
        <div style={{ display: "grid", gap: 7 }}>
          {TIERS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTier(t.id)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: "9px 12px", borderRadius: 9, cursor: "pointer", font: "inherit",
              border: tier === t.id ? "1.5px solid var(--accent)" : "1px solid var(--line)",
              background: tier === t.id ? "rgba(79,140,255,.10)" : "var(--panel2)", color: "var(--text)",
            }}>
              <span style={{ fontSize: 13.5 }}>{t.label}</span>
              <span style={{ fontSize: 13 }}>
                <b>{t.price}</b>/season <s className="muted" style={{ fontSize: 11.5 }}>{t.std}</s>
              </span>
            </button>
          ))}
        </div>

        <label>Set a 4-digit PIN (your commissioner login)</label>
        <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="1234" />

        <label style={{ display: "flex", gap: 9, alignItems: "flex-start", margin: "12px 0 0", fontSize: 12.5, textTransform: "none", letterSpacing: 0, color: "var(--muted)", fontWeight: 500, lineHeight: 1.45 }}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ width: 15, height: 15, marginTop: 2, flex: "none" }} />
          <span>I&apos;m starting a Founding Season league at the rate above — billed at kickoff (Sept 9), rate
          locked for three seasons, full money-back guarantee through Week 8.</span>
        </label>

        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={startLeague}>
          {busy ? "Launching…" : "Start my league — pay nothing today →"}
        </button>
        {CAL.onboarding && (
          <p className="muted small center" style={{ margin: "10px 0 0" }}>
            After launch: <a href={CAL.onboarding} target="_blank" rel="noreferrer">book your 30-min onboarding</a>
          </p>
        )}
        <p className="muted small center" style={{ margin: "10px 0 0" }}>
          Want billing squared away today? <a href={`/start?kit=${kitSlug}&src=kit`}>Save a card or
          request the AP invoice →</a> Still $0 until Sept 9.
        </p>
      </div>

      {/* ── Door 2: walkthrough ───────────────────────────────── */}
      <div className="card pad">
        <div className="b" style={{ fontSize: 18, marginBottom: 4 }}>2 · See it first — 20 minutes</div>
        <p className="muted small" style={{ marginTop: 0 }}>
          A quick video call: live demo with your company&apos;s league, pricing, and any questions. No slides you
          could&apos;ve read yourself.
        </p>
        {CAL.demo ? (
          <a className="btn" style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 8 }} href={CAL.demo} target="_blank" rel="noreferrer">
            Pick a time that works →
          </a>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <a className="btn ghost" style={{ textAlign: "center", textDecoration: "none" }}
            href={smsHref(`Hi Ankur — it's ${contact || "the team"} at ${company}. Send me times for a quick walkthrough.`)}>
            Text me times
          </a>
          <a className="btn ghost" style={{ textAlign: "center", textDecoration: "none" }} href={`tel:+1${OWNER_TEL}`}>
            Call Ankur
          </a>
        </div>
        <p className="muted small center" style={{ margin: "9px 0 0" }}>717-903-5334 — I answer.</p>
      </div>

      {/* ── Door 3: questions ─────────────────────────────────── */}
      <div className="card pad">
        <div className="b" style={{ fontSize: 18, marginBottom: 8 }}>3 · Just have questions?</div>
        <div>
          {FAQ.map(([q, a], i) => (
            <div key={q} style={{ borderTop: i ? "1px solid var(--line)" : "none" }}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
                font: "inherit", color: "var(--text)", fontWeight: 700, fontSize: 13.5,
                padding: "10px 2px", display: "flex", justifyContent: "space-between", gap: 8,
              }}>
                <span>{q}</span><span className="muted">{openFaq === i ? "–" : "+"}</span>
              </button>
              {openFaq === i && (
                <p className="muted small" style={{ margin: "0 2px 10px", lineHeight: 1.5 }}>{a}</p>
              )}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 12 }}>
          <p className="muted small" style={{ margin: "0 0 8px" }}>
            <b style={{ color: "var(--text)" }}>Hear it for yourself:</b> call{" "}
            <a href={`tel:+1${CONCIERGE_TEL}`} style={{ fontWeight: 700 }}>(412) 799-9395</a> and our concierge
            line will walk you through this week&apos;s games like it would your team — it talks back.
          </p>
          <p className="muted small" style={{ margin: 0 }}>
            Or the full walkthrough: <a href="/deck" target="_blank">officepickemleague.com/deck</a> ·{" "}
            <a href={smsHref(`Hi Ankur — ${contact || "someone"} at ${company}. Quick question about the league:`)}>text a question</a>
          </p>
        </div>
      </div>

      {week1 && (
        <div className="card pad">
          <div className="muted small b" style={{ marginBottom: 9, letterSpacing: 0.6 }}>
            YOUR TEAM&apos;S FIRST PICK — WEEK 1
          </div>
          <div className="b" style={{ fontSize: 16.5, marginBottom: 3 }}>
            {week1.away} at {week1.home}
          </div>
          <div className="muted small" style={{ marginBottom: 11 }}>
            {week1.home.split(" ").slice(-1)[0]} {week1.homeSpread > 0 ? `+${week1.homeSpread}` : week1.homeSpread}
            {" · "}O/U {week1.total}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {["Winner", "Spread", "Over / under"].map((c) => (
              <div key={c} style={{
                border: "1px solid var(--line)", borderRadius: 9, padding: "9px 6px",
                textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "var(--muted)",
              }}>{c}</div>
            ))}
          </div>
          <p className="muted small" style={{ marginBottom: 0, marginTop: 10 }}>
            Three calls a game, nine games a week. That&apos;s the whole thing — about two minutes.
          </p>
        </div>
      )}

      <div className="card pad">
        <div className="muted small b" style={{ marginBottom: 8, letterSpacing: 0.6 }}>WHAT YOUR TEAM GETS</div>
        <div className="row" style={{ gap: 10, marginBottom: 6 }}><span>⏱️</span> Pick in two minutes a week</div>
        <div className="row" style={{ gap: 10, marginBottom: 6 }}><span>💬</span> Play by text, web, paper — or a phone call</div>
        <div className="row" style={{ gap: 10 }}><span>🚫</span> Players never pay — no app, no buy-in</div>
      </div>

      <p className="muted small center" style={{ marginTop: 12 }}>Floor to front office — everybody&apos;s in.</p>
    </div>
  );
}
