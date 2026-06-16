import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";

// Commissioner manual final entry / override. Body: { gameId, awayScore, homeScore } or { gameId, clear:true }
export async function POST(req: Request) {
  const ctx = await current();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!ctx.player.isCommish) return NextResponse.json({ error: "Commissioner only." }, { status: 403 });

  const { gameId, awayScore, homeScore, clear } = await req.json();
  if (clear) {
    await prisma.game.update({ where: { id: gameId }, data: { awayScore: null, homeScore: null, final: false } });
    return NextResponse.json({ ok: true });
  }
  const a = Number(awayScore),
    h = Number(homeScore);
  if (!Number.isFinite(a) || !Number.isFinite(h))
    return NextResponse.json({ error: "Need both scores." }, { status: 400 });
  await prisma.game.update({ where: { id: gameId }, data: { awayScore: a, homeScore: h, final: true } });
  return NextResponse.json({ ok: true });
}
