import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCommish } from "@/lib/league";
import { cleanName, validHexColor } from "@/lib/admin";

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) || null : null);

export async function POST(req: Request) {
  const ctx = await requireCommish();
  if (!ctx) return NextResponse.json({ error: "Commissioner only." }, { status: 403 });
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = cleanName(body.name);
    if (!name) return NextResponse.json({ error: "Enter a valid league name." }, { status: 400 });
    data.name = name;
  }
  if (body.accentColor !== undefined) {
    if (body.accentColor === null || body.accentColor === "") data.accentColor = null;
    else {
      const c = validHexColor(body.accentColor);
      if (!c) return NextResponse.json({ error: "Accent must be a hex color like #4f8cff." }, { status: 400 });
      data.accentColor = c;
    }
  }
  if (body.prizeText !== undefined) data.prizeText = clip(body.prizeText, 280);
  if (body.welcomeMessage !== undefined) data.welcomeMessage = clip(body.welcomeMessage, 280);
  if (body.logoUrl !== undefined) {
    const u = clip(body.logoUrl, 500);
    if (u && !/^https:\/\//i.test(u)) return NextResponse.json({ error: "Logo URL must start with https://" }, { status: 400 });
    data.logoUrl = u;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  await prisma.league.update({ where: { id: ctx.league.id }, data });
  return NextResponse.json({ ok: true });
}
