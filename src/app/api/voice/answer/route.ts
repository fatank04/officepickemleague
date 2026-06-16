import { prisma } from "@/lib/db";
import { isGameLocked } from "@/lib/lock";
import { readTwilioForm, verifyTwilio } from "@/lib/twilio";
import { voiceCtx, xml, say, redirect, hangup } from "@/lib/voice";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const params = await readTwilioForm(req);
  if (verifyTwilio(req, params) === false) return new Response("Forbidden", { status: 403 });

  const u = new URL(req.url);
  const gi = Number(u.searchParams.get("gi") || "0");
  const q = u.searchParams.get("q") || "su";
  const d = params["Digits"] || "";
  const ctx = await voiceCtx(params["From"] || "");
  if (!ctx || ctx.week == null) return xml(say("Sorry, something went wrong. Goodbye.") + hangup());

  const g = ctx.games[gi];
  if (!g) return xml(redirect("/api/voice/game?gi=0&q=su"));
  if (isGameLocked(g)) return xml(redirect(`/api/voice/game?gi=${gi + 1}&q=su`));

  // map keypad -> side; re-ask on an invalid press
  let value: string | null = null;
  if (q === "ou") value = d === "1" ? "over" : d === "2" ? "under" : null;
  else value = d === "1" ? "away" : d === "2" ? "home" : null;
  if (value == null) return xml(say("Sorry, I didn't catch that.") + redirect(`/api/voice/game?gi=${gi}&q=${q}`));

  const field = q === "su" ? { su: value } : q === "ats" ? { ats: value } : { ou: value };
  await prisma.pick.upsert({
    where: { playerId_gameId: { playerId: ctx.player.id, gameId: g.id } },
    update: field,
    create: { leagueId: ctx.player.leagueId, playerId: ctx.player.id, gameId: g.id, ...field },
  });

  // su -> ats -> ou -> next game
  const next = q === "su" ? `gi=${gi}&q=ats` : q === "ats" ? `gi=${gi}&q=ou` : `gi=${gi + 1}&q=su`;
  return xml(redirect(`/api/voice/game?${next}`));
}
