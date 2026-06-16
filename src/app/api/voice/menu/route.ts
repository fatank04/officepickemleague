import { readTwilioForm, verifyTwilio } from "@/lib/twilio";
import { voiceCtx, xml, say, gather, redirect, hangup, ord } from "@/lib/voice";
import { getStandings } from "@/lib/standings";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (verifyTwilio(req, params) === false) return new Response("Forbidden", { status: 403 });

  const d = params["Digits"] || "";
  const ctx = await voiceCtx(params["From"] || "");
  if (!ctx || ctx.week == null) return xml(say("Sorry, something went wrong. Goodbye.") + hangup());

  if (d === "1") return xml(redirect("/api/voice/game?gi=0&q=su"));
  if (d === "2")
    return xml(gather("/api/voice/quick", "Auto pick. Press 1 for all the favorites. Press 2 for all the home teams. Press 3 for all the underdogs. Press 4 for a random card."));
  if (d === "3") {
    const view = await getStandings(ctx.league as any);
    const i = view.rows.findIndex((r: any) => r.playerId === ctx.player.id);
    const line =
      i < 0
        ? "You haven't scored any points yet. Make some picks to get on the board."
        : `You have ${view.rows[i].pts} points, in ${ord(i + 1)} place out of ${view.rows.length}.`;
    const menu = "Press 1 to make your picks. Press 2 to auto pick. Press 0 to repeat. Or hang up when you're done.";
    return xml(say(line) + gather("/api/voice/menu", menu));
  }
  const menu = "Press 1 to make your picks one game at a time. Press 2 to auto pick the whole week. Press 3 to hear your score. Press 0 to repeat.";
  return xml(gather("/api/voice/menu", menu));
}
