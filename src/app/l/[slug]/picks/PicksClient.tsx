"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Brand";

interface Dist { suHome: number; suN: number; atsHome: number; atsN: number; ouOver: number; ouN: number; }
interface G {
  id: string; away: string; home: string;
  awayAbbr: string; homeAbbr: string; awayColor: string; homeColor: string;
  homeSpread: number; awaySpread: number; total: number;
  final: boolean; awayScore: number | null; homeScore: number | null;
  su: string | null; ats: string | null; ou: string | null;
  powerRank: number | null; net: number | null;
  truth: { su: string; ats: string; ou: string } | null;
  lockedGame: boolean; dist: Dist | null;
}

const fmt = (n: number) => (n > 0 ? "+" : "") + n;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export default function PicksClient(props: {
  slug: string; week: number; weeks: number[]; format: string;
  anyOpen: boolean; submitted: boolean; playersN: number; submittedN: number; games: G[];
  accent?: string; prizeText?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const allLocked = !props.anyOpen;

  async function call(url: string, body: any) {
    setBusy(true);
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }
  const setPick = (gameId: string, field: "su" | "ats" | "ou", value: string) => call("/api/picks", { gameId, [field]: value });
  const togglePower = (gameId: string) => call("/api/power", { gameId });
  const submit = () => call("/api/submit", { week: props.week });
  const undo = () => call("/api/submit", { week: props.week, undo: true });

  // A game's inputs are editable only if it hasn't kicked off AND the player hasn't submitted their card.
  const editableGame = (g: G) => !g.lockedGame && !props.submitted;

  const cls = (g: G, field: "su" | "ats" | "ou", side: string) => {
    let c = (g as any)[field] === side ? "sel" : "";
    if (g.truth && (g as any)[field] === side) c += (g.truth as any)[field] === side ? " correct" : " wrong";
    return c;
  };

  return (
    <>
      <div className="hero">
        <span className="hero-line">Floor to front office — <em>everybody&apos;s in.</em></span>
      </div>
      {props.prizeText && (
        <div style={{ border: `1px solid ${props.accent || "#4f8cff"}`, background: "#0d1424", borderRadius: 12, padding: "8px 14px", margin: "0 0 12px" }}>
          <span style={{ color: props.accent || "#4f8cff", fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>🏆 PLAYING FOR </span>
          <span style={{ fontSize: 14 }}>{props.prizeText}</span>
        </div>
      )}

      <div className="spread" style={{ marginBottom: 14 }}>
        <div className="row">
          <h2 style={{ margin: 0 }}>Picks</h2>
          <select value={props.week} onChange={(e) => router.push(`/l/${props.slug}/picks?week=${e.target.value}`)} style={{ width: "auto" }}>
            {props.weeks.map((w) => (<option key={w} value={w}>Week {w}</option>))}
          </select>
        </div>
        <span className={`chip ${allLocked ? "warn" : "live"}`}>
          {allLocked ? "🔒 all games locked" : `● ${props.submittedN}/${props.playersN} submitted`}
        </span>
      </div>

      {props.anyOpen && (
        <div className="card pad spread">
          {props.submitted ? (
            <>
              <div className="b" style={{ color: "var(--accent)" }}>✅ Picks are in. Now go talk your trash.</div>
              <button className="btn ghost" disabled={busy} onClick={undo}>↩ Wait, let me fix that</button>
            </>
          ) : (
            <>
              <div className="muted small b">⏱ Each game locks at its own kickoff</div>
              <button className="btn" disabled={busy} onClick={submit}>🚀 Send it</button>
            </>
          )}
        </div>
      )}

      {props.games.map((g, i) => {
        const ed = editableGame(g);
        return (
        <div className="card" key={g.id}>
          <div className="gc-top">
            <div>
              <div className="gc-teams">
                <Logo name={g.away} abbr={g.awayAbbr} color={g.awayColor} /> {g.away}
                <span className="muted">@</span>
                <Logo name={g.home} abbr={g.homeAbbr} color={g.homeColor} /> {g.home}
              </div>
              <div className="gc-meta">
                {g.homeSpread < 0 ? g.home : g.away} -{Math.abs(g.homeSpread)} · O/U {g.total} · Game #{i + 1}
                {!g.final && g.lockedGame && <> · <b style={{ color: "var(--warn, #f7cf57)" }}>🔒 kicked off</b></>}
                {g.final && (<> · <b style={{ color: "var(--text)" }}>Final {g.away} {g.awayScore}–{g.homeScore} {g.home}</b></>)}
              </div>
            </div>
            {g.final ? (
              <span className={`ptsbadge ${(g.net ?? 0) < 0 ? "neg" : ""}`}>{(g.net ?? 0) >= 0 ? "+" : ""}{g.net}</span>
            ) : (
              <span className={`powerstar ${g.powerRank != null ? "on" : ""}`}
                onClick={() => ed && togglePower(g.id)}
                style={{ opacity: ed ? 1 : 0.5, cursor: ed ? "pointer" : "default" }}>
                {g.powerRank != null ? (g.powerRank === 0 ? "🔒 LOCK" : `⭐ #${g.powerRank + 1}`) : "☆ Power Pick"}
              </span>
            )}
          </div>
          <div className="pickgrid">
            <div className="pcell win">
              <div className="lbl">Winner · 1pt</div>
              <div className="opt">
                <button className={cls(g, "su", "away")} disabled={!ed} onClick={() => setPick(g.id, "su", "away")}>{g.away}</button>
                <button className={cls(g, "su", "home")} disabled={!ed} onClick={() => setPick(g.id, "su", "home")}>{g.home}</button>
              </div>
            </div>
            <div className="pcell spr">
              <div className="lbl">Spread · 2pts</div>
              <div className="opt">
                <button className={cls(g, "ats", "away")} disabled={!ed} onClick={() => setPick(g.id, "ats", "away")}>{g.away}<span className="ln">{fmt(g.awaySpread)}</span></button>
                <button className={cls(g, "ats", "home")} disabled={!ed} onClick={() => setPick(g.id, "ats", "home")}>{g.home}<span className="ln">{fmt(g.homeSpread)}</span></button>
              </div>
            </div>
            <div className="pcell tot">
              <div className="lbl">Total · 2pts</div>
              <div className="opt">
                <button className={cls(g, "ou", "over")} disabled={!ed} onClick={() => setPick(g.id, "ou", "over")}>Over<span className="ln">{g.total}</span></button>
                <button className={cls(g, "ou", "under")} disabled={!ed} onClick={() => setPick(g.id, "ou", "under")}>Under<span className="ln">{g.total}</span></button>
              </div>
            </div>
          </div>

          {g.lockedGame && g.dist && (g.dist.suN + g.dist.atsN + g.dist.ouN) > 0 && (
            <div className="muted small" style={{ padding: "8px 12px", borderTop: "1px solid var(--line, #2a3550)" }}>
              League picked — Winner: <b>{pct(g.dist.suHome, g.dist.suN)}% {g.home}</b> ·
              {" "}Spread: <b>{pct(g.dist.atsHome, g.dist.atsN)}% {g.home}</b> ·
              {" "}O/U: <b>{pct(g.dist.ouOver, g.dist.ouN)}% Over</b>
              {" "}<span style={{ opacity: 0.7 }}>(n={Math.max(g.dist.suN, g.dist.atsN, g.dist.ouN)})</span>
            </div>
          )}
        </div>
      );})}

      {props.games.length === 0 && (
        <div className="card pad muted">No lines posted for this week yet. The Wednesday pull will fill them in.</div>
      )}
    </>
  );
}
