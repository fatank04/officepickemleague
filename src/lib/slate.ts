import { prisma } from "@/lib/db";

// The weekly FEATURED SLATE (decided 2026-07-22, docs/product/modality-spec.md):
// ~9 games = the national-window games (Thu night, Sun night, Mon night — identified
// by kickoff time, no TV data needed) + the league's home team + the closest-spread
// matchups to fill. Off-slate games are hidden from players. Built once per
// league-week on first access and persisted (SlateEntry) so mid-week line moves
// never reshuffle a slate people already picked from; the commissioner can swap
// games from the admin console until the week opens.
export const SLATE_SIZE = 9;

type SlateGame = { id: string; week: number; away: string; home: string; homeSpread: number; kickoff: Date };
type SlateLeague = { id: string; season: number; fullSlate: boolean; homeTeam: string | null };

// National TV windows by kickoff, in ET: any Thursday game (TNF/Thanksgiving),
// Sunday at 7pm or later (SNF), any Monday game (MNF).
export function isNationalWindow(kickoff: Date): boolean {
  const et = new Date(kickoff.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay(), hour = et.getHours();
  return day === 4 || day === 1 || (day === 0 && hour >= 19);
}

// Rank a week's games into a slate. Pure — used for the initial build and admin preview.
export function rankSlate(games: SlateGame[], homeTeam: string | null, size = SLATE_SIZE): SlateGame[] {
  const scored = games.map((g) => ({
    g,
    home: !!homeTeam && (g.away === homeTeam || g.home === homeTeam),
    national: isNationalWindow(g.kickoff),
    closeness: -Math.abs(g.homeSpread),
  }));
  scored.sort((a, b) =>
    Number(b.home) - Number(a.home) ||
    Number(b.national) - Number(a.national) ||
    b.closeness - a.closeness ||
    a.g.kickoff.getTime() - b.g.kickoff.getTime()
  );
  return scored.slice(0, Math.min(size, scored.length)).map((s) => s.g);
}

// The slate's game ids for one league-week. Returns null for full-slate leagues
// (meaning: no filter). Lazily builds + persists on first call.
export async function slateIds(league: SlateLeague, week: number): Promise<Set<string> | null> {
  if (league.fullSlate) return null;
  const existing = await prisma.slateEntry.findMany({
    where: { leagueId: league.id, season: league.season, week },
    select: { gameId: true },
  });
  if (existing.length) return new Set(existing.map((e) => e.gameId));

  const games = await prisma.game.findMany({ where: { season: league.season, week } });
  if (!games.length) return new Set();
  const chosen = rankSlate(games, league.homeTeam);
  await prisma.slateEntry.createMany({
    data: chosen.map((g) => ({ leagueId: league.id, gameId: g.id, season: league.season, week })),
    skipDuplicates: true,
  });
  return new Set(chosen.map((g) => g.id));
}

// Filter helper for surfaces that already fetched a week's games.
export async function filterToSlate<T extends { id: string }>(league: SlateLeague, week: number, games: T[]): Promise<T[]> {
  const ids = await slateIds(league, week);
  return ids ? games.filter((g) => ids.has(g.id)) : games;
}

// Season-wide variant for the picks page (all weeks in one shot, one query +
// one createMany per missing week).
export async function filterSeasonToSlate<T extends { id: string; week: number }>(
  league: SlateLeague,
  games: T[]
): Promise<T[]> {
  if (league.fullSlate) return games;
  const entries = await prisma.slateEntry.findMany({
    where: { leagueId: league.id, season: league.season },
    select: { gameId: true, week: true },
  });
  const byWeek = new Map<number, Set<string>>();
  for (const e of entries) byWeek.set(e.week, (byWeek.get(e.week) ?? new Set()).add(e.gameId));

  const weeks = [...new Set(games.map((g) => g.week))];
  for (const w of weeks) {
    if (byWeek.has(w)) continue;
    const wk = games.filter((g) => g.week === w);
    const chosen = rankSlate(wk as unknown as SlateGame[], league.homeTeam);
    await prisma.slateEntry.createMany({
      data: chosen.map((g) => ({ leagueId: league.id, gameId: g.id, season: league.season, week: w })),
      skipDuplicates: true,
    });
    byWeek.set(w, new Set(chosen.map((g) => g.id)));
  }
  return games.filter((g) => byWeek.get(g.week)?.has(g.id));
}

// Map a kit metro to its NFL team for the home-team prefill at league creation.
export const METRO_HOME_TEAM: Record<string, string> = {
  Pittsburgh: "Pittsburgh Steelers",
  Philadelphia: "Philadelphia Eagles",
  Buffalo: "Buffalo Bills",
  Cleveland: "Cleveland Browns",
  Cincinnati: "Cincinnati Bengals",
  Detroit: "Detroit Lions",
  Baltimore: "Baltimore Ravens",
  Milwaukee: "Green Bay Packers",
  "Milwaukee/GreenBay": "Green Bay Packers",
  GreenBay: "Green Bay Packers",
};
