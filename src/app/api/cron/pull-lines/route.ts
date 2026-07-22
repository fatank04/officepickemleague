import { NextResponse } from "next/server";
import { ingestLines } from "@/lib/odds";
import { fillAiPicks } from "@/lib/ai-players";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron: Wednesdays 14:00 UTC. Protected by CRON_SECRET.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const count = await ingestLines();
    // New lines are up — house bots make their cards for the fresh week.
    const ai = await fillAiPicks();
    return NextResponse.json({ ok: true, ingested: count, aiBots: ai.bots, aiPicks: ai.filled });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
