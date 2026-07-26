"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { fbTrack } from "@/lib/pixel";

type Week1 = { away: string; home: string; homeSpread: number; total: number };

export default function KitClient({
  company, teamCity, teamName, contact, kitSlug, week1,
}: {
  company: string; teamCity: string | null; teamName: string | null; contact: string | null;
  kitSlug: string; week1?: Week1 | null;
}) {
  const router = useRouter();
  const leagueDefault = /pick'?em/i.test(company) ? company : `${company} Pick'em`;
  const [leagueName, setLeagueName] = useState(leagueDefault);
  const [cName, setCName] = useState(contact ?? "");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function launch() {
    if (!cName.trim()) { setErr("Add your name."); return; }
    if (!/^\d{4}$/.test(pin)) { setErr("Set a 4-digit PIN."); return; }
    setBusy(true); setErr("");
    const res = await fetch("/api/league", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leagueName, commishName: cName, pin, kitSlug }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
    fbTrack("Lead");
    router.push(`/l/${data.slug}/picks`);
  }

  const teamLine = teamCity ? `${teamCity}${teamName ? ` ${teamName}` : ""} season — ` : "";

  return (
    <div className="wrap" style={{ maxWidth: 460 }}>
      <div style={{ textAlign: "center", margin: "26px 0 14px" }}>
        <div style={{ display: "inline-block" }}><Brand /></div>
      </div>

      <div className="hero">
        <span className="hero-line">{teamLine}<em>{company}&apos;s league is ready.</em></span>
      </div>

      <div className="card pad">
        <div className="b" style={{ fontSize: 18, marginBottom: 4 }}>
          You&apos;re the commissioner{contact ? `, ${contact}` : ""}.
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>
          We pre-built it. Set your name + a PIN and launch — your whole team can join by text in seconds. No money, no app.
        </p>
        <label>Your league</label>
        <input value={leagueName} onChange={(e) => setLeagueName(e.target.value)} />
        <label>Your name (commissioner)</label>
        <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Your name" />
        <label>Set a 4-digit PIN</label>
        <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" maxLength={4} placeholder="1234" />
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ width: "100%", marginTop: 14 }} disabled={busy} onClick={launch}>
          {busy ? "Launching…" : "Launch as commissioner →"}
        </button>
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
        <div className="row" style={{ gap: 10, marginBottom: 6 }}><span>💬</span> Play by text, web — or a paper sheet</div>
        <div className="row" style={{ gap: 10 }}><span>🚫</span> Players never pay — no app, no buy-in</div>
      </div>

      <p className="muted small center" style={{ marginTop: 12 }}>Founding Season: flat seasonal rate from $400 by company size, locked 3 seasons, full money-back guarantee — your rep sets it up with you.</p>
      <p className="muted small center">Floor to front office — everybody&apos;s in.</p>
    </div>
  );
}
