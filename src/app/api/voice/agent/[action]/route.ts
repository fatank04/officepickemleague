import { NextResponse } from "next/server";
import { dispatchConcierge, callerFrom } from "@/lib/concierge";

export const dynamic = "force-dynamic";

// Path-based shape for the Telnyx AI Assistant tools — the action is the last URL
// segment (…/api/voice/agent/set_pick), so it never has to appear in the body.
// Body carries only the model-filled args (game_number, spoken). The caller
// number comes from the X-Caller-Number header (a Telnyx dynamic variable).
export async function POST(req: Request, { params }: { params: { action: string } }) {
  const secret = process.env.CONCIERGE_TOOL_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Concierge not configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const from = callerFrom(req, body);
  console.log(`[concierge] ${params.action} from=${from || "NONE"} hdrCaller=${req.headers.get("x-caller-number") || "-"} bodyKeys=${Object.keys(body || {}).join(",")}${from ? "" : ` body=${JSON.stringify(body).slice(0, 500)}`}`);
  if (!from) return NextResponse.json({ ok: false, error: "Missing caller number." }, { status: 400 });

  return NextResponse.json(
    await dispatchConcierge(params.action, from, Number(body.game_number ?? body.gameNumber), String(body.spoken ?? body.pick ?? ""))
  );
}
