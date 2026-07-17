import Link from "next/link";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { nflWeek } from "@/lib/odds";
import { isGameLocked } from "@/lib/lock";
import GamesClient, { GameRow } from "./GamesClient";

export const dynamic = "force-dynamic";

export default async function GamesPage({ params, searchParams }: { params: { slug: string }; searchParams: { week?: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug)
    return <div className="card pad muted">Sign in to view.</div>;
  if (!ctx.player.isCommish)
    return <div className="card pad muted">Commissioner only.</div>;

  const season = ctx.league.season;
  const week = Number(searchParams.week) || nflWeek(new Date());
  const weeksRaw = await prisma.game.findMany({ where: { season }, select: { week: true }, distinct: ["week"], orderBy: { week: "asc" } });
  const weeks = weeksRaw.map((w) => w.week);
  const games = await prisma.game.findMany({ where: { season, week }, orderBy: { kickoff: "asc" } });
  const now = new Date();
  const pickCounts = await prisma.pick.groupBy({ by: ["gameId"], where: { gameId: { in: games.map((g) => g.id) } }, _count: { gameId: true } });
  const pc = new Map(pickCounts.map((p) => [p.gameId, p._count.gameId]));

  const rows: GameRow[] = games.map((g) => ({
    id: g.id, away: g.away, home: g.home, homeSpread: g.homeSpread, total: g.total,
    awayScore: g.awayScore ?? null, homeScore: g.homeScore ?? null, final: !!g.final,
    locked: isGameLocked(g, now), hasPicks: (pc.get(g.id) ?? 0) > 0,
    kickoff: g.kickoff.toISOString(),
  }));

  return (
    <>
      <Link href={`/l/${ctx.league.slug}/admin`} className="muted small">← Console</Link>
      <div className="app-kicker" style={{ marginTop: 6 }}>Commissioner</div>
      <h2 style={{ margin: "0 0 2px" }}>Games &amp; scores</h2>
      <p className="muted small" style={{ marginTop: 0 }}>Correct a final, regrade the week, or fix a missing line before kickoff. Standings recompute automatically.</p>
      <GamesClient slug={ctx.league.slug} week={week} weeks={weeks} rows={rows} />
    </>
  );
}
