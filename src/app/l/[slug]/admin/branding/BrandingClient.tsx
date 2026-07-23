"use client";
import { onAccent } from "@/lib/brand";
import { TEAMS } from "@/lib/teams";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Brand = { name: string; accentColor: string; prizeText: string; welcomeMessage: string; logoUrl: string; homeTeam: string; fullSlate: boolean };

const box: React.CSSProperties = { background: "#141c2e", border: "1px solid #2a3550", borderRadius: 12, padding: 16, margin: "12px 0" };
const label: React.CSSProperties = { display: "block", fontWeight: 600, marginBottom: 6 };
const input: React.CSSProperties = { background: "#0d1424", border: "1px solid #2a3550", color: "#eef", borderRadius: 8, padding: "9px 11px", fontSize: 14, width: "100%", boxSizing: "border-box" };
const mut: React.CSSProperties = { color: "#93a1bc", fontSize: 12, marginTop: 4 };

export default function BrandingClient({ initial }: { initial: Brand }) {
  const router = useRouter();
  const [b, setB] = useState<Brand>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; s: string } | null>(null);
  const set = (k: keyof Brand) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setB({ ...b, [k]: e.target.value });
  const accent = /^#[0-9a-fA-F]{6}$/.test(b.accentColor) ? b.accentColor : "#4f8cff";

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/branding", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: b.name, accentColor: b.accentColor || null, prizeText: b.prizeText, welcomeMessage: b.welcomeMessage, logoUrl: b.logoUrl, homeTeam: b.homeTeam || null, fullSlate: b.fullSlate }) });
      const j = await r.json();
      if (!r.ok) setMsg({ t: "err", s: j.error || "Couldn't save." });
      else { setMsg({ t: "ok", s: "Saved." }); router.refresh(); }
    } catch { setMsg({ t: "err", s: "Network error." }); }
    finally { setBusy(false); }
  }

  return (
    <>
      {msg && <div style={{ ...box, borderColor: msg.t === "ok" ? "#1c6b48" : "#6b1c1c", color: msg.t === "ok" ? "#21e08a" : "#ff9a9a" }}>{msg.s}</div>}
      <div style={box}>
        <label style={label}>League name</label>
        <input style={input} value={b.name} onChange={set("name")} maxLength={40} />
      </div>
      <div style={box}>
        <label style={label}>Accent color</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input style={{ ...input, maxWidth: 160 }} value={b.accentColor} onChange={set("accentColor")} placeholder="#4f8cff" />
          <span style={{ width: 28, height: 28, borderRadius: 6, background: accent, border: "1px solid #2a3550", display: "inline-block" }} />
          <span style={{ ...mut, marginTop: 0 }}>Hex like #4f8cff. Leave blank for the default.</span>
        </div>
      </div>
      <div style={box}>
        <label style={label}>Prize (what they&apos;re playing for)</label>
        <textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={b.prizeText} onChange={set("prizeText")} maxLength={280}
          placeholder="e.g. Winner gets a $100 gift card and the trophy on their desk till next season." />
        <div style={mut}>{b.prizeText.length}/280 — shown to players on the standings page.</div>
      </div>
      <div style={box}>
        <label style={label}>Welcome note (optional)</label>
        <textarea style={{ ...input, minHeight: 56, resize: "vertical" }} value={b.welcomeMessage} onChange={set("welcomeMessage")} maxLength={280}
          placeholder="A line shown on the join page / first text." />
      </div>
      <div style={box}>
        <label style={label}>Logo URL (optional)</label>
        <input style={input} value={b.logoUrl} onChange={set("logoUrl")} placeholder="https://…" />
        <div style={mut}>Must start with https://</div>
      </div>
      <div style={box}>
        <label style={label}>Weekly slate</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select style={{ ...input, maxWidth: 260 }} value={b.homeTeam} onChange={set("homeTeam")}>
            <option value="">Home team: none</option>
            {Object.keys(TEAMS).map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={b.fullSlate} onChange={(e) => setB({ ...b, fullSlate: e.target.checked })} />
            Full slate (all games every week)
          </label>
        </div>
        <div style={mut}>
          Default is the featured slate: ~9 games — the national TV games, your home team, and the tightest
          matchups. Your home team&apos;s game is always included. Check &quot;full slate&quot; for a die-hard office.
        </div>
      </div>
      <button style={{ background: accent, color: onAccent(accent), border: "none", borderRadius: 9, padding: "11px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
        disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
    </>
  );
}
