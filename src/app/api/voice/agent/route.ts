import { NextResponse } from "next/server";
import { conciergeContext, conciergePick, conciergeLock, conciergeReadCard, conciergeSubmit } from "@/lib/concierge";

export const dynamic = "force-dynamic";

// Webhook target for the Telnyx AI Assistant's tools. Every tool POSTs here with
// { action, from, ... }. `from` is the caller's number (a Telnyx dynamic
// variable in the tool config). Auth: a shared secret the assistant sends as a
// bearer token — set CONCIERGE_TOOL_SECRET in the env and in the tool headers.
export async function POST(req: Request) {
  const secret = process.env.CONCIERGE_TOOL_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Concierge not configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const from = String(body.from || "").trim();
  const action = String(body.action || "");
  if (!from) return NextResponse.json({ ok: false, error: "Missing caller number." }, { status: 400 });

  const gameNumber = Number(body.game_number ?? body.gameNumber);
  const spoken = String(body.spoken ?? body.pick ?? "");

  switch (action) {
    case "get_context":
      return NextResponse.json(await conciergeContext(from));
    case "set_pick":
      return NextResponse.json(await conciergePick(from, gameNumber, spoken));
    case "set_lock":
      return NextResponse.json(await conciergeLock(from, gameNumber));
    case "read_card":
      return NextResponse.json(await conciergeReadCard(from));
    case "submit_card":
      return NextResponse.json(await conciergeSubmit(from));
    default:
      return NextResponse.json({ ok: false, error: `Unknown action "${action}".` }, { status: 400 });
  }
}
