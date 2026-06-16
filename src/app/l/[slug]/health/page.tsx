import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { nflWeek } from "@/lib/odds";
import { isGameLocked } from "@/lib/lock";

export const dynamic = "force-dynamic";

const box: React.CSSProperties = { background: "#141c2e", border: "1px solid #2a3550", borderRadius: 12, padding: 16, margin: "10px 0" };
const num: React.CSSProperties = { fontSize: 30, fontWeight: 700, color: "#21e08a" };
const mut: React.CSSProperties = { color: "#93a1bc", fontSize: 13 };

export default async function HealthPage() {
  const ctx = await current();
  if (!ctx) return <main style={{ padding: 24, color: "#eef" }}>Sign in to view.</main>;
  if (!ctx.player.isCommish) return <main style={{ padding: 24, color: "#eef" }}>Commissioner only.</main>;

  const leagueId = ctx.league.id;
  const season = ctx.league.season;
  const now = new Date();
  const week = nflWeek(now);

  // --- retention metrics (from existing tables) ---
  const optIn = await prisma.$queryRaw<{ rate: number }[]>`
    SELECT COALESCE(COUNT(DISTINCT s."playerId")::float / NULLIF(COUNT(DISTINCT p.id),0), 0) AS rate
    FROM "Player" p LEFT JOIN "Submission" s ON s."playerId" = p.id
    WHERE p."leagueId" = ${leagueId}`;

  const weekly = await prisma.$queryRaw<{ week: number; active: number }[]>`
    SELECT week, COUNT(DISTINCT "playerId")::int AS active
    FROM "Submission" WHERE "leagueId" = ${leagueId} GROUP BY week ORDER BY week`;

  const pairs = await prisma.$queryRaw<{ playerId: string; week: number }[]>`
    SELECT DISTINCT "playerId", week FROM "Submission" WHERE "leagueId" = ${leagueId}`;
  const byWeek = new Map<number, Set<string>>();
  for (const r of pairs) { (byWeek.get(r.week) ?? byWeek.set(r.week, new Set()).get(r.week)!).add(r.playerId); }
  const weeksSorted = [...byWeek.keys()].sort((a, b) => a - b);
  const wow = weeksSorted.slice(0, -1).map((w) => {
    const a = byWeek.get(w)!; const b = byWeek.get(w + 1) ?? new Set<string>();
    const kept = [...a].filter((id) => b.has(id)).length;
    return { from: w, to: w + 1, retention: a.size ? kept / a.size : 0 };
  });

  // channel mix (only if the Event table/migration exists yet)
  let channels: { channel: string | null; n: number }[] = [];
  try {
    channels = await prisma.$queryRaw<{ channel: string | null; n: number }[]>`
      SELECT channel, COUNT(*)::int AS n FROM "Event"
      WHERE "leagueId" = ${leagueId} AND type = 'pick_saved' GROUP BY channel`;
  } catch { /* Event table not migrated yet */ }

  // --- this-week loop health ---
  const games = await prisma.game.findMany({ where: { season, week } });
  const locked = games.filter((g) => isGameLocked(g, now)).length;
  const final = games.filter((g) => g.final).length;
  const ungraded = games.filter((g) => isGameLocked(g, now) && !g.final).length;

  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <main style={{ padding: 24, color: "#eef3fa", fontFamily: "system-ui", maxWidth: 820 }}>
      <h1 style={{ fontSize: 22 }}>League health — {ctx.league.name}</h1>

      <div style={box}>
        <div style={mut}>OPT-IN (ever submitted ÷ roster)</div>
        <div style={num}>{pct(optIn[0]?.rate ?? 0)}</div>
      </div>

      <div style={box}>
        <div style={mut}>WEEKLY ACTIVE (cards submitted)</div>
        {weekly.length ? weekly.map((w) => (
          <div key={w.week}>Week {w.week}: <b>{w.active}</b></div>
        )) : <div style={mut}>No submissions yet.</div>}
      </div>

      <div style={box}>
        <div style={mut}>WEEK-OVER-WEEK RETENTION</div>
        {wow.length ? wow.map((r) => (
          <div key={r.from}>Wk {r.from} → {r.to}: <b style={{ color: "#4f8cff" }}>{pct(r.retention)}</b></div>
        )) : <div style={mut}>Needs ≥2 weeks of data.</div>}
      </div>

      {channels.length > 0 && (
        <div style={box}>
          <div style={mut}>CHANNEL MIX (picks saved) — your text/voice moat</div>
          {channels.map((c) => <div key={c.channel ?? "?"}>{c.channel ?? "web"}: <b>{c.n}</b></div>)}
        </div>
      )}

      <div style={{ ...box, borderColor: ungraded > 0 ? "#ff7a7a" : "#2a3550" }}>
        <div style={mut}>THIS WEEK — loop status (week {week})</div>
        <div>Games loaded: <b>{games.length}</b>{games.length === 0 && <span style={{ color: "#ff7a7a" }}> ⚠ lines not pulled</span>}</div>
        <div>Locked (kicked off): <b>{locked}</b> / {games.length}</div>
        <div>Final &amp; graded: <b>{final}</b></div>
        <div>Started but <b>not yet graded</b>: <b style={{ color: ungraded ? "#ff7a7a" : "#21e08a" }}>{ungraded}</b>{ungraded > 0 && " ⚠ check the grade cron / scores feed"}</div>
      </div>

      <p style={mut}>Read-only. Refresh to update. Commissioner-only.</p>
    </main>
  );
}
