import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { current, isGameLocked } from "@/lib/league";

// Toggle a Power Pick on a game. Body: { gameId }
export async function POST(req: Request) {
  const ctx = await current();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { gameId } = await req.json();

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });

  // Per-game lock: can't add/remove a Power Pick on a game that has started.
  if (isGameLocked(game)) return NextResponse.json({ error: "That game has kicked off — locked." }, { status: 403 });

  const max = ctx.league.format === "ranked" ? 3 : 1;
  const key = { leagueId: ctx.league.id, playerId: ctx.player.id, season: game.season, week: game.week };

  const existing = await prisma.powerPick.findMany({
    where: { playerId: ctx.player.id, season: game.season, week: game.week },
    orderBy: { rank: "asc" },
  });
  const has = existing.find((p) => p.gameId === gameId);
  let next = existing.map((p) => p.gameId);
  if (has) next = next.filter((g) => g !== gameId);
  else if (max === 1) next = [gameId];
  else if (next.length < max) next.push(gameId);
  else return NextResponse.json({ error: `Max ${max} Power Picks.` }, { status: 400 });

  await prisma.$transaction([
    prisma.powerPick.deleteMany({ where: { playerId: ctx.player.id, season: game.season, week: game.week } }),
    ...next.map((gid, i) => prisma.powerPick.create({ data: { ...key, gameId: gid, rank: i + 1 } })),
  ]);
  return NextResponse.json({ ok: true, power: next });
}
