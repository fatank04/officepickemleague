import { prisma } from "./db";
import { filterToSlate } from "@/lib/slate";
import { parseTextPicks, buildWelcomeSms } from "./sms";
import { isGameLocked } from "./league";
import { hashPin, colorForIndex } from "./auth";
import { getStandings } from "./standings";
import { brandOf, welcomeSuffix } from "./brand";
import { toE164 } from "./phone";
import { track } from "./track";
import { ord } from "./ord";
import { abbr } from "./teams";
import { buildSheetPrompt, mapSheetResponse, issueReply, type SheetGame, type SheetResult } from "./sheet";
import { fetchMediaAsDataUrl, transcribeImage, sheetsConfigured } from "./vision";
import { askGame, recapLine, parseGuidedAnswer, parseGuidedChange, isComplete, teamLabel, type FlowGame, type Answer } from "./guided";

const RATES = "Msg&data rates may apply. Reply STOP to opt out, HELP for help.";

type FlowGameRow = FlowGame & { kickoff: string | Date };

// Read the player's saved picks for a week's games as an id→Answer map.
async function readAnswers(playerId: string, games: { id: string }[]): Promise<Map<string, Answer>> {
  const picks = await prisma.pick.findMany({ where: { playerId, gameId: { in: games.map((g) => g.id) } } });
  return new Map(picks.map((p) => [p.gameId, { su: p.su as any, ats: p.ats as any, ou: p.ou as any }]));
}

// Render the next guided step: ask the first game whose card isn't complete (and
// isn't locked), or — when every open game is answered — the full-card recap.
async function guidedStep(
  player: { id: string; leagueId: string; league: { name: string } },
  season: number,
  week: number,
  games: FlowGameRow[],
  now: Date,
  opts: { prefix?: string; recapHeader?: string } = {}
): Promise<string> {
  const prefix = opts.prefix ?? "";
  const open = games.filter((g) => !isGameLocked(g, now));
  if (!open.length) return `${prefix}Every game this week has kicked off — nothing left to pick. Reply STANDINGS to see how you're doing.`;
  const answers = await readAnswers(player.id, open);
  const nextIdx = open.findIndex((g) => !isComplete(answers.get(g.id) ?? {}));
  if (nextIdx >= 0) {
    const pre = prefix || (open.some((g) => answers.get(g.id)) ? "" : `Week ${week} — ${open.length} games, one at a time. Talk to me like a friend (or use the mic 🎤).\n\n`);
    return `${pre}${askGame(open[nextIdx], nextIdx, open.length)}`;
  }
  // All answered → recap + lock prompt.
  const pwr = await prisma.powerPick.findFirst({ where: { playerId: player.id, season, week }, orderBy: { rank: "asc" } });
  const lockId = pwr?.gameId ?? open[0].id; // default the Lock to game 1 until they say otherwise
  const lines = open.map((g, i) => recapLine(g, i, answers.get(g.id) ?? {}, g.id === lockId));
  const header = opts.recapHeader ?? "That's the whole slate ✓ Your card:";
  return `${prefix}${header}\n${lines.join("\n")}\nLock = game ${open.findIndex((g) => g.id === lockId) + 1}. Change any pick in plain words — e.g. "3 under" or "flip the Bills" (say it out loud 🎤) — set your Lock ("lock game 5"), or reply LOCK to send it in.`;
}

export interface InboundMedia {
  urls: string[];
  provider: "twilio" | "telnyx";
}

/** Save a set of picks + optional lock for a player. Shared by text-parse and sheet paths. */
async function applyPicks(
  player: { id: string; leagueId: string },
  season: number,
  targetWeek: number,
  games: { id: string; week: number; home: string; away: string; kickoff: string | Date; [k: string]: any }[],
  picks: Record<string, { su?: string; ats?: string; ou?: string }>,
  lockGameId: string | null,
  now: Date
) {
  const lockedNums = new Set<number>();
  const echo: { idx: number; text: string }[] = [];
  let saved = 0;
  for (const [gameId, p] of Object.entries(picks)) {
    const idx = games.findIndex((x) => x.id === gameId);
    const g = games[idx];
    if (!g) continue;
    if (isGameLocked(g, now)) { lockedNums.add(idx + 1); continue; }
    await prisma.pick.upsert({
      where: { playerId_gameId: { playerId: player.id, gameId } },
      update: p, create: { leagueId: player.leagueId, playerId: player.id, gameId, ...p },
    });
    saved++;
    const seg: string[] = [];
    if (p?.su) seg.push(p.su === "home" ? g.home : g.away);
    if (p?.ats) seg.push((p.ats === "home" ? g.home : g.away) + " sprd");
    if (p?.ou) seg.push(p.ou);
    if (seg.length) echo.push({ idx: idx + 1, text: seg.join(" ") });
  }
  let lockSet = false;
  if (lockGameId) {
    const idx = games.findIndex((x) => x.id === lockGameId);
    const g = games[idx];
    if (g && isGameLocked(g, now)) lockedNums.add(idx + 1);
    else if (g) {
      await prisma.$transaction([
        prisma.powerPick.deleteMany({ where: { playerId: player.id, season, week: targetWeek } }),
        prisma.powerPick.create({ data: { leagueId: player.leagueId, playerId: player.id, gameId: lockGameId, season, week: g.week, rank: 1 } }),
      ]);
      lockSet = true;
    }
  }
  return { saved, lockSet, lockedNums, echo };
}

/** Shared confirmation-card formatting for text and sheet replies — one source, no drift. */
function buildCardEcho(
  res: Awaited<ReturnType<typeof applyPicks>>,
  games: { id: string }[],
  lockGameId: string | null
) {
  const lockedNote = res.lockedNums.size
    ? ` (already kicked off: ${[...res.lockedNums].sort((a, b) => a - b).join(", ")})`
    : "";
  const lockIdx = res.lockSet && lockGameId ? games.findIndex((x) => x.id === lockGameId) + 1 : -1;
  const echoBody = res.echo.length
    ? ":\n" + res.echo.map((e) => `${e.idx}) ${e.text}${e.idx === lockIdx ? " LOCK" : ""}`).join("\n")
    : "";
  return { lockedNote, echoBody };
}

/**
 * Provider-neutral inbound SMS logic. Takes the sender + raw message text and returns the
 * plain-text reply. Transport (signature check, TwiML vs. API reply) is the route's job:
 *   - Twilio  route wraps this in TwiML.
 *   - Telnyx  route sends this via sendSms().
 * Kept identical to the original inline handler so behavior is unchanged across providers.
 */
export async function handleInboundSms(
  from: string,
  rawIn: string,
  now: Date = new Date(),
  media?: InboundMedia
): Promise<string> {
  const raw = (rawIn || "").trim();
  const U = raw.toUpperCase();
  const cmd = U.split(/\s+/)[0];
  const hasPhoto = Boolean(media?.urls?.length);

  // ---- Opt-out / opt-in / help (work for any number) ----
  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(cmd)) {
    const p = await prisma.player.findFirst({ where: { phone: from } });
    if (p) await prisma.player.update({ where: { id: p.id }, data: { smsOptOut: true } });
    return "You're opted out of Office Pick'em texts. Reply START to rejoin.";
  }
  if (["START", "UNSTOP"].includes(cmd)) {
    const p = await prisma.player.findFirst({ where: { phone: from } });
    if (p) await prisma.player.update({ where: { id: p.id }, data: { smsOptOut: false, smsConsentAt: p.smsConsentAt ?? new Date() } });
    return p ? `You're back in. Reply LINES to see this week's games. ${RATES}` : `Text JOIN <code> <your name> to join a league. ${RATES}`;
  }
  // A photo takes priority over caption text: phones attach captions like "my picks",
  // which must not swallow the sheet. Only STOP/START (compliance) outrank a photo.
  if (!hasPhoto && ["HELP", "INFO", "COMMANDS", "?"].includes(cmd)) {
    return `Office Pick'em:\nPLAY = pick game-by-game (easiest)\nLINES = this week's games\n"1 SEA u  2 LAR o  LOCK 1" = quick picks\nMY PICKS · STANDINGS · SCORE\nSupport: help@officepickemleague.com\n${RATES}`;
  }

  // ---- SMS-first enrollment: JOIN <code> <name...> ----
  // With a photo attached, a successful JOIN falls through so the sheet still gets processed.
  let joinPrefix = "";
  if (cmd === "JOIN") {
    const rest = raw.split(/\s+/).slice(1);
    const code = (rest.shift() || "").toLowerCase();
    const name = rest.join(" ").trim();
    const league = code ? await prisma.league.findUnique({ where: { slug: code } }) : null;
    if (!league) return "Couldn't find that league code. Ask your commissioner, then text: JOIN <code> <your name>.";
    if (!name) return `Almost! Reply: JOIN ${code} <your name>`;
    const phone = toE164(from) || from;
    let joinPin: string | null = null;
    let player = await prisma.player.findFirst({ where: { leagueId: league.id, name: { equals: name, mode: "insensitive" } } });
    if (player) await prisma.player.update({ where: { id: player.id }, data: { phone, smsConsentAt: new Date(), smsOptOut: false } });
    else {
      joinPin = String(Math.floor(1000 + Math.random() * 9000));
      const count = await prisma.player.count({ where: { leagueId: league.id } });
      player = await prisma.player.create({
        data: { leagueId: league.id, name, pinHash: hashPin(joinPin), color: colorForIndex(count), phone, smsConsentAt: new Date() },
      });
    }
    track({ type: "player_joined", leagueId: league.id, playerId: player.id, channel: "sms" });
    const welcome = buildWelcomeSms(name, league.name, { pin: joinPin, suffix: welcomeSuffix(brandOf(league as any)) });
    if (!hasPhoto) return welcome;
    joinPrefix = `${welcome}\n\n`;
  }

  // ---- Known player required from here ----
  const player = await prisma.player.findFirst({ where: { phone: from }, include: { league: true } });
  if (!player)
    return hasPhoto
      ? "Got your photo — but we don't recognize this number yet. Text JOIN <league code> <your name> first (it's on your pick sheet), then send the photo again."
      : "We don't recognize this number. Ask your commissioner for the join link, or text: JOIN <code> <your name>.";
  const season = player.league.season;

  const weekRows = await prisma.game.findMany({ where: { season }, orderBy: { week: "asc" }, select: { week: true }, distinct: ["week"] });
  const allWeeks = weekRows.map((w) => w.week);
  // Earliest week with any un-kicked game — one indexed query instead of a per-week scan.
  const firstOpen = await prisma.game.findFirst({
    where: { season, kickoff: { gt: now } },
    orderBy: [{ week: "asc" }],
    select: { week: true },
  });
  const targetWeek: number | null = firstOpen?.week ?? null;
  const refWeek = targetWeek ?? allWeeks[allWeeks.length - 1] ?? null;

  // ---- MY PICKS ----
  if (!hasPhoto && (/^MY ?PICKS/.test(U) || cmd === "MINE")) {
    if (refWeek == null) return "No games yet.";
    const wg = await filterToSlate(player.league, refWeek, await prisma.game.findMany({ where: { season, week: refWeek }, orderBy: { kickoff: "asc" } }));
    const pk = new Map((await prisma.pick.findMany({ where: { playerId: player.id, gameId: { in: wg.map((g) => g.id) } } })).map((p) => [p.gameId, p]));
    const pwr = await prisma.powerPick.findMany({ where: { playerId: player.id, season, week: refWeek }, orderBy: { rank: "asc" } });
    const lockGid = pwr[0]?.gameId;
    const lines = wg.map((g, i) => {
      const p = pk.get(g.id); const parts: string[] = [];
      if (p?.su) parts.push(p.su === "home" ? g.home : g.away);
      if (p?.ats) parts.push((p.ats === "home" ? g.home : g.away) + " sprd");
      if (p?.ou) parts.push(p.ou);
      return `${i + 1}) ${parts.length ? parts.join(" ") : "—"}${g.id === lockGid ? " LOCK" : ""}`;
    });
    return `Wk ${refWeek} your picks:\n${lines.join("\n")}`;
  }

  // ---- STANDINGS ----
  if (!hasPhoto && ["STANDINGS", "RANK", "TOP", "BOARD"].includes(cmd)) {
    const view = await getStandings(player.league as any);
    const n = view.rows.length;
    const top = view.rows.slice(0, 5).map((r, i) => `${i + 1}. ${r.name} ${r.pts}`);
    const me = view.rows.findIndex((r) => r.playerId === player.id);
    const meLine = me >= 0 && me >= 5 ? `\n...\nYou: ${ord(me + 1)} of ${n} (${view.rows[me].pts})` : me >= 0 ? `\nYou: ${ord(me + 1)} of ${n}` : "";
    return `Standings:\n${top.join("\n")}${meLine}`;
  }

  // ---- SCORE ----
  if (!hasPhoto && ["SCORE", "POINTS", "PTS"].includes(cmd)) {
    const view = await getStandings(player.league as any);
    const me = view.rows.findIndex((r) => r.playerId === player.id);
    if (me < 0) return "No score yet — get your picks in!";
    const r = view.rows[me];
    const graded = Object.keys(r.byWeek).map(Number).filter((w) => r.byWeek[w] != null).sort((a, b) => a - b);
    const last = graded.length ? graded[graded.length - 1] : null;
    const lastTxt = last != null ? ` Last week (Wk ${last}): ${(r.byWeek[last] ?? 0) >= 0 ? "+" : ""}${r.byWeek[last]}.` : "";
    return `You: ${r.pts} pts, ${ord(me + 1)} of ${view.rows.length}.${lastTxt}`;
  }

  // ---- The slate ----
  if (targetWeek == null) return hasPhoto ? "Got your sheet — but there are no open games right now; everything's kicked off." : "No open games right now — everything's kicked off.";
  const games = await filterToSlate(player.league, targetWeek, await prisma.game.findMany({ where: { season, week: targetWeek }, orderBy: { kickoff: "asc" } }));

  // ---- Paper sheet photo: transcribe → verify header → save → echo the card back ----
  if (hasPhoto) {
    try {
      if (!sheetsConfigured())
        return `${joinPrefix}Photo received — but sheet reading isn't switched on yet. Text your picks instead, e.g. "1 ${abbr(games[0]?.away ?? "Cowboys")} u". ${RATES}`;

      const toSheetGames = (gs: typeof games): SheetGame[] =>
        gs.map((g, i) => ({ id: g.id, num: i + 1, away: g.away, home: g.home, awayAbbr: abbr(g.away), homeAbbr: abbr(g.home) }));

      const img = await fetchMediaAsDataUrl(media!.urls[0], media!.provider);
      if (!img) return `${joinPrefix}That photo didn't come through. Try sending it again — one photo, whole sheet in the frame. 📸`;

      let weekGames = games;
      let weekUsed = targetWeek;
      let sheetGames = toSheetGames(weekGames);
      let vis = await transcribeImage(buildSheetPrompt(sheetGames), img);
      if (!vis.ok && vis.kind === "service")
        return `${joinPrefix}Your photo came through fine, but we're having trouble reading sheets on our end right now. Hang onto it and try again in a little while — or text your picks like "1 ${sheetGames[0]?.awayAbbr ?? "DAL"}".`;
      if (!vis.ok)
        return `${joinPrefix}Couldn't read that photo. Lay the sheet flat in good light, get the whole page in the shot, and send it once more. 📸`;

      let sheet: SheetResult = mapSheetResponse(vis.json, sheetGames);
      if (sheet.issues.includes("not-a-sheet")) return `${joinPrefix}${issueReply(sheet.issues, sheetGames)!}`;

      // Header verification: the sheet says which week (and league) it was printed for.
      if (sheet.printedCode && sheet.printedCode !== player.league.slug)
        return `${joinPrefix}That sheet is for a different league (code "${sheet.printedCode}" — yours is "${player.league.slug}"). Grab this league's sheet and try again.`;
      if (sheet.printedWeek && sheet.printedWeek !== targetWeek) {
        const otherGames = await filterToSlate(player.league, sheet.printedWeek, await prisma.game.findMany({ where: { season, week: sheet.printedWeek }, orderBy: { kickoff: "asc" } }));
        if (!otherGames.length || !otherGames.some((g) => !isGameLocked(g, now)))
          return `${joinPrefix}That's the Week ${sheet.printedWeek} sheet, but those games ${otherGames.length ? "have all kicked off" : "aren't loaded yet"}. Grab this week's sheet (Week ${targetWeek}) and try again.`;
        // Re-transcribe against the printed week's slate so row numbers map to the right games.
        weekGames = otherGames;
        weekUsed = sheet.printedWeek;
        sheetGames = toSheetGames(weekGames);
        vis = await transcribeImage(buildSheetPrompt(sheetGames), img);
        if (!vis.ok)
          return `${joinPrefix}Couldn't read that photo. Lay the sheet flat in good light, get the whole page in the shot, and send it once more. 📸`;
        sheet = mapSheetResponse(vis.json, sheetGames);
      }

      if (!Object.keys(sheet.picks).length && !sheet.lockGameId)
        return `${joinPrefix}I could read the sheet, but no boxes look marked yet. Check your picks with a pen, then snap it again. 📸`;

      const res = await applyPicks(player, season, weekUsed!, weekGames, sheet.picks, sheet.lockGameId, now);
      if (res.saved > 0 || res.lockSet)
        track({ type: "pick_saved", leagueId: player.leagueId, playerId: player.id, season, week: weekUsed!, channel: "sheet", meta: { count: res.saved, issues: sheet.issues } });

      const extras: string[] = [];
      if (media!.urls.length > 1) extras.push(`P.S. I read your first photo only — if the sheet needed two shots, text the second one on its own.`);
      if (raw && cmd !== "JOIN") extras.push(`P.S. I focused on the photo; if "${raw.slice(0, 40)}" was a command, text it again without the photo.`);
      const extraNote = extras.length ? `\n\n${extras.join("\n")}` : "";
      const lockedNote = res.lockedNums.size ? ` (${[...res.lockedNums].sort((a, b) => a - b).join(", ")} already kicked off)` : "";
      const ack = `Got your sheet ✓ read ${res.saved} pick${res.saved === 1 ? "" : "s"}${lockedNote}`;

      // Drop the player into the guided recap/correction stage — the SAME engine as
      // PLAY — so they can fix picks in plain words (talk-to-text) and reply LOCK.
      // Cross-week sheets (rare) skip this to avoid the flow's stale-week reset.
      if (weekUsed === targetWeek) {
        await prisma.player.update({ where: { id: player.id }, data: { flowWeek: weekUsed! } });
        const openWk = (weekGames as FlowGameRow[]).filter((g) => !isGameLocked(g, now));
        const ans = await readAnswers(player.id, openWk);
        const gaps = openWk.filter((g) => !isComplete(ans.get(g.id) ?? {})).length;
        if (gaps > 0)
          return (await guidedStep(player, season, weekUsed!, weekGames as FlowGameRow[], now,
            { prefix: `${joinPrefix}${ack}. ${gaps} I couldn't read — let's nail ${gaps === 1 ? "it" : "those"} down (just say it, 🎤 works):\n\n` })) + extraNote;
        return (await guidedStep(player, season, weekUsed!, weekGames as FlowGameRow[], now,
          { prefix: joinPrefix, recapHeader: `${ack} — here's every game as I read it:` })) + extraNote;
      }

      const { lockedNote: ln, echoBody } = buildCardEcho(res, weekGames, sheet.lockGameId);
      const problem = issueReply(sheet.issues, sheetGames);
      return `${joinPrefix}${ack.replace(lockedNote, ln)}${echoBody}${problem ? `\n${problem}` : ""}\nReply MY PICKS to review, or text a change like "2 ${sheetGames[1]?.homeAbbr ?? "PHI"}".${extraNote}`;
    } catch (e) {
      console.error("[sheet] unexpected error:", (e as Error).message);
      return `${joinPrefix}Something hiccuped reading your sheet — your photo is fine. Give it another try in a minute. 📸`;
    }
  }

  if (!hasPhoto && /^(LINES|GAMES|SLATE)\b/.test(U)) {
    const lines = games.map((g, i) => `${i + 1}) ${g.away}@${g.home} ${g.home} ${g.homeSpread > 0 ? "+" : ""}${g.homeSpread}, O/U ${g.total}${isGameLocked(g, now) ? " (LOCKED)" : ""}`);
    return `Wk ${targetWeek}:\n${lines.join("\n")}\nReply PLAY to pick game-by-game, or e.g.: 1 ${games[0]?.away?.slice(0, 3).toUpperCase()} u  LOCK 1`;
  }

  // ---- Guided game-by-game flow (PLAY) ----
  const fgames = games as FlowGameRow[];
  const openFlow = fgames.filter((g) => !isGameLocked(g, now));

  // A rolled-over flow (week advanced under a stale flowWeek) resets cleanly.
  if (player.flowWeek != null && player.flowWeek !== targetWeek) {
    await prisma.player.update({ where: { id: player.id }, data: { flowWeek: null } });
    player.flowWeek = null;
  }

  const startFlow = !hasPhoto && ["PLAY", "PICK", "PICKS", "START", "GO", "READY", "DEAL"].includes(cmd) && !/^MY ?PICKS/.test(U);
  if (startFlow) {
    if (!openFlow.length) return "Every game this week has kicked off — nothing to pick right now.";
    await prisma.player.update({ where: { id: player.id }, data: { flowWeek: targetWeek } });
    return guidedStep(player, season, targetWeek, fgames, now);
  }

  if (!hasPhoto && player.flowWeek === targetWeek && openFlow.length) {
    const saveAnswer = async (g: FlowGame, parsed: Answer) => {
      const cur = (await readAnswers(player.id, [g])).get(g.id) ?? {};
      const merged = { su: parsed.su ?? cur.su, ats: parsed.ats ?? cur.ats, ou: parsed.ou ?? cur.ou };
      await prisma.pick.upsert({
        where: { playerId_gameId: { playerId: player.id, gameId: g.id } },
        update: merged, create: { leagueId: player.leagueId, playerId: player.id, gameId: g.id, ...merged },
      });
      track({ type: "pick_saved", leagueId: player.leagueId, playerId: player.id, season, week: targetWeek, channel: "sms", meta: { guided: true } });
    };
    const setLock = async (g: FlowGame) => {
      await prisma.$transaction([
        prisma.powerPick.deleteMany({ where: { playerId: player.id, season, week: targetWeek } }),
        prisma.powerPick.create({ data: { leagueId: player.leagueId, playerId: player.id, gameId: g.id, season, week: targetWeek, rank: 1 } }),
      ]);
    };

    const answers = await readAnswers(player.id, openFlow);
    const cursorIdx = openFlow.findIndex((g) => !isComplete(answers.get(g.id) ?? {}));
    const allDone = cursorIdx < 0;

    // "lock game 5" sets the Lock (works at any stage).
    const lockNum = raw.match(/lock\s*(?:game\s*)?#?\s*(\d{1,2})/i);
    if (lockNum) {
      const n = Number(lockNum[1]);
      if (n >= 1 && n <= openFlow.length) {
        await setLock(openFlow[n - 1]);
        return guidedStep(player, season, targetWeek, fgames, now, { prefix: `Lock set on game ${n} ✓\n\n` });
      }
    }
    // Bare LOCK / "send it" / "done" submits the card (only once it's complete).
    if (/^(lock|lock it in|send( it)?|submit|done|all set|that'?s it|confirm)\b/i.test(raw.trim())) {
      if (!allDone) return guidedStep(player, season, targetWeek, fgames, now, { prefix: "A few games still open 👇\n\n" });
      const pwr = await prisma.powerPick.count({ where: { playerId: player.id, season, week: targetWeek } });
      if (!pwr) await setLock(openFlow[0]); // every card needs a Lock; default to game 1
      await prisma.submission.upsert({
        where: { playerId_season_week: { playerId: player.id, season, week: targetWeek } },
        update: {}, create: { leagueId: player.leagueId, playerId: player.id, season, week: targetWeek },
      });
      await prisma.player.update({ where: { id: player.id }, data: { flowWeek: null } });
      track({ type: "pick_saved", leagueId: player.leagueId, playerId: player.id, season, week: targetWeek, channel: "sms", meta: { guided: true, locked: true } });
      return "Card locked 🔒 You're in for the week. Reply MY PICKS anytime to review, or STANDINGS to see the board. Good luck 🍀";
    }

    if (allDone) {
      // Recap stage: a change can name a game number or a team.
      const chg = parseGuidedChange(raw, openFlow);
      if (chg && "idx" in chg) {
        await saveAnswer(openFlow[chg.idx], chg.answer);
        return guidedStep(player, season, targetWeek, fgames, now, { prefix: "Updated ✓\n\n" });
      }
      return `Didn't catch that. Reply LOCK to send your card, or a change like "3 under" or "flip the ${teamLabel(openFlow[0].home)}".`;
    }

    // Mid-flow: an explicit number targets that game, otherwise the cursor game.
    const numM = raw.match(/^\s*(\d{1,2})\b/);
    let idx = cursorIdx;
    let text = raw;
    if (numM) {
      const n = Number(numM[1]);
      if (n >= 1 && n <= openFlow.length) { idx = n - 1; text = raw.replace(numM[0], " "); }
    }
    const ans = parseGuidedAnswer(text, openFlow[idx]);
    if (!ans.su && !ans.ats && !ans.ou)
      return `Didn't catch a team. ${askGame(openFlow[cursorIdx], cursorIdx, openFlow.length)}`;
    await saveAnswer(openFlow[idx], ans);
    return guidedStep(player, season, targetWeek, fgames, now, { prefix: "Got it ✓\n\n" });
  }

  // ---- Parse picks ----
  const { picks, lockGameId, done, errors } = parseTextPicks(raw, games.map((g) => ({ id: g.id, away: g.away, home: g.home })));
  if (!done && !lockGameId)
    return 'Couldn\'t read that. Format: "1 SEA u  2 LAR o  LOCK 1". Text LINES for the slate, HELP for commands.';

  const res = await applyPicks(player, season, targetWeek, games, picks, lockGameId, now);
  if (res.saved > 0) track({ type: "pick_saved", leagueId: player.leagueId, playerId: player.id, season, week: targetWeek, channel: "sms", meta: { count: res.saved } });
  if (errors.length) track({ type: "sms_parse_error", leagueId: player.leagueId, playerId: player.id, season, week: targetWeek, channel: "sms", meta: { errors, raw } });

  const { lockedNote, echoBody } = buildCardEcho(res, games, lockGameId);
  const note = errors.length ? ` (ignored: ${errors.join(", ")})` : "";
  return `Got it ✓ ${res.saved} saved${res.lockSet ? ", Lock set" : ""}${lockedNote}${note}${echoBody}\nReply MY PICKS to review.`;
}
