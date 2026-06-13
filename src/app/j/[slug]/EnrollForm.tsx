"use client";
import { useState } from "react";
import { leagueLabel } from "@/lib/brand";

export default function EnrollForm({
  slug, leagueName, accent = "#21e08a", ink = "#05210f", logoUrl = null, prizeText = null, welcomeMessage = null,
}: {
  slug: string; leagueName: string; accent?: string; ink?: string;
  logoUrl?: string | null; prizeText?: string | null; welcomeMessage?: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const res = await fetch("/api/sms-enroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, phone, consent }),
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else setErr((await res.json().catch(() => ({})))?.error || "Something went wrong.");
  }

  const wrap: React.CSSProperties = { minHeight: "100vh", background: "#0a0e18", color: "#eef3fa", fontFamily: "system-ui", display: "flex", justifyContent: "center", padding: 24 };
  const card: React.CSSProperties = { width: 380, maxWidth: "100%", background: "#141c2e", border: "1px solid #2a3550", borderRadius: 16, padding: 24 };
  const input: React.CSSProperties = { width: "100%", padding: 12, margin: "6px 0 14px", borderRadius: 10, border: "1px solid #2a3550", background: "#0a0e18", color: "#eef3fa", fontSize: 16 };
  const btn: React.CSSProperties = { width: "100%", padding: 14, borderRadius: 10, border: 0, background: accent, color: ink, fontWeight: 700, fontSize: 16, cursor: "pointer" };

  const Brandmark = () =>
    logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={leagueName} style={{ maxHeight: 44, maxWidth: "70%", objectFit: "contain", marginBottom: 10 }} />
    ) : (
      <div style={{ color: accent, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{leagueName.toUpperCase()}</div>
    );

  if (done) return (
    <div style={wrap}><div style={card}>
      <Brandmark />
      <h2 style={{ marginTop: 6 }}>You’re in! 🏈</h2>
      <p style={{ color: "#93a1bc" }}>Check your phone — we just texted you. Reply <b>LINES</b> to see this week’s games, then text your picks. No app needed.</p>
    </div></div>
  );

  return (
    <div style={wrap}><div style={card}>
      <Brandmark />
      <h2 style={{ margin: "6px 0 2px" }}>Play by text</h2>
      <p style={{ color: "#93a1bc", marginTop: 4 }}>No app. Pick winners, spreads &amp; over/unders right from your phone.</p>
      {prizeText && (
        <div style={{ border: `1px solid ${accent}`, borderRadius: 10, padding: "8px 12px", margin: "10px 0 4px", background: "#0d1424" }}>
          <span style={{ color: accent, fontWeight: 700, fontSize: 12 }}>🏆 PLAYING FOR </span>
          <span style={{ fontSize: 13.5 }}>{prizeText}</span>
        </div>
      )}
      {welcomeMessage && <p style={{ color: "#cfe0ff", fontSize: 13.5, marginTop: 8 }}>{welcomeMessage}</p>}
      <form onSubmit={submit}>
        <label>Your name</label>
        <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mike R" required />
        <label>Mobile number</label>
        <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(412) 555-0123" inputMode="tel" required />
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "#93a1bc", margin: "4px 0 14px" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3 }} />
          <span>I agree to receive recurring automated text messages (game reminders &amp; results) from {leagueLabel(leagueName)} at this number. Consent is not a condition of anything. Msg &amp; data rates may apply. Reply STOP to opt out, HELP for help.</span>
        </label>
        {err && <div style={{ color: "#ff7a7a", marginBottom: 10, fontSize: 13 }}>{err}</div>}
        <button style={btn} disabled={busy}>{busy ? "Setting you up…" : "Text me my games"}</button>
      </form>
    </div></div>
  );
}
