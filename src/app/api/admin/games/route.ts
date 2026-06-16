import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCommish } from "@/lib/league";
import { parseScore, parseLine } from "@/lib/admin";
import { isGameLocked } from "@/lib/lock";
import { gradeWeek } from "@/lib/espn";
import { track } from "@/lib/track";

export async function POST(req: Request) {
  const ctx = await requireCommish();
  if (!ctx) return NextResponse.json({ error: "Commissioner only." }, { status: 403 });
  const season = ctx.league.season;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  async function game(id: string) {
    const g = await prisma.game.findUnique({ where: { id } });
    return g && g.season === season ? g : null;
  }

  // Correct/enter a final score (safe: standings are derived & recompute automatically)
  if (action === "setScore") {
    const g = await game(body.id); if (!g) return NextResponse.json({ error: "Game not found." }, { status: 404 });
    const away = parseScore(body.awayScore), home = parseScore(body.homeScore);
    if (away == null || home == null) return NextResponse.json({ error: "Scores must be whole numbers 0–200." }, { status: 400 });
    await prisma.game.update({ where: { id: g.id }, data: { awayScore: away, homeScore: home, final: true } });
    track({ type: "admin_score_set", leagueId: ctx.league.id, playerId: ctx.player.id, season, week: g.week, meta: { gameId: g.id, away, home } });
    return NextResponse.json({ ok: true });
  }

  // Flip the final flag (e.g. un-final a wrongly-graded game so a regrade can re-pull it)
  if (action === "setFinal") {
    const g = await game(body.id); if (!g) return NextResponse.json({ error: "Game not found." }, { status: 404 });
    await prisma.game.update({ where: { id: g.id }, data: { final: !!body.value } });
    return NextResponse.json({ ok: true });
  }

  // Re-run ESPN grading for a week (idempotent; picks up corrected feeds)
  if (action === "regrade") {
    const week = Number(body.week);
    if (!Number.isInteger(week)) return NextResponse.json({ error: "Bad week." }, { status: 400 });
    const res = await gradeWeek(season, week);
    track({ type: "admin_regrade", leagueId: ctx.league.id, playerId: ctx.player.id, season, week, meta: { graded: res.graded, unmatched: res.unmatched.length } });
    return NextResponse.json({ ok: true, graded: res.graded, unmatched: res.unmatched });
  }

  // Manually enter/fix a line ONLY before kickoff AND only if no picks exist (preserves the frozen line)
  if (action === "setLine") {
    const g = await game(body.id); if (!g) return NextResponse.json({ error: "Game not found." }, { status: 404 });
    if (isGameLocked(g)) return NextResponse.json({ error: "That game has kicked off — the line is locked." }, { status: 403 });
    const picks = await prisma.pick.count({ where: { gameId: g.id } });
    if (picks > 0) return NextResponse.json({ error: "Picks already exist — the line is frozen and can't be changed." }, { status: 409 });
    const homeSpread = parseLine(body.homeSpread, 40), total = parseLine(body.total, 100);
    if (homeSpread == null || total == null) return NextResponse.json({ error: "Enter valid half-point numbers (e.g. -3.5, 44.5)." }, { status: 400 });
    await prisma.game.update({ where: { id: g.id }, data: { homeSpread, total } });
    track({ type: "admin_line_set", leagueId: ctx.league.id, playerId: ctx.player.id, season, week: g.week, meta: { gameId: g.id, homeSpread, total } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
