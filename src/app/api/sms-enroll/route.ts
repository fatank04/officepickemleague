import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, colorForIndex } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { sendSms, buildWelcomeSms } from "@/lib/sms";
import { track } from "@/lib/track";
import { brandOf, welcomeSuffix } from "@/lib/brand";

const RATES = "Msg&data rates may apply. Reply STOP to opt out, HELP for help.";

// Enroll a player to play by text. Body: { slug, name, phone, consent }
export async function POST(req: Request) {
  const { slug, name, phone, consent, heard } = await req.json();
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
  const attrib = readAttrib(req.headers.get("cookie"));
  track({ type: "player_joined", leagueId: league.id, playerId: player.id, channel: "web", meta: { heard: heard || null, attrib } });
  // sendSms resolves false when texting isn't configured, and throws on a Twilio API error.
  // Either way the player is enrolled — but the UI must not claim a text was sent when it wasn't.
  const smsSent = await sendSms(
    e164,
    buildWelcomeSms(name.trim(), league.name, { pin, suffix: welcomeSuffix(brand) })
  ).catch(() => false);
  if (!smsSent) track({ type: "welcome_sms_failed", leagueId: league.id, playerId: player.id, channel: "web" });
  // When the welcome text didn't go out, the PIN would otherwise be lost forever (it's only
  // ever delivered in that text) — so return it once for the success screen's web fallback.
  return NextResponse.json({ ok: true, smsSent, pin: smsSent ? null : pin, slug });
}
function readAttrib(cookie: string | null): Record<string, string> | null {
  if (!cookie) return null;
  const m = cookie.split(/; */).find((c) => c.startsWith("op_attrib="));
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m.slice("op_attrib=".length))); } catch { return null; }
}
