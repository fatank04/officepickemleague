import { prisma } from "./db";
import {
  weekScore,
  gauntlet,
  playoffStandings,
  inSeason,
  regEnd,
  type GameScore,
  type Format,
  type SeasonSettings,
} from "./scoring";

export async function getLeague(slug: string) {
  return prisma.league.findUnique({ where: { slug } });
}

export interface StandingsView {
  weeks: number[];
  rows: {
    playerId: string;
    name: string;
    color: string;
    byWeek: Record<number, number | null>;
    pts: number;
    atsWins: number;
    powerHits: number;
  }[];
  playoff?: ReturnType<typeof playoffStandings>;
}

export async function getStandings(league: {
  id: string;
  season: number;
  format: Format;
  seasonStart: number;
  seasonEnd: number;
  playoffOn: boolean;
  playoffStart: number;
  playoffTeams: number;
  seedStep: number;
}): Promise<StandingsView> {
  const settings: SeasonSettings = league;
  const [players, games, picks, powers] = await Promise.all([
    prisma.player.findMany({ where: { leagueId: league.id }, orderBy: { createdAt: "asc" } }),
    prisma.game.findMany({
      where: { season: league.season, week: { gte: league.seasonStart, lte: league.seasonEnd } },
      orderBy: [{ week: "asc" }, { kickoff: "asc" }],
    }),
    prisma.pick.findMany({ where: { leagueId: league.id } }),
    prisma.powerPick.findMany({ where: { leagueId: league.id }, orderBy: { rank: "asc" } }),
  ]);

  const weeks = [...new Set(games.map((g) => g.week))].sort((a, b) => a - b);
  const gamesByWeek = new Map<number, GameScore[]>();
  for (const g of games) {
    const arr = gamesByWeek.get(g.week) ?? [];
    arr.push(g);
    gamesByWeek.set(g.week, arr);
  }
  const pickByPlayerGame = new Map<string, (typeof picks)[number]>();
  for (const p of picks) pickByPlayerGame.set(`${p.playerId}:${p.gameId}`, p);
  const powerByPlayerWeek = new Map<string, string[]>();
  for (const pp of powers) {
    const k = `${pp.playerId}:${pp.week}`;
    const arr = powerByPlayerWeek.get(k) ?? [];
    arr.push(pp.gameId);
    powerByPlayerWeek.set(k, arr);
  }

  const reg = regEnd(settings);
  const rows = players.map((pl) => {
    const byWeek: Record<number, number | null> = {};
    let pts = 0,
      atsWins = 0,
      powerHits = 0,
      bestWeek = 0,
      regPts = 0,
      playoffPts = 0;
    for (const w of weeks) {
      const wg = gamesByWeek.get(w) ?? [];
      const graded = wg.some((g) => g.final);
      const pmap: Record<string, any> = {};
      for (const g of wg) {
        const pk = pickByPlayerGame.get(`${pl.id}:${g.id}`);
        if (pk) pmap[g.id] = { su: pk.su, ats: pk.ats, ou: pk.ou };
      }
      const power = powerByPlayerWeek.get(`${pl.id}:${w}`) ?? [];
      const ws = weekScore(wg, pmap, power, league.format);
      byWeek[w] = graded ? ws.total : null;
      if (graded && inSeason(w, settings)) {
        pts += ws.total;
        if (w <= reg) regPts += ws.total;
        if (settings.playoffOn && w >= settings.playoffStart) playoffPts += ws.total;
        bestWeek = Math.max(bestWeek, ws.total);
        for (const g of wg) {
          if (ws.perGame[g.id]?.atsRes === "win") atsWins++;
        }
        const maxP = league.format === "ranked" ? 3 : 1;
        power.slice(0, maxP).forEach((gid) => {
          if (ws.perGame[gid]?.atsRes === "win") powerHits++;
        });
      }
    }
    return { playerId: pl.id, name: pl.name, color: pl.color, byWeek, pts, atsWins, powerHits, bestWeek, regPts, playoffPts };
  });

  if (league.playoffOn) {
    const playoff = playoffStandings(
      rows.map((r) => ({ playerId: r.playerId, name: r.name, reg: r.regPts, playoff: r.playoffPts, atsWins: r.atsWins, bestWeek: r.bestWeek })),
      settings
    );
    return { weeks, rows: rows.map(strip), playoff };
  }
  rows.sort(gauntlet);
  return { weeks, rows: rows.map(strip) };
}

function strip(r: any) {
  return { playerId: r.playerId, name: r.name, color: r.color, byWeek: r.byWeek, pts: r.pts, atsWins: r.atsWins, powerHits: r.powerHits };
}
