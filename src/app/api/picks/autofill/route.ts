import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { current, isGameLocked } from "@/lib/league";
import { track } from "@/lib/track";

// Fill the player's BLANK pick slots for a week. Body: { week, strategy }.
// Never overwrites an existing pick, never touches kicked-off games or a submitted card.
const STRATEGIES = ["favorites", "random", "home"] as const;
type Strategy = (typeof STRATEGIES)[number];

export async function POST(req: Request) {
  const ctx = await current();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { week, strategy } = await req.json();
  if (!STRATEGIES.includes(strategy))
    return NextResponse.json({ error: "Unknown autofill strategy." }, { status: 400 });

  const sub = await prisma.submission.findUnique({
    where: { playerId_season_week: { playerId: ctx.player.id, season: ctx.league.season, week } },
  });
  if (sub) return NextResponse.json({ error: "Unsubmit to edit your picks." }, { status: 403 });

  const now = new Date();
  const games = (
    await prisma.game.findMany({ where: { season: ctx.league.season, week } })
  ).filter((g) => !isGameLocked(g, now));
  if (!games.length) return NextResponse.json({ filled: 0 });

  const picks = await prisma.pick.findMany({
    where: { playerId: ctx.player.id, gameId: { in: games.map((g) => g.id) } },
  });
  const pickMap = new Map(picks.map((p) => [p.gameId, p]));

  const coin = <T,>(a: T, b: T): T => (Math.random() < 0.5 ? a : b);
  const side = (g: { homeSpread: number }, s: Strategy) =>
    s === "random" ? coin("home", "away")
    : s === "home" ? "home"
    : g.homeSpread < 0 ? "home" : "away"; // favorites

  let filled = 0;
  for (const g of games) {
    const p = pickMap.get(g.id);
    const data: any = {};
    if (!p?.su) data.su = side(g, strategy);
    if (!p?.ats) data.ats = side(g, strategy);
    if (!p?.ou) data.ou = coin("over", "under"); // no "favorite" side of a total
    if (!Object.keys(data).length) continue;
    filled += Object.keys(data).length;
    await prisma.pick.upsert({
      where: { playerId_gameId: { playerId: ctx.player.id, gameId: g.id } },
      update: data,
      create: { leagueId: ctx.league.id, playerId: ctx.player.id, gameId: g.id, ...data },
    });
  }
  track({ type: "pick_saved", leagueId: ctx.league.id, playerId: ctx.player.id, season: ctx.league.season, week, channel: "web" });
  return NextResponse.json({ filled });
}
