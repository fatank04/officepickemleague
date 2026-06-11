import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { current, isGameLocked } from "@/lib/league";
import { track } from "@/lib/track";

// Set one pick field on a game. Body: { gameId, su?, ats?, ou? }
export async function POST(req: Request) {
  const ctx = await current();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { gameId, su, ats, ou } = await req.json();

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.season !== ctx.league.season)
    return NextResponse.json({ error: "Game not found." }, { status: 404 });

  // HARD per-game backstop: this specific game has kicked off.
  if (isGameLocked(game))
    return NextResponse.json({ error: "That game has kicked off — this pick is locked." }, { status: 403 });

  // Voluntary early-lock: if the player submitted their card, keep it locked until they unsubmit.
  const sub = await prisma.submission.findUnique({
    where: { playerId_season_week: { playerId: ctx.player.id, season: game.season, week: game.week } },
  });
  if (sub) return NextResponse.json({ error: "Unsubmit to edit your picks." }, { status: 403 });

  const data: any = {};
  if (su !== undefined) data.su = su;
  if (ats !== undefined) data.ats = ats;
  if (ou !== undefined) data.ou = ou;

  await prisma.pick.upsert({
    where: { playerId_gameId: { playerId: ctx.player.id, gameId } },
    update: data,
    create: { leagueId: ctx.league.id, playerId: ctx.player.id, gameId, ...data },
  });
  track({ type: "pick_saved", leagueId: ctx.league.id, playerId: ctx.player.id, season: game.season, week: game.week, channel: "web" });
  return NextResponse.json({ ok: true });
}
