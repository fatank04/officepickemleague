import { isGameLocked } from "@/lib/lock";
import { readTwilioForm, verifyTwilio } from "@/lib/twilio";
import { voiceCtx, xml, say, gather, redirect, hangup, spreadPhrase, halfWords } from "@/lib/voice";
import { prisma } from "@/lib/db";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (verifyTwilio(req, params) === false) return new Response("Forbidden", { status: 403 });

  const u = new URL(req.url);
  const gi = Number(u.searchParams.get("gi") || "0");
  const q = u.searchParams.get("q") || "su";
  const ctx = await voiceCtx(params["From"] || "");
  if (!ctx || ctx.week == null) return xml(say("Sorry, something went wrong. Goodbye.") + hangup());

  const games = ctx.games;
  if (gi >= games.length) {
    // finished every game -> record the channel pick + offer an optional Lock
    const n = await prisma.pick.count({ where: { playerId: ctx.player.id, game: { season: ctx.season, week: ctx.week } } });
    track({ type: "pick_saved", leagueId: ctx.league.id, playerId: ctx.player.id, season: ctx.season, week: ctx.week, channel: "voice", meta: { mode: "bygame", count: n } });
    return xml(
      gather("/api/voice/lock", "That's every game. To set your Lock, your single most confident pick, press that game's number then the pound key. Or just press pound to finish.", 2, "#")
    );
  }

  const g = games[gi];
  if (isGameLocked(g)) return xml(say(`Game ${gi + 1} has already started, so we'll skip it.`) + redirect(`/api/voice/game?gi=${gi + 1}&q=su`));

  let prompt = "";
  if (q === "su") prompt = `Game ${gi + 1}. ${g.away} at ${g.home}. For the winner: press 1 for ${g.away}, press 2 for ${g.home}.`;
  else if (q === "ats") prompt = `Against the spread, with ${spreadPhrase(g)}: press 1 for ${g.away}, press 2 for ${g.home}.`;
  else prompt = `The total is ${halfWords(g.total)}. Press 1 for the over, press 2 for the under.`;

  return xml(gather(`/api/voice/answer?gi=${gi}&q=${q}`, prompt));
}
