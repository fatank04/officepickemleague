import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gradeWeek } from "@/lib/espn";
import { sendSms } from "@/lib/sms";
import { track } from "@/lib/track";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron: hourly on game days. Grades past, ungraded games — and ALERTS on grading gaps.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const season = Number(process.env.SEASON || 2026);

  const pending = await prisma.game.findMany({
    where: { season, final: false, kickoff: { lt: new Date() } },
    select: { week: true }, distinct: ["week"],
  });

  let graded = 0;
  const gaps: string[] = [];
  for (const { week } of pending) {
    try {
      const r = await gradeWeek(season, week);
      graded += r.graded;
      for (const u of r.unmatched) gaps.push(`Wk${week} ${u.away}@${u.home}`);
    } catch { /* one bad week shouldn't stop the rest */ }
  }

  // Stuck: kicked off > 6h ago and still not final (likely a feed/name-match problem).
  const stale = await prisma.game.count({
    where: { season, final: false, kickoff: { lt: new Date(Date.now() - 6 * 3600 * 1000) } },
  });

  if (gaps.length || stale > 0) {
    track({ type: "grade_gap", season, meta: { unmatched: gaps, staleCount: stale } });
    const phone = process.env.ALERT_PHONE;
    if (phone) {
      await sendSms(phone, `OPL grade alert: ${gaps.length} unmatched ESPN finals${gaps.length ? ` [${gaps.slice(0, 5).join("; ")}]` : ""}; ${stale} stale ungraded.`).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, weeksChecked: pending.length, gamesGraded: graded, unmatched: gaps, staleUngraded: stale });
}
