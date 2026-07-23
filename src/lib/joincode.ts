import { prisma } from "./db";

// Memorable two-word SMS join codes ("steel-crew"). Players type these on a
// phone keypad and read them aloud across a shop floor, so they beat a slug
// like "acme-fabricating-x7k2". Curated lists — no ambiguous or unkind words,
// nothing that reads badly next to a company name.
const LEFT = [
  "steel", "iron", "blue", "gold", "river", "north", "south", "east", "west", "red",
  "stone", "oak", "pine", "copper", "silver", "granite", "amber", "coal", "brick", "storm",
  "swift", "bold", "prime", "solid", "sharp", "true", "lucky", "wild", "brave", "big",
  "third", "double", "triple", "long", "deep", "high", "open", "clean", "quick", "sunday",
];
const RIGHT = [
  "crew", "shift", "squad", "yard", "dock", "floor", "bench", "huddle", "drive", "block",
  "anvil", "hammer", "gear", "bolt", "rivet", "forge", "press", "line", "gate", "post",
  "eagle", "falcon", "bear", "wolf", "hawk", "ram", "colt", "jet", "chief", "packer",
  "monday", "kickoff", "endzone", "gridiron", "tailgate", "playbook", "redzone", "punt", "snap", "blitz",
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Normalize any user-typed code: case, spaces, and an optional hyphen. */
export function normalizeJoinCode(input: string): string {
  return (input || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * A join code that isn't taken. Tries two-word combos, then falls back to
 * appending a digit so we can't spin forever on a crowded wordlist.
 */
export async function generateJoinCode(): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const code = `${pick(LEFT)}-${pick(RIGHT)}`;
    if (!(await prisma.league.findFirst({ where: { joinCode: code }, select: { id: true } }))) return code;
  }
  for (let i = 0; i < 50; i++) {
    const code = `${pick(LEFT)}-${pick(RIGHT)}${Math.floor(Math.random() * 90) + 10}`;
    if (!(await prisma.league.findFirst({ where: { joinCode: code }, select: { id: true } }))) return code;
  }
  throw new Error("Could not allocate a join code");
}

/**
 * Find a league by join code OR slug, ignoring case/spacing/hyphens, so
 * "Steel Crew", "steel-crew" and "steelcrew" all land. Slug stays accepted for
 * backward compatibility with codes already printed on sheets.
 */
export async function leagueByJoinCode(input: string) {
  const raw = (input || "").trim();
  if (!raw) return null;
  const norm = normalizeJoinCode(raw);
  const bySlug = await prisma.league.findUnique({ where: { slug: raw.toLowerCase() } });
  if (bySlug) return bySlug;
  // Compare normalized, so punctuation/case never blocks a join.
  const candidates = await prisma.league.findMany({
    where: { joinCode: { not: null } },
    select: { id: true, joinCode: true },
  });
  const hit = candidates.find((c) => normalizeJoinCode(c.joinCode!) === norm);
  return hit ? prisma.league.findUnique({ where: { id: hit.id } }) : null;
}
