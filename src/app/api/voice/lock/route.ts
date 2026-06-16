import { prisma } from "@/lib/db";
import { isGameLocked } from "@/lib/lock";
import { readTwilioForm, verifyTwilio } from "@/lib/twilio";
import { voiceCtx, xml, say, hangup } from "@/lib/voice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (verifyTwilio(req, params) === false) return new Response("Forbidden", { status: 403 });

  const ctx = await voiceCtx(params["From"] || "");
  if (!ctx || ctx.week == null) return xml(say("Your picks are in. Goodbye.") + hangup());

  const digits = (params["Digits"] || "").trim();
  const num = Number(digits);
  let confirm = "";
  if (digits && Number.isInteger(num) && num >= 1 && num <= ctx.games.length) {
    const g = ctx.games[num - 1];
    if (g && !isGameLocked(g)) {
      await prisma.$transaction([
        prisma.powerPick.deleteMany({ where: { playerId: ctx.player.id, season: ctx.season, week: ctx.week } }),
        prisma.powerPick.create({ data: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, gameId: g.id, season: ctx.season, week: g.week, rank: 1 } }),
      ]);
      confirm = `Lock set on game ${num}, ${g.away} at ${g.home}. `;
    } else {
      confirm = "That game has already started, so we couldn't Lock it. ";
    }
  }
  return xml(say(`${confirm}Your picks are in. Call back any time before kickoff to change them. Good luck. Goodbye.`) + hangup());
}
