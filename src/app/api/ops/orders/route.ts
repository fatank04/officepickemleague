import { NextRequest, NextResponse } from "next/server";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";

/**
 * Founder-only status edits from /ops/orders. Deliberately narrow: marking an order charged or
 * canceled is bookkeeping about something that happened in Stripe or the bank — this endpoint
 * never moves money.
 */

const ALLOWED = ["open", "card_on_file", "invoice_requested", "charged", "canceled"];

export async function POST(req: NextRequest) {
  if (!opsAuthed()) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = String(b?.id || "");
  const status = String(b?.status || "");
  if (!id || !ALLOWED.includes(status))
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const updated = await prisma.order.update({ where: { id }, data: { status } }).catch(() => null);
  if (!updated) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
