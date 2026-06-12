import { prisma } from "./db";
import { getStandings } from "./standings";
import { brandOf } from "./brand";
import { truth, gameNet, type GameScore } from "./scoring";

export type CatAcc = { wc: number; wn: number; sc: number; sn: number };
export type CardData = {
  league: { name: string; slug: string; accent: string; ink: string };
  player: { name: string };
  week: number;
  weekPts: number;
  seasonPts: number;
  rank: number;
  of: number;
  movement: number; // + = moved up, - = down, 0 = none
  acc: { su: CatAcc; ats: CatAcc; ou: CatAcc };
  lockHit: boolean;
  sweep: boolean;
};

const z = (): CatAcc => ({ wc: 0, wn: 0, sc: 0, sn: 0 });
function sumThrough(byWeek: Record<number, number | null>, w: number): number {
  let s = 0;
  for (const k of Object.keys(byWeek)) {
    const n = Number(k);
    if (n <= w && byWeek[n] != null) s += byWeek[n] as number;
  }
  return s;
}

/** Everything the shareable result card needs for one player's week. Null if nothing graded / bad ids. */
export async function getCardData(slug: string, playerId: string, weekArg?: number): Promise<CardData | null> {
  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) return null;
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.leagueId !== league.id) return null;

  const games = await prisma.game.findMany({
    where: { season: league.season, week: { gte: league.seasonStart, lte: league.seasonEnd } },
    orderBy: [{ week: "asc" }, { kickoff: "asc" }],
  });
  const picks = await prisma.pick.findMany({ where: { playerId } });
  const powers = await prisma.powerPick.findMany({ where: { playerId }, orderBy: { rank: "asc" } });
  const pickByGame = new Map(picks.map((p) => [p.gameId, p]));

  const gradedWeeks = [...new Set(games.filter((g) => g.final).map((g) => g.week))].sort((a, b) => a - b);
  const week = weekArg && gradedWeeks.includes(weekArg) ? weekArg : gradedWeeks[gradedWeeks.length - 1];
  if (week == null) return null;

  const acc = { su: z(), ats: z(), ou: z() };
  for (const g of games) {
    const t = truth(g as unknown as GameScore);
    if (!t) continue;
    const pk = pickByGame.get(g.id);
    if (!pk) continue;
    (["su", "ats", "ou"] as const).forEach((cat) => {
      const sel = (pk as any)[cat];
      if (!sel) return;
      acc[cat].sn++;
      if (sel === (t as any)[cat]) acc[cat].sc++;
      if (g.week === week) {
        acc[cat].wn++;
        if (sel === (t as any)[cat]) acc[cat].wc++;
      }
    });
  }

  let sweep = false;
  for (const g of games.filter((g) => g.week === week)) {
    if (gameNet(g as unknown as GameScore, pickByGame.get(g.id) as any).sweep) sweep = true;
  }
  let lockHit = false;
  const wkPow = powers.filter((pp) => pp.week === week).sort((a, b) => a.rank - b.rank)[0];
  if (wkPow) {
    const lg = games.find((g) => g.id === wkPow.gameId);
    if (lg) lockHit = gameNet(lg as unknown as GameScore, pickByGame.get(lg.id) as any).atsRes === "win";
  }

  const view = await getStandings(league);
  const rankAt = (w: number) => {
    const arr = view.rows.map((r) => ({ id: r.playerId, cum: sumThrough(r.byWeek, w) }));
    arr.sort((a, b) => b.cum - a.cum);
    return arr.findIndex((x) => x.id === playerId) + 1;
  };
  const rank = rankAt(week);
  const movement = week > league.seasonStart ? rankAt(week - 1) - rank : 0;
  const row = view.rows.find((r) => r.playerId === playerId);

  return {
    league: { name: league.name, slug: league.slug, accent: brandOf(league as any).accent, ink: brandOf(league as any).ink },
    player: { name: player.name },
    week,
    weekPts: (row?.byWeek?.[week] ?? 0) as number,
    seasonPts: row?.pts ?? 0,
    rank,
    of: view.rows.length,
    movement,
    acc,
    lockHit,
    sweep,
  };
}

export const pct = (c: number, n: number) => (n ? Math.round((c / n) * 100) : 0);
export const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;
