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

const AUTOFILL_OPTIONS = [
  { key: "favorites", name: "Favorites", desc: "Take the Vegas favorite on winner and spread; totals land on a coin flip." },
  { key: "random", name: "Random", desc: "Leave your open picks up to chance." },
  { key: "home", name: "Home Teams", desc: "Home field advantage becomes your own; totals on a coin flip." },
] as const;

export default function PicksClient(props: {
  slug: string; week: number; weeks: number[]; weekTabs: { week: number; dates: string }[]; format: string;
  anyOpen: boolean; submitted: boolean; playersN: number; submittedN: number; games: G[];
  accent?: string; prizeText?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [autofillOpen, setAutofillOpen] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
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
  const autofill = async () => {
    if (!strategy) return;
    await call("/api/picks/autofill", { week: props.week, strategy });
    setAutofillOpen(false);
    setStrategy(null);
  };
  const undo = () => call("/api/submit", { week: props.week, undo: true });

  // A game's inputs are editable only if it hasn't kicked off AND the player hasn't submitted their card.
  const editableGame = (g: G) => !g.lockedGame && !props.submitted;

  const cls = (g: G, field: "su" | "ats" | "ou", side: string) => {
    let c = (g as any)[field] === side ? "sel" : "";
    if (g.truth && (g as any)[field] === side) c += (g.truth as any)[field] === side ? " correct" : " wrong";
    return c;
  };

  const madeSlots = props.games.reduce((s, g) => s + (g.su ? 1 : 0) + (g.ats ? 1 : 0) + (g.ou ? 1 : 0), 0);
  const totalSlots = props.games.length * 3;
  // Show the lock GAME (matchup), not an inferred side — the star can be set before any pick.
  const lockLabel = (() => {
    const lg = props.games.find((g) => g.powerRank === 0);
    return lg ? `${lg.awayAbbr}@${lg.homeAbbr}` : null;
  })();

  return (
    <>
      <div className="hero">
        <div className="app-kicker">Week {props.week}</div>
        <span className="hero-line">Everybody&apos;s in — <em>night shift to nine-to-five.</em></span>
        {totalSlots > 0 && (
          <div style={{ marginTop: 12, maxWidth: 380 }}>
            <div className="spread small" style={{ marginBottom: 5 }}>
              <span className="muted">Your card</span>
              <span className="b" style={{ color: "var(--accent)" }}>{madeSlots}/{totalSlots} picks made</span>
            </div>
            <div className="progress" aria-hidden="true">
              <div className="fill" style={{ width: `${totalSlots ? Math.round((madeSlots / totalSlots) * 100) : 0}%` }} />
            </div>
          </div>
        )}
      </div>
      <details className="card pad" style={{ marginBottom: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>🆕 New here? How it works (30 sec)</summary>
        <div className="muted small" style={{ marginTop: 8, lineHeight: 1.55 }}>
          For each game you make up to three calls:
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li><b>Winner</b> — who wins the game. <b>1 pt</b></li>
            <li><b>Spread</b> — who beats the point spread (the number by each team: a favorite must win by more than it; an underdog can lose by less, or win). <b>2 pts</b></li>
            <li><b>Total (O/U)</b> — will both teams&apos; combined score land Over or Under the number. <b>2 pts</b></li>
            <li><b>Power Pick / LOCK</b> — tap the ☆ on the game you&apos;re surest about; your spread call there swings <b>±3</b> (your top one is your &ldquo;LOCK&rdquo;).</li>
          </ul>
          <div style={{ marginTop: 8 }}>Bonus: nail all three on one game = <b>+1</b>. Miss all three = <b>−2</b>. No ties — every line ends in a half-point.</div>
        </div>
      </details>
      {props.prizeText && (
        <div style={{ border: `1px solid ${props.accent || "#4f8cff"}`, background: "#0d1424", borderRadius: 12, padding: "8px 14px", margin: "0 0 12px" }}>
          <span style={{ color: props.accent || "#4f8cff", fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>🏆 PLAYING FOR </span>
          <span style={{ fontSize: 14 }}>{props.prizeText}</span>
        </div>
      )}

      <div className="spread" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Picks</h2>
        <span className={`chip ${allLocked ? "warn" : "live"}`}>
          {allLocked ? "🔒 all games locked" : `● ${props.submittedN}/${props.playersN} submitted`}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 8, WebkitOverflowScrolling: "touch" }}>
        {props.weekTabs.map((t) => {
          const active = t.week === props.week;
          return (
            <button key={t.week}
              onClick={() => router.push(`/l/${props.slug}/picks?week=${t.week}`)}
              aria-current={active ? "page" : undefined}
              style={{
                flex: "0 0 auto", padding: "8px 14px", borderRadius: 10, textAlign: "center", lineHeight: 1.25,
                border: `1px solid ${active ? "var(--accent)" : "var(--line, #2a3550)"}`,
                background: active ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
                color: "var(--text)", cursor: "pointer",
              }}>
              <div className="b" style={{ fontSize: 13 }}>Week {t.week}</div>
              <div className="muted" style={{ fontSize: 11 }}>{t.dates}</div>
            </button>
          );
        })}
      </div>
      {props.anyOpen && !props.submitted && madeSlots < totalSlots && (
        <button className="btn ghost" style={{ width: "100%", marginBottom: 14 }} onClick={() => setAutofillOpen(true)}>
          ⚡ Autofill my open picks
        </button>
      )}

      {autofillOpen && (
        <div role="dialog" aria-modal="true" aria-label="Autofill"
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setAutofillOpen(false)}>
          <div className="card pad" style={{ maxWidth: 440, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <div className="spread" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Autofill</h3>
              <button className="btn ghost" aria-label="Close" onClick={() => setAutofillOpen(false)}>✕</button>
            </div>
            <p className="muted small" style={{ marginTop: 0 }}>
              Fills only your <b>blank</b> Week {props.week} picks — anything you&apos;ve already chosen stays put.
            </p>
            {AUTOFILL_OPTIONS.map((o) => (
              <label key={o.key} style={{
                display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${strategy === o.key ? "var(--accent)" : "var(--line, #2a3550)"}`, marginBottom: 8,
              }}>
                <input type="radio" name="autofill" checked={strategy === o.key} onChange={() => setStrategy(o.key)} style={{ marginTop: 3 }} />
                <span><b>{o.name}</b><br /><span className="muted small">{o.desc}</span></span>
              </label>
            ))}
            <button className="btn" style={{ width: "100%" }} disabled={!strategy || busy} onClick={autofill}>
              ⚡ Fill my picks
            </button>
          </div>
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
        <div className="card pad muted">No games posted for this week yet — the lines go up midweek. Check back soon.</div>
      )}

      {props.anyOpen && (
        <div className="pickbar pad spread">
          {props.submitted ? (
            <>
              <div>
                <div className="b" style={{ color: "var(--accent)" }}>✅ Card sent — {madeSlots}/{totalSlots} picks in. Go talk your trash.</div>
                <div className="muted small" style={{ marginTop: 4 }}>🔒 Locked early by you — Undo reopens it any time before kickoff.</div>
              </div>
              <button className="btn ghost" disabled={busy} onClick={undo} aria-label="Undo submission and edit my picks">↩ Undo — fix my picks</button>
            </>
          ) : (
            <>
              <div>
                <div className="b small">💾 {madeSlots}/{totalSlots} picked{lockLabel ? <> · 🔒 Lock: <b style={{ color: "var(--gold)" }}>{lockLabel}</b></> : null} — saved as you tap.</div>
                <div className="muted small" style={{ marginTop: 3 }}>Every pick stays changeable until its game kicks off. Sending locks your card early.</div>
              </div>
              <button className="btn" disabled={busy} onClick={submit} aria-label="Lock in my picks for this week">🚀 Send my picks</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
