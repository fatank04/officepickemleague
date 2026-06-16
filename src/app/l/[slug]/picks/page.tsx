import { current, isGameLocked } from "@/lib/league";
import { prisma } from "@/lib/db";
import { gameNet, truth, type GameScore } from "@/lib/scoring";
import { team } from "@/lib/teams";
import PicksClient from "./PicksClient";
import { brandOf } from "@/lib/brand";
import BrandTheme from "@/components/BrandTheme";

export const dynamic = "force-dynamic";

export default async function PicksPage({
  params, searchParams,
}: { params: { slug: string }; searchParams: { week?: string } }) {
  const ctx = (await current())!;
  const league = ctx.league;
  const now = new Date();

  const all = await prisma.game.findMany({
    where: { season: league.season, week: { gte: league.seasonStart, lte: league.seasonEnd } },
    orderBy: [{ week: "asc" }, { kickoff: "asc" }],
  });
  const byWeek = new Map<number, typeof all>();
  for (const g of all) { const a = byWeek.get(g.week) ?? []; a.push(g); byWeek.set(g.week, a); }
  const weeks = [...byWeek.keys()].sort((a, b) => a - b);

  let week = Number(searchParams?.week);
  if (!weeks.includes(week)) {
    // default to the earliest week that still has at least one game not kicked off
    week = weeks.find((w) => byWeek.get(w)!.some((g) => !isGameLocked(g, now))) ?? weeks[weeks.length - 1] ?? league.seasonStart;
  }
  const games = byWeek.get(week) ?? [];
  const anyOpen = games.some((g) => !isGameLocked(g, now));

  const [picks, power, sub, playersN, submittedN] = await Promise.all([
    prisma.pick.findMany({ where: { playerId: ctx.player.id, gameId: { in: games.map((g) => g.id) } } }),
    prisma.powerPick.findMany({ where: { playerId: ctx.player.id, season: league.season, week }, orderBy: { rank: "asc" } }),
    prisma.submission.findUnique({ where: { playerId_season_week: { playerId: ctx.player.id, season: league.season, week } } }),
    prisma.player.count({ where: { leagueId: league.id } }),
    prisma.submission.count({ where: { leagueId: league.id, season: league.season, week } }),
  ]);
  const pickMap = new Map(picks.map((p) => [p.gameId, p]));
  const powerOrder = power.map((p) => p.gameId);

  // League pick distribution — only for games that have locked (kicked off).
  const lockedIds = games.filter((g) => isGameLocked(g, now)).map((g) => g.id);
  const distRows = lockedIds.length
    ? await prisma.pick.findMany({ where: { leagueId: league.id, gameId: { in: lockedIds } }, select: { gameId: true, su: true, ats: true, ou: true } })
    : [];
  const dist = new Map<string, { suHome: number; suN: number; atsHome: number; atsN: number; ouOver: number; ouN: number }>();
  for (const id of lockedIds) dist.set(id, { suHome: 0, suN: 0, atsHome: 0, atsN: 0, ouOver: 0, ouN: 0 });
  for (const p of distRows) {
    const d = dist.get(p.gameId)!;
    if (p.su) { d.suN++; if (p.su === "home") d.suHome++; }
    if (p.ats) { d.atsN++; if (p.ats === "home") d.atsHome++; }
    if (p.ou) { d.ouN++; if (p.ou === "over") d.ouOver++; }
  }

  const data = games.map((g) => {
    const p = pickMap.get(g.id);
    const gs: GameScore = { id: g.id, homeSpread: g.homeSpread, total: g.total, awayScore: g.awayScore, homeScore: g.homeScore, final: g.final };
    const t = truth(gs);
    const pick = p ? { su: p.su as any, ats: p.ats as any, ou: p.ou as any } : null;
    const gn = gameNet(gs, pick);
    const at = team(g.away), ht = team(g.home);
    const idx = powerOrder.indexOf(g.id);
    const lockedGame = isGameLocked(g, now);
    return {
      id: g.id, away: g.away, home: g.home,
      awayAbbr: at.abbr, homeAbbr: ht.abbr, awayColor: at.color, homeColor: ht.color,
      homeSpread: g.homeSpread, awaySpread: -g.homeSpread, total: g.total,
      kickoff: g.kickoff.toISOString(),
      final: g.final, awayScore: g.awayScore, homeScore: g.homeScore,
      su: p?.su ?? null, ats: p?.ats ?? null, ou: p?.ou ?? null,
      powerRank: idx >= 0 ? idx : null,
      net: t ? gn.net : null, truth: t,
      lockedGame,
      dist: lockedGame ? dist.get(g.id) ?? null : null,
    };
  });

  const brand = brandOf(league as any);
  return (
    <>
      <BrandTheme accent={brand.accent} />
      <PicksClient
        slug={league.slug} week={week} weeks={weeks} format={league.format}
        anyOpen={anyOpen} submitted={!!sub} playersN={playersN} submittedN={submittedN} games={data}
        accent={brand.accent} prizeText={brand.prizeText}
      />
    </>
  );
}
