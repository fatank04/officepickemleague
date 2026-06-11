import { readTwilioForm, verifyTwilio } from "@/lib/twilio";
import { voiceCtx, xml, say, gather, hangup } from "@/lib/voice";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (verifyTwilio(req, params) === false) return new Response("Forbidden", { status: 403 });

  const from = params["From"] || "";
  const ctx = await voiceCtx(from);
  if (!ctx)
    return xml(say("Welcome to Office Pick em. We don't recognize this number yet. Please sign up by text or on the web, then call back. Goodbye.") + hangup());

  if (ctx.week == null)
    return xml(say(`Hi ${ctx.player.name}. There are no open games right now. Call back once the new week's lines are posted. Goodbye.`) + hangup());

  track({ type: "voice_call", leagueId: ctx.league.id, playerId: ctx.player.id, season: ctx.season, week: ctx.week, channel: "voice" });

  const menu = "Press 1 to make your picks one game at a time. Press 2 to auto pick the whole week in one step. Press 3 to hear your score. Press 0 to repeat this menu.";
  return xml(say(`Hi ${ctx.player.name}. Welcome to ${ctx.league.name} pick em, week ${ctx.week}.`) + gather("/api/voice/menu", menu));
}
