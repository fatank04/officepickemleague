import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCommish } from "@/lib/league";
import { clearSessionCookie } from "@/lib/auth";
import { track } from "@/lib/track";

// Danger zone: permanently delete this league.
// Body: { action: "delete", confirmName } — confirmName must match the league name exactly
// (case-insensitive, trimmed) so a stray click can never wipe a season.
// League relations cascade (players, picks, submissions, power picks), and Event rows have
// no FK — so the audit trail survives, including the league_deleted event we write first.
export async function POST(req: Request) {
  const ctx = await requireCommish();
  if (!ctx) return NextResponse.json({ error: "Commissioner only." }, { status: 403 });
  const { league, player } = ctx;

  const body = await req.json().catch(() => ({}));
  if (body.action !== "delete")
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if ((body.confirmName || "").trim().toLowerCase() !== league.name.trim().toLowerCase())
    return NextResponse.json({ error: "Type the league name exactly to confirm." }, { status: 400 });

  // Write the audit event BEFORE the delete (awaited directly — track() is fire-and-forget,
  // and we want this row committed even though the league row is about to go).
  await prisma.event
    .create({
      data: {
        type: "league_deleted",
        leagueId: league.id,
        playerId: player.id,
        channel: "web",
        meta: { name: league.name, slug: league.slug },
      },
    })
    .catch(() => {});

  await prisma.league.delete({ where: { id: league.id } });
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
