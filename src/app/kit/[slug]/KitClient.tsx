"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/Brand";
import { fbTrack } from "@/lib/pixel";

export default function KitClient({
  company, teamCity, teamName, contact, kitSlug,
}: {
  company: string; teamCity: string | null; teamName: string | null; contact: string | null; kitSlug: string;
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

      <div className="card pad">
        <div className="muted small b" style={{ marginBottom: 8, letterSpacing: 0.6 }}>WHAT YOUR TEAM GETS</div>
        <div className="row" style={{ gap: 10, marginBottom: 6 }}><span>⏱️</span> Pick in two minutes a week</div>
        <div className="row" style={{ gap: 10, marginBottom: 6 }}><span>💬</span> Play by text, web, or a phone call</div>
        <div className="row" style={{ gap: 10 }}><span>🚫</span> Players never pay — no app, no buy-in</div>
      </div>

      <p className="muted small center" style={{ marginTop: 12 }}>Founding Season: flat seasonal rate from $400 by company size, locked 3 seasons, full money-back guarantee — your rep sets it up with you.</p>
      <p className="muted small center">Floor to front office — everybody&apos;s in.</p>
    </div>
  );
}
