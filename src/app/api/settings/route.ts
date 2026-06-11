import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";

// Commissioner league settings. Body: partial of
// { format, playoffOn, playoffStart, playoffTeams, seedStep, seasonStart, seasonEnd }
export async function POST(req: Request) {
  const ctx = await current();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!ctx.player.isCommish) return NextResponse.json({ error: "Commissioner only." }, { status: 403 });

  const b = await req.json();
  const data: any = {};
  if (b.format === "simple" || b.format === "ranked") data.format = b.format;
  if (typeof b.playoffOn === "boolean") data.playoffOn = b.playoffOn;
  for (const k of ["playoffStart", "playoffTeams", "seedStep", "seasonStart", "seasonEnd"]) {
    if (b[k] != null) data[k] = Number(b[k]);
  }
  const league = await prisma.league.update({ where: { id: ctx.league.id }, data });
  return NextResponse.json({ ok: true, league });
}
