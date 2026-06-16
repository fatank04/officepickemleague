import { prisma } from "@/lib/db";
import { parseTextPicks, buildWelcomeSms } from "@/lib/sms";
import { isGameLocked } from "@/lib/league";
import { validateTwilioSignature, hashPin, colorForIndex } from "@/lib/auth";
import { getStandings } from "@/lib/standings";
import { brandOf, welcomeSuffix } from "@/lib/brand";
import { toE164 } from "@/lib/phone";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";

const RATES = "Msg&data rates may apply. Reply STOP to opt out, HELP for help.";
const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;

function twiml(message: string) {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Message></Response>`;
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: Request) {
  const now = new Date();
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  // SECURITY: verify the request really came from Twilio (prevents spoofed picks).
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (token) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const url = process.env.TWILIO_WEBHOOK_URL || `${proto}://${host}${new URL(req.url).pathname}`;
    if (!validateTwilioSignature(token, req.headers.get("x-twilio-signature"), url, params))
      return new Response("Forbidden", { status: 403 });
  } else if (process.env.NODE_ENV === "production") {
    return new Response("SMS not configured", { status: 503 });
  }

  const from = params["From"] || "";
  const raw = (params["Body"] || "").trim();
  const U = raw.toUpperCase();
  const cmd = U.split(/\s+/)[0];

  // ---- Opt-out / opt-in / help (work for any number) ----
  if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(cmd)) {
    const p = await prisma.player.findFirst({ where: { phone: from } });
    if (p) await prisma.player.update({ where: { id: p.id }, data: { smsOptOut: true } });
    return twiml("You're opted out of Office Pick'em texts. Reply START to rejoin.");
  }
  if (["START", "UNSTOP"].includes(cmd)) {
    const p = await prisma.player.findFirst({ where: { phone: from } });
    if (p) await prisma.player.update({ where: { id: p.id }, data: { smsOptOut: false, smsConsentAt: p.smsConsentAt ?? new Date() } });
    return twiml(p ? `You're back in. Reply LINES to see this week's games. ${RATES}` : `Text JOIN <code> <your name> to join a league. ${RATES}`);
  }
  if (["HELP", "INFO", "COMMANDS", "?"].includes(cmd)) {
    return twiml(`Office Pick'em:\nLINES = this week's games\n"1 SEA u  2 LAR o  LOCK 1" = make picks\nMY PICKS · STANDINGS · SCORE\n${RATES}`);
  }

  // ---- SMS-first enrollment: JOIN <code> <name...> ----
  if (cmd === "JOIN") {
    const rest = raw.split(/\s+/).slice(1);
    const code = (rest.shift() || "").toLowerCase();
    const name = rest.join(" ").trim();
    const league = code ? await prisma.league.findUnique({ where: { slug: code } }) : null;
    if (!league) return twiml("Couldn't find that league code. Ask your commissioner, then text: JOIN <code> <your name>.");
    if (!name) return twiml(`Almost! Reply: JOIN ${code} <your name>`);
    const phone = toE164(from) || from;
    let joinPin: string | null = null;
    let player = await prisma.player.findUnique({ where: { leagueId_name: { leagueId: league.id, name } } });
    if (player) await prisma.player.update({ where: { id: player.id }, data: { phone, smsConsentAt: new Date(), smsOptOut: false } });
    else {
      joinPin = String(Math.floor(1000 + Math.random() * 9000));
      const count = await prisma.player.count({ where: { leagueId: league.id } });
      player = await prisma.player.create({
        data: { leagueId: league.id, name, pinHash: hashPin(joinPin), color: colorForIndex(count), phone, smsConsentAt: new Date() },
      });
    }
    track({ type: "player_joined", leagueId: league.id, playerId: player.id, channel: "sms" });
    return twiml(buildWelcomeSms(name, league.name, { pin: joinPin, suffix: welcomeSuffix(brandOf(league as any)) }));
  }

  // ---- Known player required from here ----
  const player = await prisma.player.findFirst({ where: { phone: from }, include: { league: true } });
  if (!player)
    return twiml("We don't recognize this number. Ask your commissioner for the join link, or text: JOIN <code> <your name>.");
  const season = player.league.season;

  const weekRows = await prisma.game.findMany({ where: { season }, orderBy: { week: "asc" }, select: { week: true }, distinct: ["week"] });
  const allWeeks = weekRows.map((w) => w.week);
  let targetWeek: number | null = null;
  for (const week of allWeeks) {
    const wg = await prisma.game.findMany({ where: { season, week } });
    if (wg.some((g) => !isGameLocked(g, now))) { targetWeek = week; break; }
  }
  const refWeek = targetWeek ?? allWeeks[allWeeks.length - 1] ?? null;

  // ---- MY PICKS ----
  if (/^MY ?PICKS/.test(U) || cmd === "MINE") {
    if (refWeek == null) return twiml("No games yet.");
    const wg = await prisma.game.findMany({ where: { season, week: refWeek }, orderBy: { kickoff: "asc" } });
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
    return twiml(`Wk ${refWeek} your picks:\n${lines.join("\n")}`);
  }

  // ---- STANDINGS ----
  if (["STANDINGS", "RANK", "TOP", "BOARD"].includes(cmd)) {
    const view = await getStandings(player.league as any);
    const n = view.rows.length;
    const top = view.rows.slice(0, 5).map((r, i) => `${i + 1}. ${r.name} ${r.pts}`);
    const me = view.rows.findIndex((r) => r.playerId === player.id);
    const meLine = me >= 0 && me >= 5 ? `\n...\nYou: ${ord(me + 1)} of ${n} (${view.rows[me].pts})` : me >= 0 ? `\nYou: ${ord(me + 1)} of ${n}` : "";
    return twiml(`Standings:\n${top.join("\n")}${meLine}`);
  }

  // ---- SCORE ----
  if (["SCORE", "POINTS", "PTS"].includes(cmd)) {
    const view = await getStandings(player.league as any);
    const me = view.rows.findIndex((r) => r.playerId === player.id);
    if (me < 0) return twiml("No score yet — get your picks in!");
    const r = view.rows[me];
    const graded = Object.keys(r.byWeek).map(Number).filter((w) => r.byWeek[w] != null).sort((a, b) => a - b);
    const last = graded.length ? graded[graded.length - 1] : null;
    const lastTxt = last != null ? ` Last week (Wk ${last}): ${(r.byWeek[last] ?? 0) >= 0 ? "+" : ""}${r.byWeek[last]}.` : "";
    return twiml(`You: ${r.pts} pts, ${ord(me + 1)} of ${view.rows.length}.${lastTxt}`);
  }

  // ---- The slate ----
  if (targetWeek == null) return twiml("No open games right now — everything's kicked off.");
  const games = await prisma.game.findMany({ where: { season, week: targetWeek }, orderBy: { kickoff: "asc" } });

  if (/^(LINES|GAMES|SLATE)\b/.test(U)) {
    const lines = games.map((g, i) => `${i + 1}) ${g.away}@${g.home} ${g.home} ${g.homeSpread > 0 ? "+" : ""}${g.homeSpread}, O/U ${g.total}${isGameLocked(g, now) ? " (LOCKED)" : ""}`);
    return twiml(`Wk ${targetWeek}:\n${lines.join("\n")}\nReply e.g.: 1 ${games[0]?.away?.slice(0, 3).toUpperCase()} u  LOCK 1`);
  }

  // ---- Parse picks ----
  const { picks, lockGameId, done, errors } = parseTextPicks(text(raw), games.map((g) => ({ id: g.id, away: g.away, home: g.home })));
  if (!done && !lockGameId)
    return twiml('Couldn\'t read that. Format: "1 SEA u  2 LAR o  LOCK 1". Text LINES for the slate, HELP for commands.');

  const lockedNums = new Set<number>();
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
  if (saved > 0) track({ type: "pick_saved", leagueId: player.leagueId, playerId: player.id, season, week: targetWeek, channel: "sms", meta: { count: saved } });
  if (errors.length) track({ type: "sms_parse_error", leagueId: player.leagueId, playerId: player.id, season, week: targetWeek, channel: "sms", meta: { errors, raw } });

  const lockedNote = lockedNums.size ? ` (already kicked off: ${[...lockedNums].sort((a, b) => a - b).join(", ")})` : "";
  const note = errors.length ? ` (ignored: ${errors.join(", ")})` : "";
  return twiml(`Got it — ${saved} entries${lockSet ? ", Lock set" : ""}${lockedNote}${note}. Reply MY PICKS to review.`);
}

// keep raw text available to the parser without re-trimming
function text(s: string) { return s; }
