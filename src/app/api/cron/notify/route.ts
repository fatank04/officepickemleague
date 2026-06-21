import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isGameLocked } from "@/lib/league";
import { getStandings } from "@/lib/standings";
import { sendSms } from "@/lib/sms";
import { leagueLabel } from "@/lib/brand";
import { ord } from "@/lib/ord";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATES = "Reply STOP to opt out.";

// Vercel Cron. ?type=reminder (default) or ?type=results. Texts only consented, opted-in players.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") || "reminder";
  const season = Number(process.env.SEASON || 2026);
  const now = new Date();

  const games = await prisma.game.findMany({ where: { season }, orderBy: [{ week: "asc" }, { kickoff: "asc" }] });
  const byWeek = new Map<number, typeof games>();
  for (const g of games) { const a = byWeek.get(g.week) ?? []; a.push(g); byWeek.set(g.week, a); }
  const weeks = [...byWeek.keys()].sort((a, b) => a - b);
  const eligible = (p: { phone: string | null; smsConsentAt: Date | null; smsOptOut: boolean }) =>
    !!p.phone && !!p.smsConsentAt && !p.smsOptOut;

  let sent = 0;
  const leagues = await prisma.league.findMany({ where: { season } });

  if (type === "reminder") {
    const wk = weeks.find((w) => byWeek.get(w)!.some((g) => !isGameLocked(g, now)));
    if (wk == null) return NextResponse.json({ ok: true, sent: 0, note: "no open week" });
    const wkGameIds = byWeek.get(wk)!.map((g) => g.id);
    // Dedup: never re-nag a player already reminded this week (the cron may run more than once).
    const alreadyReminded = new Set(
      (await prisma.event.findMany({ where: { type: "reminder_sent", season, week: wk }, select: { playerId: true } })).map((r) => r.playerId).filter(Boolean) as string[]
    );
    for (const lg of leagues) {
      const players = await prisma.player.findMany({ where: { leagueId: lg.id } });
      const started = new Set(
        (await prisma.pick.findMany({ where: { leagueId: lg.id, gameId: { in: wkGameIds } }, select: { playerId: true }, distinct: ["playerId"] })).map((r) => r.playerId)
      );
      for (const p of players) {
        if (!eligible(p) || started.has(p.id) || alreadyReminded.has(p.id)) continue;
        await sendSms(p.phone!, `Week ${wk} is live in ${leagueLabel(lg.name)}! Reply LINES to see the games, then text your picks (e.g. "1 SEA u"). Each game locks at kickoff. ${RATES}`).catch(() => {});
        track({ type: "reminder_sent", leagueId: lg.id, playerId: p.id, season, week: wk, channel: "sms" });
        sent++;
      }
    }
    return NextResponse.json({ ok: true, type, week: wk, sent });
  }

  // results: most recent FULLY graded week
  const gradedWeeks = weeks.filter((w) => byWeek.get(w)!.length > 0 && byWeek.get(w)!.every((g) => g.final));
  const wk = gradedWeeks.length ? gradedWeeks[gradedWeeks.length - 1] : null;
  if (wk == null) return NextResponse.json({ ok: true, sent: 0, note: "no fully-graded week" });
  for (const lg of leagues) {
    const already = await prisma.event.count({ where: { leagueId: lg.id, type: "results_sent", week: wk } }).catch(() => 0);
    if (already) continue;
    const view = await getStandings(lg as any);
    const n = view.rows.length;
    for (let i = 0; i < view.rows.length; i++) {
      const r = view.rows[i];
      const pl = await prisma.player.findUnique({ where: { id: r.playerId } });
      if (!pl || !eligible(pl)) continue;
      const wpts = r.byWeek[wk] ?? 0;
      const _base = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
      const _card = _base ? ` Your card: ${_base}/r/${lg.slug}/${pl.id}` : "";
      await sendSms(pl.phone!, `Week ${wk} ${lg.name}: ${wpts >= 0 ? "+" : ""}${wpts} pts. You're ${ord(i + 1)} of ${n} (${r.pts} total).${_card} ${RATES}`).catch(() => {});
      track({ type: "results_sent", leagueId: lg.id, playerId: pl.id, season, week: wk, channel: "sms" });
      sent++;
    }
  }
  return NextResponse.json({ ok: true, type, week: wk, sent });
}
