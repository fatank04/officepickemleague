import { prisma } from "./db";
import { voiceCtx } from "./voice";
import { isGameLocked } from "./league";
import { track } from "./track";
import { parseGuidedAnswer, teamLabel, isComplete, type FlowGame, type Answer } from "./guided";

// The concierge phone line (premium add-on). A Telnyx AI Assistant handles the
// voice + personality; these functions are the webhook TOOLS it calls to read
// and write picks. Pick MECHANICS (slate, parsing, saving, lock, submit) reuse
// the exact same engine as SMS PLAY — this is a voice front-end, not a fork.
// Lean v1: converse → take picks game-by-game → read the card back → submit on
// confirm. NO memory/standings are returned — get_context is deliberately lean for
// latency, and the prompt forbids the agent from inventing any.

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

// Normalize to E.164 (+1XXXXXXXXXX) so it matches how player phones are stored.
function normPhone(s: string): string {
  const d = (s || "").replace(/[^\d]/g, "");
  if (d.length === 11 && d[0] === "1") return "+" + d;
  if (d.length === 10) return "+1" + d;
  if (d.length >= 11 && d.length <= 15) return "+" + d;
  return "";
}

// Find the caller's number no matter where Telnyx puts it: the X-Caller-Number
// header, known body keys, or — as a fallback — any phone number anywhere in the
// payload that ISN'T our own line. Robust to Telnyx's exact tool-call shape.
export function callerFrom(req: Request, body: any): string {
  const own = new Set([process.env.TELNYX_FROM_NUMBER, "+15551234567"].map((n) => normPhone(n || "")).filter(Boolean));
  const ok = (v: unknown) => typeof v === "string" && v && !v.includes("{{") && normPhone(v) && !own.has(normPhone(v));

  const h = req.headers.get("x-caller-number");
  if (ok(h)) return normPhone(h!);
  // Fallback path: ?from=… on the tool URL, in case header interpolation fails.
  try {
    const q = new URL(req.url).searchParams;
    for (const k of ["from", "caller", "caller_number"]) {
      const v = q.get(k);
      if (ok(v)) return normPhone(v!);
    }
  } catch { /* non-absolute URL — ignore */ }
  for (const k of ["from", "telnyx_end_user_target", "caller_number", "call_from", "end_user_target"]) {
    if (ok(body?.[k])) return normPhone(body[k]);
  }
  // Deep fallback: scan the whole payload for the first non-own phone number.
  const found = (JSON.stringify(body ?? {}).match(/\+?1?\d{10,14}/g) || []).map(normPhone).filter((n) => n && !own.has(n));
  return found[0] || "";
}

// Shared dispatch for both endpoint shapes (flat body-action, and /[action] path).
export async function dispatchConcierge(action: string, from: string, gameNumber: number, spoken: string) {
  switch (action) {
    case "get_context": return conciergeContext(from);
    case "set_pick": return conciergePick(from, gameNumber, spoken);
    case "set_lock": return conciergeLock(from, gameNumber);
    case "read_card": return conciergeReadCard(from);
    case "submit_card": return conciergeSubmit(from);
    default: return { ok: false, error: `Unknown action "${action}".` };
  }
}

// The Telnyx AI Assistant's system prompt (lean v1 — warm but not overwrought).
export const CONCIERGE_PROMPT = `You are the Office Pick'em League concierge — a warm, easygoing, football-loving friend who takes someone's weekly NFL picks over the phone. Not a call-center bot; the buddy who rings to get their card in. Talk like a real person: relaxed, a little banter, short sentences, genuine warmth. This should be the fun part of their week.

## The caller's number (required on every tool call)
The caller is phoning from {{telnyx_end_user_target}}. Pass that exact number as the `from`
parameter on EVERY tool call — get_context, set_pick, set_lock, read_card, submit_card. The tools
cannot identify the caller without it and will fail. Never alter it, reformat it, or invent one.

## Never invent anything (most important rule)
Every fact you state about the caller — their name, their league, the week number, the games, the lines, their picks — MUST come from a tool response you actually received. You have NO memory of past calls and NO knowledge of this league.
- NEVER guess or invent a name. If you don't have their name from get_context, don't use one.
- NEVER state a rank, record, standing, points total, or past-week result. You are not given any of that. There is no "you're 12th" — you don't know.
- NEVER invent a week number or a game. Use exactly what get_context returns.
- If a tool call fails, errors, or you get no response: say plainly "I'm having trouble pulling up your league right now — try me again in a minute," and end the call. Do NOT fill the gap with plausible-sounding details. Making something up is far worse than admitting the problem.

## Start
Immediately call get_context (quietly — don't narrate "let me look you up"). It returns: their name, the league name, the week number, total_games, and THIS WEEK'S GAMES with the spread, total, and any pick they've already made. That is the ONLY information you have.
Greet them warmly by the name it returns, say how many games are on this week's slate, then dive in.
- ONLY use the games get_context returns — exactly total_games of them.
- If get_context returns unknown_caller: warmly say you can't find their number on a roster, suggest they text their commissioner for the join link, and wrap up kindly. Don't retry in a loop, and don't guess who they might be.
- If the caller tells you their name, do NOT assume they're a player — you still only know what get_context returned.

## One game at a time
For each game, in order:
1. Say the matchup and the line naturally: "Alright, first up — Bills at Jets, Jets are favored by two and a half, total's forty-four and a half."
2. Ask what they like. Make it easy and mention they can split if they want: "Who've you got — and you can take the same team to win and cover, or split 'em if you're feeling it. Over or under too."
   - They can give you THREE calls (winner, spread, over/under) OR TWO (one team for both winner AND spread, plus the over/under). Whatever they say, pass their exact words to set_pick as 'spoken'.
3. Call set_pick, then READ THE PICK BACK to them in plain football words using what set_pick returns — never say "pick number one." Say: "So that's the Bills to win and cover, and the under — that right?"
4. If they confirm, move on warmly ("Love it. Next one…"). If they want to fix it, take the change (set_pick again) and read it back once more.
Keep it moving — quick and friendly, not an interrogation.

## The Lock
After the last game, ask which one they feel best about — that's their Lock (it's worth extra). Call set_lock and confirm it in one line: "Locking the Bills game as your best bet."

## Finish fast
Because you confirmed each pick as you went, do NOT re-read the whole card at the end — that's slow and they already heard it all. Just ask: "That's the whole card — want me to lock it in?" Only when they clearly say yes, call submit_card. Never submit_card without that clear yes. (If they ever ask what they've got so far, call read_card and rattle it off quickly.)

## End the call
The moment submit_card succeeds, give ONE warm sign-off and END THE CALL immediately — do not wait for or respond to their goodbye. Something like: "You're all in — good luck this week, talk soon!" then hang up. No "okay bye" tennis match.

## Style
Warm, brief, human. A joke or "ooh, bold" is welcome. Never robotic, never pushy, never say "pick number." Let them set the pace — rapid-fire if they're busy, chattier if they want to talk a game out.`;
