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

// In-process cache of a league's built slate (week → gameId set). The slate is
// identical for every player in a league-week and rarely changes, so this keeps
// the SlateEntry query off the hot paths (picks/SMS/autofill). The commissioner
// toggle calls invalidateSlate; the TTL is a backstop.
const SLATE_TTL_MS = 60_000;
const slateCache = new Map<string, { at: number; byWeek: Map<number, Set<string>> }>();
export function invalidateSlate(leagueId: string) { slateCache.delete(leagueId); }

async function seasonSlate(league: SlateLeague): Promise<Map<number, Set<string>>> {
  const c = slateCache.get(league.id);
  if (c && Date.now() - c.at < SLATE_TTL_MS) return c.byWeek;
  const entries = await prisma.slateEntry.findMany({
    where: { leagueId: league.id, season: league.season },
    select: { gameId: true, week: true },
  });
  const byWeek = new Map<number, Set<string>>();
  for (const e of entries) byWeek.set(e.week, (byWeek.get(e.week) ?? new Set()).add(e.gameId));
  slateCache.set(league.id, { at: Date.now(), byWeek });
  return byWeek;
}

// Build + persist one week's slate, updating the cache. Returns its game ids.
async function buildWeek(league: SlateLeague, week: number, byWeek: Map<number, Set<string>>): Promise<Set<string>> {
  const games = await prisma.game.findMany({ where: { season: league.season, week } });
  const chosen = games.length ? rankSlate(games, league.homeTeam) : [];
  if (chosen.length)
    await prisma.slateEntry.createMany({
      data: chosen.map((g) => ({ leagueId: league.id, gameId: g.id, season: league.season, week })),
      skipDuplicates: true,
    });
  const set = new Set(chosen.map((g) => g.id));
  byWeek.set(week, set);
  return set;
}

// The slate's game ids for one league-week. Returns null for full-slate leagues
// (meaning: no filter). Served from cache; lazily builds + persists on first call.
export async function slateIds(league: SlateLeague, week: number): Promise<Set<string> | null> {
  if (league.fullSlate) return null;
  const byWeek = await seasonSlate(league);
  return byWeek.get(week) ?? (await buildWeek(league, week, byWeek));
}

// Filter helper for surfaces that already fetched a week's games.
export async function filterToSlate<T extends { id: string }>(league: SlateLeague, week: number, games: T[]): Promise<T[]> {
  const ids = await slateIds(league, week);
  return ids ? games.filter((g) => ids.has(g.id)) : games;
}

// Season-wide variant for the picks page.
export async function filterSeasonToSlate<T extends { id: string; week: number }>(
  league: SlateLeague,
  games: T[]
): Promise<T[]> {
  if (league.fullSlate) return games;
  const byWeek = await seasonSlate(league);
  for (const w of new Set(games.map((g) => g.week))) {
    if (!byWeek.has(w)) await buildWeek(league, w, byWeek);
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
  Chicago: "Chicago Bears",
  Milwaukee: "Green Bay Packers",
  "Milwaukee/GreenBay": "Green Bay Packers",
  GreenBay: "Green Bay Packers",
};
