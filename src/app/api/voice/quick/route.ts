import { prisma } from "@/lib/db";
import { isGameLocked } from "@/lib/lock";
import { readTwilioForm, verifyTwilio } from "@/lib/twilio";
import { voiceCtx, xml, say, hangup, applyMethod, methodName } from "@/lib/voice";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (verifyTwilio(req, params) === false) return new Response("Forbidden", { status: 403 });

  const ctx = await voiceCtx(params["From"] || "");
  if (!ctx || ctx.week == null) return xml(say("Sorry, something went wrong. Goodbye.") + hangup());

  const method = ({ "1": "fav", "2": "home", "3": "dog", "4": "random" } as Record<string, string>)[params["Digits"] || ""] || "fav";

  let n = 0;
  for (const g of ctx.games) {
    if (isGameLocked(g)) continue;
    const p = applyMethod(method, g);
    await prisma.pick.upsert({
      where: { playerId_gameId: { playerId: ctx.player.id, gameId: g.id } },
      update: { su: p.su, ats: p.ats, ou: p.ou },
      create: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, gameId: g.id, su: p.su, ats: p.ats, ou: p.ou },
    });
    n++;
  }
  track({ type: "pick_saved", leagueId: ctx.league.id, playerId: ctx.player.id, season: ctx.season, week: ctx.week, channel: "voice", meta: { mode: "quick", method, count: n } });

  const locked = ctx.games.length - n;
  const note = locked > 0 ? ` ${locked} game${locked === 1 ? " was" : "s were"} already started and left alone.` : "";
  return xml(
    say(`Done. We picked ${methodName[method]} for ${n} game${n === 1 ? "" : "s"}.${note} Your picks are in. Call back any time before kickoff to change them. Goodbye.`) + hangup()
  );
}
