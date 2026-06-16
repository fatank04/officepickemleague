import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { track } from "@/lib/track";

// Submit or undo a week's card. Body: { week, undo? }
// NOTE: "submit" is now a VOLUNTARY early-lock. The real integrity guarantee is the
// per-game kickoff lock in /api/picks, so submit/undo can be toggled freely — undoing
// only ever re-opens games that haven't started yet.
export async function POST(req: Request) {
  const ctx = await current();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { week, undo } = await req.json();
  const season = ctx.league.season;
  const w = Number(week);

  if (undo) {
    await prisma.submission.deleteMany({ where: { playerId: ctx.player.id, season, week: w } });
    track({ type: "card_unsubmitted", leagueId: ctx.league.id, playerId: ctx.player.id, season, week: w, channel: "web" });
    return NextResponse.json({ ok: true, submitted: false });
  }

  await prisma.submission.upsert({
    where: { playerId_season_week: { playerId: ctx.player.id, season, week: w } },
    update: {},
    create: { leagueId: ctx.league.id, playerId: ctx.player.id, season, week: w },
  });
  track({ type: "card_submitted", leagueId: ctx.league.id, playerId: ctx.player.id, season, week: w, channel: "web" });
  return NextResponse.json({ ok: true, submitted: true });
}
