// Pure, dependency-free helpers so they're unit-testable without a DB or Next runtime.

/** A single game locks the instant it kicks off (per-game lock). */
export function isGameLocked(game: { kickoff: Date | string }, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(game.kickoff).getTime();
}

/**
 * Decide what an incoming line ingestion should do for a game.
 * The line (spread/total) is FROZEN at creation and never overwritten.
 *  - "create"  : first time we've seen this game -> write the line once
 *  - "update"  : exists and hasn't started -> may update kickoff (flex scheduling) ONLY
 *  - "skip"    : already kicked off -> never touch
 */
export function planIngest(existing: { kickoff: Date | string } | null, now: Date = new Date()): "create" | "update" | "skip" {
  if (!existing) return "create";
  if (now.getTime() < new Date(existing.kickoff).getTime()) return "update";
  return "skip";
}
