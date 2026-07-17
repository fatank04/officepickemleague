import { verifyTelnyxSignature } from "@/lib/telnyx";
import { handleInboundSms } from "@/lib/sms-inbound";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

// Inbound SMS webhook — Telnyx transport. Telnyx posts JSON (not form-encoded), signs with
// Ed25519 (not the Twilio HMAC), and ignores response bodies — so replies go back out via the
// messaging API (sendSms), not as TwiML. The message logic is shared with the Twilio route.
export async function POST(req: Request) {
  const raw = await req.text(); // raw body needed for signature verification

  const pub = process.env.TELNYX_WEBHOOK_PUBLIC_KEY;
  if (pub) {
    const ok = verifyTelnyxSignature(
      pub,
      req.headers.get("telnyx-signature-ed25519"),
      req.headers.get("telnyx-timestamp"),
      raw
    );
    if (!ok) return new Response("Forbidden", { status: 403 });
  } else if (process.env.NODE_ENV === "production") {
    return new Response("SMS not configured", { status: 503 });
  }

  let evt: any;
  try { evt = JSON.parse(raw); } catch { return new Response("Bad Request", { status: 400 }); }

  const payload = evt?.data?.payload;
  // Only inbound messages get a reply; ack delivery-status callbacks (message.sent/finalized) with 200.
  if (evt?.data?.event_type !== "message.received") return new Response("", { status: 200 });

  const from = payload?.from?.phone_number || "";
  const text = payload?.text ?? "";
  if (!from) return new Response("", { status: 200 });

  const mediaUrls: string[] = (Array.isArray(payload?.media) ? payload.media : [])
    .map((m: any) => m?.url)
    .filter((u: any) => typeof u === "string");
  const reply = await handleInboundSms(
    from, text, new Date(),
    mediaUrls.length ? { urls: mediaUrls, provider: "telnyx" } : undefined
  );
  // Reply is best-effort: a hard failure (e.g. carrier-level opt-out after STOP) shouldn't 500 the webhook.
  if (reply) { try { await sendSms(from, reply); } catch { /* swallow */ } }
  return new Response("", { status: 200 });
}
