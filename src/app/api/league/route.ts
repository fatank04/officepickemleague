import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, setSessionCookie, colorForIndex } from "@/lib/auth";
import { slugify } from "@/lib/league";
import { track } from "@/lib/track";
import { METRO_HOME_TEAM } from "@/lib/slate";
import { generateJoinCode } from "@/lib/joincode";

// Create a new league + its commissioner player.
export async function POST(req: Request) {
  const { leagueName, commishName, pin, season, kitSlug } = await req.json();
  if (!leagueName || !commishName || !/^\d{4}$/.test(pin || ""))
    return NextResponse.json({ error: "Need league name, your name, and a 4-digit PIN." }, { status: 400 });

  const slug = slugify(leagueName);
  // Kit-launched leagues get their metro's team as the always-on-slate home team.
  let homeTeam: string | null = null;
  if (kitSlug) {
    const kit = await prisma.kitAccount.findUnique({ where: { slug: kitSlug } });
    homeTeam = (kit?.metro && METRO_HOME_TEAM[kit.metro]) || null;
  }
  const league = await prisma.league.create({
    data: { slug, name: leagueName, season: Number(season) || 2026, kitSlug: kitSlug || null, homeTeam, joinCode: await generateJoinCode() },
  });
  const player = await prisma.player.create({
    data: { leagueId: league.id, name: commishName, pinHash: hashPin(pin), color: colorForIndex(0), isCommish: true },
  });
  if (kitSlug) track({ type: "kit_launched", leagueId: league.id, channel: "web", meta: { slug: kitSlug } });
  setSessionCookie({ leagueSlug: slug, playerId: player.id });
  return NextResponse.json({ slug });
}
