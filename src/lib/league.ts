import { prisma } from "./db";
import { getSession } from "./auth";

export { isGameLocked } from "./lock";

export function slugify(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "league";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Current league + player from the session cookie, or null. */
export async function current() {
  const s = getSession();
  if (!s) return null;
  const [league, player] = await Promise.all([
    prisma.league.findUnique({ where: { slug: s.leagueSlug } }),
    prisma.player.findUnique({ where: { id: s.playerId } }),
  ]);
  if (!league || !player || player.leagueId !== league.id) return null;
  return { league, player };
}

/** Kept for UI summaries only — NO LONGER the write gate (per-game locks are). */
export function weekLockTime(games: { kickoff: Date }[]): Date | null {
  if (!games.length) return null;
  const sun = games.filter((g) => new Date(g.kickoff).getUTCDay() === 0).map((g) => +new Date(g.kickoff));
  const pool = sun.length ? sun : games.map((g) => +new Date(g.kickoff));
  return new Date(Math.min(...pool));
}
export function isWeekLocked(games: { kickoff: Date }[]): boolean {
  const t = weekLockTime(games);
  return !!t && Date.now() >= t.getTime();
}

/** Admin gate: returns { league, player } only if signed in AND commissioner. */
export async function requireCommish() {
  const ctx = await current();
  if (!ctx || !ctx.player.isCommish) return null;
  return ctx;
}
