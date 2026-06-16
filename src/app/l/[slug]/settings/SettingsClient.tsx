"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface League {
  format: string;
  playoffOn: boolean;
  playoffStart: number;
  playoffTeams: number;
  seedStep: number;
  seasonStart: number;
  seasonEnd: number;
}
interface Game {
  id: string;
  week: number;
  away: string;
  home: string;
  homeSpread: number;
  total: number;
  awayScore: number | null;
  homeScore: number | null;
}

export default function SettingsClient({ slug, league, games }: { slug: string; league: League; games: Game[] }) {
  const router = useRouter();
  const [l, setL] = useState(league);
  const weeks = [...new Set(games.map((g) => g.week))].sort((a, b) => a - b);
  const [week, setWeek] = useState(weeks[0] ?? 1);

  async function save(patch: Partial<League>) {
    const next = { ...l, ...patch };
    setL(next);
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    router.refresh();
  }
  async function setScore(gameId: string, awayScore: string, homeScore: string) {
    if (awayScore === "" || homeScore === "") return;
    await fetch("/api/results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, awayScore, homeScore }) });
    router.refresh();
  }

  const weekGames = games.filter((g) => g.week === week);

  return (
    <>
      <h2>Settings</h2>
      <p className="muted small">Commissioner only. Set these before the season — they stay constant all year.</p>

      <div className="card pad">
        <div className="b" style={{ marginBottom: 8 }}>⚙️ League rules</div>

        <label>Game format (Power Picks per week)</label>
        <select value={l.format} onChange={(e) => save({ format: e.target.value })}>
          <option value="simple">Simple — 1 Lock (±3)</option>
          <option value="ranked">Ranked — 3 Power Picks (±3 / ±2 / ±1)</option>
        </select>

        <label style={{ marginTop: 14 }}>Champion format</label>
        <select value={l.playoffOn ? "on" : "off"} onChange={(e) => save({ playoffOn: e.target.value === "on" })}>
          <option value="off">Season-long (no bracket)</option>
          <option value="on">Hybrid playoffs</option>
        </select>

        {l.playoffOn && (
          <div className="row" style={{ marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <label>Playoffs start week</label>
              <select value={l.playoffStart} onChange={(e) => save({ playoffStart: Number(e.target.value) })}>
                {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label># teams</label>
              <select value={l.playoffTeams} onChange={(e) => save({ playoffTeams: Number(e.target.value) })}>
                {[2, 4, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Seed bonus step</label>
              <select value={l.seedStep} onChange={(e) => save({ seedStep: Number(e.target.value) })}>
                {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Season start week</label>
            <select value={l.seasonStart} onChange={(e) => save({ seasonStart: Number(e.target.value) })}>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Season end week</label>
            <select value={l.seasonEnd} onChange={(e) => save({ seasonEnd: Number(e.target.value) })}>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="pad spread" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="b">Enter / override finals</div>
          <select value={week} onChange={(e) => setWeek(Number(e.target.value))} style={{ width: "auto" }}>
            {weeks.map((w) => <option key={w} value={w}>Week {w}</option>)}
          </select>
        </div>
        <p className="muted small pad" style={{ paddingBottom: 0 }}>
          These auto-fill from the ESPN scores feed via the grading cron. Use this only to fix or pre-fill a game.
        </p>
        {weekGames.map((g) => (
          <div className="pad spread" key={g.id} style={{ borderBottom: "1px solid var(--line)" }}>
            <div className="b">{g.away} @ {g.home} <span className="muted small">· O/U {g.total}</span></div>
            <ScoreRow g={g} onSave={setScore} />
          </div>
        ))}
        {weekGames.length === 0 && <div className="pad muted small">No games loaded for this week yet.</div>}
      </div>
    </>
  );
}

function ScoreRow({ g, onSave }: { g: Game; onSave: (id: string, a: string, h: string) => void }) {
  const [a, setA] = useState(g.awayScore?.toString() ?? "");
  const [h, setH] = useState(g.homeScore?.toString() ?? "");
  return (
    <div className="row">
      <span className="muted small">{g.away}</span>
      <input style={{ width: 56, textAlign: "center" }} value={a} onChange={(e) => setA(e.target.value)} onBlur={() => onSave(g.id, a, h)} inputMode="numeric" />
      <span className="muted small">{g.home}</span>
      <input style={{ width: 56, textAlign: "center" }} value={h} onChange={(e) => setH(e.target.value)} onBlur={() => onSave(g.id, a, h)} inputMode="numeric" />
    </div>
  );
}
