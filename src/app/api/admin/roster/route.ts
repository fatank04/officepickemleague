import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCommish } from "@/lib/league";
import { hashPin, colorForIndex } from "@/lib/auth";
import { cleanName, newPin, parseRoster } from "@/lib/admin";
import { sendSms } from "@/lib/sms";
import { leagueLabel } from "@/lib/brand";
import { track } from "@/lib/track";

const RATES = "Msg&data rates may apply. Reply STOP to opt out, HELP for help.";

export async function POST(req: Request) {
  const ctx = await requireCommish();
  if (!ctx) return NextResponse.json({ error: "Commissioner only." }, { status: 403 });
  const { league } = ctx;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  // helper: ensure a target player belongs to THIS league
  async function target(id: string) {
    const p = await prisma.player.findUnique({ where: { id } });
    return p && p.leagueId === league.id ? p : null;
  }

  if (action === "add") {
    const name = cleanName(body.name);
    if (!name) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    const exists = await prisma.player.findUnique({ where: { leagueId_name: { leagueId: league.id, name } } });
    if (exists) return NextResponse.json({ error: "That name is already on the roster." }, { status: 409 });
    const pin = newPin();
    const count = await prisma.player.count({ where: { leagueId: league.id } });
    const p = await prisma.player.create({ data: { leagueId: league.id, name, pinHash: hashPin(pin), color: colorForIndex(count) } });
    track({ type: "player_joined", leagueId: league.id, playerId: p.id, channel: "web", meta: { by: "commish" } });
    return NextResponse.json({ ok: true, playerId: p.id, pin });
  }

  if (action === "rename") {
    const p = await target(body.id); if (!p) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    const name = cleanName(body.name); if (!name) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    const clash = await prisma.player.findUnique({ where: { leagueId_name: { leagueId: league.id, name } } });
    if (clash && clash.id !== p.id) return NextResponse.json({ error: "Another player already has that name." }, { status: 409 });
    await prisma.player.update({ where: { id: p.id }, data: { name } });
    return NextResponse.json({ ok: true });
  }

  if (action === "resetPin") {
    const p = await target(body.id); if (!p) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    const pin = newPin();
    await prisma.player.update({ where: { id: p.id }, data: { pinHash: hashPin(pin), failedPins: 0, lockedUntil: null } });
    return NextResponse.json({ ok: true, pin });
  }

  if (action === "setCommish") {
    const p = await target(body.id); if (!p) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    const make = !!body.value;
    if (!make && p.id === ctx.player.id) return NextResponse.json({ error: "You can't remove your own commissioner access." }, { status: 400 });
    await prisma.player.update({ where: { id: p.id }, data: { isCommish: make } });
    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    const p = await target(body.id); if (!p) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    if (p.id === ctx.player.id) return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 });
    // remove dependent rows first (picks/powerpicks/submissions), then the player
    await prisma.$transaction([
      prisma.pick.deleteMany({ where: { playerId: p.id } }),
      prisma.powerPick.deleteMany({ where: { playerId: p.id } }),
      prisma.submission.deleteMany({ where: { playerId: p.id } }),
      prisma.player.delete({ where: { id: p.id } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "resendSms") {
    const p = await target(body.id); if (!p) return NextResponse.json({ error: "Player not found." }, { status: 404 });
    if (!p.phone) return NextResponse.json({ error: "No mobile number on file." }, { status: 400 });
    if (p.smsOptOut) return NextResponse.json({ error: "This player opted out of texts (STOP)." }, { status: 400 });
    await sendSms(p.phone, `${leagueLabel(league.name)}: you're on the roster, ${p.name}. Reply LINES for this week's games, HELP for commands. ${RATES}`).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  if (action === "bulkAdd") {
    const { rows, errors, duplicatesInList } = parseRoster(body.text);
    if (rows.length === 0) return NextResponse.json({ error: "No valid names found.", errors }, { status: 400 });
    const existing = new Set(
      (await prisma.player.findMany({ where: { leagueId: league.id }, select: { name: true } })).map((p) => p.name.toLowerCase())
    );
    let baseCount = await prisma.player.count({ where: { leagueId: league.id } });
    const created: { name: string; pin: string }[] = [];
    const skipped: string[] = [];
    for (const r of rows) {
      if (existing.has(r.name.toLowerCase())) { skipped.push(r.name); continue; }
      const pin = newPin();
      // NOTE: a phone may be stored, but smsConsentAt is intentionally NOT set — importing a number is not consent.
      await prisma.player.create({
        data: { leagueId: league.id, name: r.name, pinHash: hashPin(pin), color: colorForIndex(baseCount), phone: r.phone ?? undefined },
      });
      baseCount++;
      created.push({ name: r.name, pin });
    }
    track({ type: "roster_bulk_add", leagueId: league.id, playerId: ctx.player.id, channel: "web", meta: { created: created.length, skipped: skipped.length, errors: errors.length } });
    return NextResponse.json({ ok: true, created, skipped, duplicatesInList, errors });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
