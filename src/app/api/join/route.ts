import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, verifyPin, setSessionCookie, colorForIndex } from "@/lib/auth";
import { track } from "@/lib/track";

const MAX_FAILS = 5;     // wrong PINs before a lockout
const LOCK_MIN = 15;     // lockout duration (minutes)

export async function POST(req: Request) {
  const body = await req.json();
  const { slug, pin } = body;
  const name = (body.name || "").trim();
  if (!slug || !name || !/^\d{4}$/.test(pin || ""))
    return NextResponse.json({ error: "Need league, name, and 4-digit PIN." }, { status: 400 });

  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) return NextResponse.json({ error: "League not found." }, { status: 404 });

  // Case-insensitive + trimmed match avoids silently spawning a duplicate player
  // when a returning user types their name with different casing/spacing.
  let player = await prisma.player.findFirst({ where: { leagueId: league.id, name: { equals: name, mode: "insensitive" } } });
  if (player) {
    // locked out?
    if (player.lockedUntil && player.lockedUntil > new Date()) {
      const mins = Math.max(1, Math.ceil((player.lockedUntil.getTime() - Date.now()) / 60000));
      return NextResponse.json({ error: `Too many wrong PINs. Try again in ${mins} min.` }, { status: 429 });
    }
    if (!verifyPin(pin, player.pinHash)) {
      const fails = (player.failedPins ?? 0) + 1;
      const lock = fails >= MAX_FAILS;
      await prisma.player.update({
        where: { id: player.id },
        data: { failedPins: lock ? 0 : fails, lockedUntil: lock ? new Date(Date.now() + LOCK_MIN * 60000) : null },
      });
      track({ type: "pin_fail", leagueId: league.id, playerId: player.id, meta: { fails, locked: lock } });
      return NextResponse.json(
        { error: lock ? `Too many wrong PINs. Locked for ${LOCK_MIN} min.` : "Wrong PIN for that name." },
        { status: lock ? 429 : 401 }
      );
    }
    // success → clear any failure state
    if (player.failedPins || player.lockedUntil)
      await prisma.player.update({ where: { id: player.id }, data: { failedPins: 0, lockedUntil: null } });
    track({ type: "login", leagueId: league.id, playerId: player.id, channel: "web" });
  } else {
    const count = await prisma.player.count({ where: { leagueId: league.id } });
    player = await prisma.player.create({
      data: { leagueId: league.id, name, pinHash: hashPin(pin), color: colorForIndex(count) },
    });
    track({ type: "player_joined", leagueId: league.id, playerId: player.id, channel: "web" });
  }
  setSessionCookie({ leagueSlug: slug, playerId: player.id });
  return NextResponse.json({ slug, playerId: player.id });
}
