import { prisma } from "./db";
import { voiceCtx } from "./voice";
import { isGameLocked } from "./league";
import { getStandings } from "./standings";
import { track } from "./track";
import { parseGuidedAnswer, teamLabel, isComplete, type FlowGame, type Answer } from "./guided";

// The concierge phone line (premium add-on). A Telnyx AI Assistant handles the
// voice + personality; these functions are the webhook TOOLS it calls to read
// and write picks. Pick MECHANICS (slate, parsing, saving, lock, submit) reuse
// the exact same engine as SMS PLAY — this is a voice front-end, not a fork.
// Lean v1: converse → take picks game-by-game → read the card back → submit on
// confirm. Memory is light (last week's points + rank); rich adaptation is later.

type Row = FlowGame & { kickoff: string | Date; homeSpread: number };

async function answersFor(playerId: string, games: { id: string }[]): Promise<Map<string, Answer>> {
  const picks = await prisma.pick.findMany({ where: { playerId, gameId: { in: games.map((g) => g.id) } } });
  return new Map(picks.map((p) => [p.gameId, { su: p.su as any, ats: p.ats as any, ou: p.ou as any }]));
}

// A spoken-friendly description of one game's current pick, for read-back.
function describePick(g: Row, a: Answer | undefined): string {
  if (!a || (!a.su && !a.ats && !a.ou)) return "no pick yet";
  const nameOf = (s?: "home" | "away") => (s ? teamLabel(s === "home" ? g.home : g.away) : null);
  const parts: string[] = [];
  if (a.su && a.ats && a.su === a.ats) parts.push(`${nameOf(a.su)} to win and cover`);
  else {
    if (a.su) parts.push(`${nameOf(a.su)} to win`);
    if (a.ats) parts.push(`${nameOf(a.ats)} to cover`);
  }
  if (a.ou) parts.push(`the ${a.ou}`);
  return parts.join(", ");
}

async function openSlate(from: string) {
  const ctx = await voiceCtx(from);
  if (!ctx) return { ctx: null as null | typeof ctx, open: [] as Row[] };
  const open = (ctx.week == null ? [] : (ctx.games as Row[])).filter((g) => !isGameLocked(g));
  return { ctx, open };
}

// TOOL: get_context — who's calling, the slate with lines, picks so far, and a
// little memory. The assistant opens the call with this.
export async function conciergeContext(from: string) {
  const { ctx, open } = await openSlate(from);
  if (!ctx) return { ok: false, reason: "unknown_caller" };
  if (!open.length) return { ok: false, reason: "no_open_games", name: ctx.player.name };

  const ans = await answersFor(ctx.player.id, open);
  const view = await getStandings(ctx.league as any).catch(() => null);
  const me = view?.rows.find((r) => r.playerId === ctx.player.id) ?? null;
  const gradedWeeks = me ? Object.keys(me.byWeek).map(Number).filter((w) => me!.byWeek[w] != null).sort((a, b) => a - b) : [];
  const lastW = gradedWeeks.length ? gradedWeeks[gradedWeeks.length - 1] : null;

  return {
    ok: true,
    name: ctx.player.name,
    league: ctx.league.name,
    week: ctx.week,
    total_games: open.length,
    picks_made: open.filter((g) => isComplete(ans.get(g.id) ?? {})).length,
    games: open.map((g, i) => ({
      number: i + 1,
      matchup: `${teamLabel(g.away)} at ${teamLabel(g.home)}`,
      favorite: teamLabel(g.homeSpread < 0 ? g.home : g.away),
      spread: Math.abs(g.homeSpread),
      total: g.total,
      current_pick: describePick(g, ans.get(g.id)),
    })),
    memory: {
      rank: me && view ? `${view.rows.indexOf(me) + 1} of ${view.rows.length}` : null,
      season_points: me?.pts ?? null,
      last_week: lastW != null ? { week: lastW, points: me!.byWeek[lastW] } : null,
    },
  };
}

// TOOL: set_pick — record a spoken pick for a game. `spoken` is the caller's own
// words ("Bills to win and cover, under") — parsed by the SAME parser as SMS.
export async function conciergePick(from: string, gameNumber: number, spoken: string) {
  const { ctx, open } = await openSlate(from);
  if (!ctx) return { ok: false, reason: "unknown_caller" };
  const g = open[gameNumber - 1];
  if (!g) return { ok: false, reason: "bad_game", total_games: open.length };

  const parsed = parseGuidedAnswer(spoken || "", g);
  if (!parsed.su && !parsed.ats && !parsed.ou) return { ok: false, reason: "unclear", game: gameNumber };

  const cur = (await answersFor(ctx.player.id, [g])).get(g.id) ?? {};
  const merged: Answer = { su: parsed.su ?? cur.su, ats: parsed.ats ?? cur.ats, ou: parsed.ou ?? cur.ou };
  await prisma.pick.upsert({
    where: { playerId_gameId: { playerId: ctx.player.id, gameId: g.id } },
    update: merged, create: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, gameId: g.id, ...merged },
  });
  track({ type: "pick_saved", leagueId: ctx.league.id, playerId: ctx.player.id, season: ctx.season, week: ctx.week!, channel: "voice", meta: { concierge: true } });
  return { ok: true, game: gameNumber, pick: describePick(g, merged), complete: isComplete(merged) };
}

// TOOL: set_lock — the caller's single most confident game.
export async function conciergeLock(from: string, gameNumber: number) {
  const { ctx, open } = await openSlate(from);
  if (!ctx) return { ok: false, reason: "unknown_caller" };
  const g = open[gameNumber - 1];
  if (!g) return { ok: false, reason: "bad_game", total_games: open.length };
  await prisma.$transaction([
    prisma.powerPick.deleteMany({ where: { playerId: ctx.player.id, season: ctx.season, week: ctx.week! } }),
    prisma.powerPick.create({ data: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, gameId: g.id, season: ctx.season, week: ctx.week!, rank: 1 } }),
  ]);
  return { ok: true, lock: gameNumber, matchup: `${teamLabel(g.away)} at ${teamLabel(g.home)}` };
}

// TOOL: read_card — the full card for read-back before submitting.
export async function conciergeReadCard(from: string) {
  const { ctx, open } = await openSlate(from);
  if (!ctx) return { ok: false, reason: "unknown_caller" };
  const ans = await answersFor(ctx.player.id, open);
  const pwr = await prisma.powerPick.findFirst({ where: { playerId: ctx.player.id, season: ctx.season, week: ctx.week! }, orderBy: { rank: "asc" } });
  const lockIdx = pwr ? open.findIndex((g) => g.id === pwr.gameId) : -1;
  return {
    ok: true,
    week: ctx.week,
    lock_game: lockIdx >= 0 ? lockIdx + 1 : null,
    incomplete_games: open.map((g, i) => (isComplete(ans.get(g.id) ?? {}) ? null : i + 1)).filter(Boolean),
    card: open.map((g, i) => ({ number: i + 1, matchup: `${teamLabel(g.away)} at ${teamLabel(g.home)}`, pick: describePick(g, ans.get(g.id)), lock: i === lockIdx })),
  };
}

// TOOL: submit_card — lock it in. Ensures a Lock exists, then records the
// submission (same early-lock as the web "Send").
export async function conciergeSubmit(from: string) {
  const { ctx, open } = await openSlate(from);
  if (!ctx) return { ok: false, reason: "unknown_caller" };
  if (!(await prisma.powerPick.count({ where: { playerId: ctx.player.id, season: ctx.season, week: ctx.week! } })))
    await prisma.powerPick.create({ data: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, gameId: open[0].id, season: ctx.season, week: ctx.week!, rank: 1 } });
  await prisma.submission.upsert({
    where: { playerId_season_week: { playerId: ctx.player.id, season: ctx.season, week: ctx.week! } },
    update: {}, create: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, season: ctx.season, week: ctx.week! },
  });
  track({ type: "pick_saved", leagueId: ctx.league.id, playerId: ctx.player.id, season: ctx.season, week: ctx.week!, channel: "voice", meta: { concierge: true, locked: true } });
  return { ok: true, week: ctx.week, message: "Card locked for the week." };
}

export type ConciergeTool = "get_context" | "set_pick" | "set_lock" | "read_card" | "submit_card";

// The Telnyx AI Assistant's system prompt (lean v1 — warm but not overwrought).
export const CONCIERGE_PROMPT = `You are the Office Pick'em League concierge — a warm, quick, football-savvy friend who takes someone's weekly NFL pick'em picks over the phone. You are NOT a customer-service bot; you're the buddy who calls to get their card in.

At the START of every call, call get_context. It returns the caller's name, this week's games with the point spread and total, any picks they've already made, and a little memory (their rank, last week's points). Greet them by name and, if there's memory, reference it lightly and naturally ("last week was a good one — 14 points").

READ THE ROOM. If they sound chatty or unsure, talk a game or two out with them. If they sound rushed ("I've got two minutes"), switch to rapid-fire: name each game and the line, take their pick, move on. Always let them set the pace; offer "want me to rattle through the rest?" if they slow you down.

FOR EACH GAME: say the matchup and the line, then ask who they like. When they answer in plain words, call set_pick with game_number and their exact words as 'spoken' (e.g. "Bills to win and cover, the under"). Confirm briefly ("Bills and the under, got it") and move on. If set_pick returns unclear, ask again simply — don't lecture.

THE LOCK is their single most confident pick (it swings points). Once picks are in, ask which game is their Lock and call set_lock.

BEFORE ENDING: call read_card and read the whole card back, game by game, including the Lock. Ask "sound right?" If they want a change, take it (set_pick again). If any games are incomplete, tell them which and offer to fill them. Only when they clearly confirm ("lock it in", "that's good"), call submit_card. Never submit without an explicit yes.

STYLE: natural, brief, a little banter is welcome; never robotic, never pushy. This is the fun part of someone's week. Keep it moving and make them smile.`;
