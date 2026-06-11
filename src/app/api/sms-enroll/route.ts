import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, colorForIndex } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { sendSms } from "@/lib/sms";
import { track } from "@/lib/track";
import { brandOf, welcomeSuffix } from "@/lib/brand";

const RATES = "Msg&data rates may apply. Reply STOP to opt out, HELP for help.";

// Enroll a player to play by text. Body: { slug, name, phone, consent }
export async function POST(req: Request) {
  const { slug, name, phone, consent } = await req.json();
  if (!slug || !name?.trim() || !phone?.trim())
    return NextResponse.json({ error: "Name and mobile number are required." }, { status: 400 });
  if (!consent) return NextResponse.json({ error: "Please check the consent box to receive texts." }, { status: 400 });

  const e164 = toE164(phone);
  if (!e164) return NextResponse.json({ error: "Enter a valid U.S. mobile number." }, { status: 400 });

  const league = await prisma.league.findUnique({ where: { slug } });
  if (!league) return NextResponse.json({ error: "League not found." }, { status: 404 });

  const brand = brandOf(league as any);
  let player = await prisma.player.findUnique({ where: { leagueId_name: { leagueId: league.id, name: name.trim() } } });
  let pin: string | null = null;
  if (player) {
    await prisma.player.update({ where: { id: player.id }, data: { phone: e164, smsConsentAt: new Date(), smsOptOut: false } });
  } else {
    pin = String(Math.floor(1000 + Math.random() * 9000));
    const count = await prisma.player.count({ where: { leagueId: league.id } });
    player = await prisma.player.create({
      data: { leagueId: league.id, name: name.trim(), pinHash: hashPin(pin), color: colorForIndex(count), phone: e164, smsConsentAt: new Date() },
    });
  }
  track({ type: "player_joined", leagueId: league.id, playerId: player.id, channel: "web" });
  await sendSms(
    e164,
    `Welcome to ${league.name} Pick'em, ${name.trim()}! You're set to play by text. Reply LINES to see this week's games, HELP for commands.${pin ? ` (Web login PIN: ${pin})` : ""}${welcomeSuffix(brand)} ${RATES}`
  ).catch(() => {});
  return NextResponse.json({ ok: true });
}
