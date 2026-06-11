// ---------------------------------------------------------------------------
// Spread Pickem — Conviction scoring engine (ported & verified from prototype)
// Pure functions only: no DB, no framework. Unit-tested in scoring.test.ts.
// ---------------------------------------------------------------------------

export const PTS = { su: 1, ats: 2, ou: 2 } as const;
export const SWEEP = 1; // all 3 correct on a game
export const WHIFF = -2; // all 3 wrong on a game
export const POWER = [3, 2, 1]; // ± applied to a Power Pick's spread call, by rank

export type Format = "simple" | "ranked";
export type Side = "home" | "away";
export type OU = "over" | "under";

/** Convert a whole-number line to a half-point so a push is impossible. */
export const halfify = (n: number): number =>
  Number.isInteger(n) ? (n < 0 ? n - 0.5 : n + 0.5) : n;

export interface GameScore {
  id: string;
  homeSpread: number; // stored already half-pointed
  total: number; // stored already half-pointed
  awayScore: number | null;
  homeScore: number | null;
  final: boolean;
}

export interface Pick {
  su?: Side | null;
  ats?: Side | null;
  ou?: OU | null;
}

export interface Truth {
  su: Side;
  ats: Side;
  ou: OU;
}

export function truth(g: GameScore): Truth | null {
  if (!g.final || g.homeScore == null || g.awayScore == null) return null;
  const m = g.homeScore - g.awayScore;
  return {
    su: g.homeScore > g.awayScore ? "home" : "away",
    ats: m + g.homeSpread > 0 ? "home" : "away",
    ou: g.homeScore + g.awayScore > g.total ? "over" : "under",
  };
}

export interface GameNet {
  net: number;
  correct: number;
  made: number;
  atsRes: "win" | "loss" | null;
  graded: boolean;
  sweep: boolean;
  whiff: boolean;
}

export function gameNet(g: GameScore, pk?: Pick | null): GameNet {
  const t = truth(g);
  if (!t || !pk)
    return { net: 0, correct: 0, made: 0, atsRes: null, graded: !!t, sweep: false, whiff: false };
  let c = 0,
    net = 0;
  let atsRes: "win" | "loss" | null = null;
  if (pk.su) {
    if (pk.su === t.su) {
      c++;
      net += PTS.su;
    }
  }
  if (pk.ats) {
    atsRes = pk.ats === t.ats ? "win" : "loss";
    if (pk.ats === t.ats) {
      c++;
      net += PTS.ats;
    }
  }
  if (pk.ou) {
    if (pk.ou === t.ou) {
      c++;
      net += PTS.ou;
    }
  }
  const made = (pk.su ? 1 : 0) + (pk.ats ? 1 : 0) + (pk.ou ? 1 : 0);
  if (made === 3 && c === 3) net += SWEEP;
  if (made === 3 && c === 0) net += WHIFF;
  return { net, correct: c, made, atsRes, graded: true, sweep: made === 3 && c === 3, whiff: made === 3 && c === 0 };
}

export interface WeekScore {
  base: number;
  powerAdj: number;
  total: number;
  perGame: Record<string, GameNet>;
}

/**
 * Score one player's week.
 * @param games        the week's games (with results, if graded)
 * @param picks        gameId -> Pick
 * @param powerOrdered ordered list of gameIds the player flagged as Power Picks (rank 1 first)
 * @param format       'simple' (1 Power Pick) | 'ranked' (up to 3)
 */
export function weekScore(
  games: GameScore[],
  picks: Record<string, Pick | undefined>,
  powerOrdered: string[],
  format: Format
): WeekScore {
  const max = format === "ranked" ? 3 : 1;
  const power = powerOrdered.slice(0, max);
  let base = 0,
    powerAdj = 0;
  const perGame: Record<string, GameNet> = {};
  for (const g of games) {
    const gn = gameNet(g, picks[g.id]);
    base += gn.net;
    perGame[g.id] = gn;
  }
  power.forEach((gid, i) => {
    const gn = perGame[gid];
    if (gn && gn.graded && gn.atsRes) powerAdj += gn.atsRes === "win" ? POWER[i] : -POWER[i];
  });
  return { base, powerAdj, total: base + powerAdj, perGame };
}

// ---------------------------------------------------------------------------
// Standings helpers (pure). Aggregate inputs are assembled by lib/standings.ts.
// ---------------------------------------------------------------------------

export interface SeasonSettings {
  seasonStart: number;
  seasonEnd: number;
  playoffOn: boolean;
  playoffStart: number;
  playoffTeams: number;
  seedStep: number;
}

export const inSeason = (week: number, s: SeasonSettings) => week >= s.seasonStart && week <= s.seasonEnd;
export const regEnd = (s: SeasonSettings) => (s.playoffOn ? Math.min(s.playoffStart - 1, s.seasonEnd) : s.seasonEnd);
export const seedBonus = (seed: number | null, teams: number, step: number) => (seed ? (teams - seed) * step : 0);

export interface StandRow {
  playerId: string;
  name: string;
  pts: number;
  atsWins: number;
  powerHits: number;
  bestWeek: number;
}

/** The Gauntlet tiebreaker: pts → ATS wins → Power-Pick hits → best week → name. */
export function gauntlet(a: StandRow, b: StandRow): number {
  return (
    b.pts - a.pts ||
    b.atsWins - a.atsWins ||
    b.powerHits - a.powerHits ||
    b.bestWeek - a.bestWeek ||
    a.name.localeCompare(b.name)
  );
}

export interface PlayoffRow extends StandRow {
  reg: number;
  playoff: number;
  seed: number | null;
  bonus: number;
  finalTotal: number | null;
}

/**
 * Build hybrid-playoff standings.
 * @param rows  per player: reg (regular-season pts), playoff (playoff-week pts), atsWins (regular season)
 */
export function playoffStandings(
  rows: { playerId: string; name: string; reg: number; playoff: number; atsWins: number; bestWeek: number }[],
  s: SeasonSettings
): { quals: PlayoffRow[]; nons: PlayoffRow[] } {
  const seeded = [...rows].sort((a, b) => b.reg - a.reg || b.atsWins - a.atsWins || a.name.localeCompare(b.name));
  const mapped: PlayoffRow[] = seeded.map((x, i) => {
    const seed = i < s.playoffTeams ? i + 1 : null;
    const bonus = seedBonus(seed, s.playoffTeams, s.seedStep);
    return {
      playerId: x.playerId,
      name: x.name,
      pts: x.reg + x.playoff,
      atsWins: x.atsWins,
      powerHits: 0,
      bestWeek: x.bestWeek,
      reg: x.reg,
      playoff: x.playoff,
      seed,
      bonus,
      finalTotal: seed ? bonus + x.playoff : null,
    };
  });
  const quals = mapped
    .filter((x) => x.seed)
    .sort((a, b) => (b.finalTotal! - a.finalTotal!) || b.playoff - a.playoff || b.reg - a.reg || a.name.localeCompare(b.name));
  const nons = mapped.filter((x) => !x.seed).sort((a, b) => b.reg - a.reg || a.name.localeCompare(b.name));
  return { quals, nons };
}
