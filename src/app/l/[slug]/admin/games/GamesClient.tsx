"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type GameRow = {
  id: string; away: string; home: string; homeSpread: number; total: number;
  awayScore: number | null; homeScore: number | null; final: boolean;
  locked: boolean; hasPicks: boolean; kickoff: string;
};

const box: React.CSSProperties = { background: "#141c2e", border: "1px solid #2a3550", borderRadius: 12, padding: 14, margin: "10px 0" };
const input: React.CSSProperties = { background: "#0d1424", border: "1px solid #2a3550", color: "#eef", borderRadius: 8, padding: "6px 8px", fontSize: 14, width: 64 };
const btn: React.CSSProperties = { background: "#1c2740", border: "1px solid #36507e", color: "#cfe0ff", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer" };
const go: React.CSSProperties = { ...btn, background: "#10331f", border: "1px solid #1c6b48", color: "#21e08a" };
const mut: React.CSSProperties = { color: "#93a1bc", fontSize: 12 };

export default function GamesClient({ slug, week, weeks, rows }: { slug: string; week: number; weeks: number[]; rows: GameRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; s: string } | null>(null);
  const [edit, setEdit] = useState<Record<string, { a: string; h: string }>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, { a: r.awayScore?.toString() ?? "", h: r.homeScore?.toString() ?? "" }]))
  );
  const [line, setLine] = useState<Record<string, { s: string; t: string }>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, { s: r.homeSpread.toString(), t: r.total.toString() }]))
  );

  async function call(payload: Record<string, unknown>, key: string) {
    setBusy(key); setMsg(null);
    try {
      const r = await fetch("/api/admin/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: "err", s: j.error || "Something went wrong." }); return null; }
      return j;
    } catch { setMsg({ t: "err", s: "Network error." }); return null; }
    finally { setBusy(null); }
  }

  async function saveScore(r: GameRow) {
    const e = edit[r.id];
    const j = await call({ action: "setScore", id: r.id, awayScore: e.a, homeScore: e.h }, "score" + r.id);
    if (j?.ok) { setMsg({ t: "ok", s: `Saved ${r.away} ${e.a} – ${e.h} ${r.home}.` }); router.refresh(); }
  }
  async function unfinal(r: GameRow) {
    const j = await call({ action: "setFinal", id: r.id, value: false }, "unf" + r.id);
    if (j?.ok) { setMsg({ t: "ok", s: "Marked not final — regrade to re-pull." }); router.refresh(); }
  }
  async function regrade() {
    const j = await call({ action: "regrade", week }, "regrade");
    if (j?.ok) { setMsg({ t: "ok", s: `Regraded week ${week}: ${j.graded} updated${j.unmatched?.length ? `, ${j.unmatched.length} ESPN finals matched no game (name mismatch)` : ""}.` }); router.refresh(); }
  }
  async function saveLine(r: GameRow) {
    const l = line[r.id];
    const j = await call({ action: "setLine", id: r.id, homeSpread: l.s, total: l.t }, "line" + r.id);
    if (j?.ok) { setMsg({ t: "ok", s: "Line saved." }); router.refresh(); }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", margin: "8px 0" }}>
        <span style={mut}>Week:</span>
        {weeks.map((w) => (
          <a key={w} href={`/l/${slug}/admin/games?week=${w}`}
             style={{ ...btn, ...(w === week ? { background: "#26365a", color: "#fff" } : {}), textDecoration: "none" }}>{w}</a>
        ))}
        <button style={{ ...go, marginLeft: "auto" }} disabled={busy === "regrade"} onClick={regrade}>{busy === "regrade" ? "Regrading…" : `Regrade week ${week}`}</button>
      </div>

      {msg && <div style={{ ...box, borderColor: msg.t === "ok" ? "#1c6b48" : "#6b1c1c", color: msg.t === "ok" ? "#21e08a" : "#ff9a9a" }}>{msg.s}</div>}
      {rows.length === 0 && <div style={box}>No games loaded for week {week}.</div>}

      {rows.map((r) => (
        <div key={r.id} style={box}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontWeight: 600 }}>{r.away} @ {r.home}
              <span style={{ ...mut, marginLeft: 8 }}>{r.home} {r.homeSpread > 0 ? "+" : ""}{r.homeSpread}, O/U {r.total}</span>
            </div>
            <span style={mut}>{r.final ? "FINAL" : r.locked ? "in progress / locked" : new Date(r.kickoff).toLocaleString()}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <span style={mut}>{r.away}</span>
            <input style={input} inputMode="numeric" value={edit[r.id].a} onChange={(e) => setEdit({ ...edit, [r.id]: { ...edit[r.id], a: e.target.value } })} />
            <span style={mut}>{r.home}</span>
            <input style={input} inputMode="numeric" value={edit[r.id].h} onChange={(e) => setEdit({ ...edit, [r.id]: { ...edit[r.id], h: e.target.value } })} />
            <button style={go} disabled={busy === "score" + r.id} onClick={() => saveScore(r)}>{r.final ? "Update final" : "Set final"}</button>
            {r.final && <button style={btn} disabled={busy === "unf" + r.id} onClick={() => unfinal(r)}>Un-final</button>}
          </div>

          {!r.locked && !r.hasPicks && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <span style={mut}>Fix line — spread (home)</span>
              <input style={input} value={line[r.id].s} onChange={(e) => setLine({ ...line, [r.id]: { ...line[r.id], s: e.target.value } })} />
              <span style={mut}>total</span>
              <input style={input} value={line[r.id].t} onChange={(e) => setLine({ ...line, [r.id]: { ...line[r.id], t: e.target.value } })} />
              <button style={btn} disabled={busy === "line" + r.id} onClick={() => saveLine(r)}>Save line</button>
            </div>
          )}
          {r.hasPicks && !r.locked && <div style={{ ...mut, marginTop: 6 }}>Line frozen — players have already picked this game.</div>}
        </div>
      ))}
    </>
  );
}
