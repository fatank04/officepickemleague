import { validateTwilioSignature } from "@/lib/auth";
import { handleInboundSms } from "@/lib/sms-inbound";

export const dynamic = "force-dynamic";

function twiml(message: string) {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Message></Response>`;
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}

// Inbound SMS webhook — Twilio transport. Verifies the Twilio signature, then hands off to
// the provider-neutral handler and replies with TwiML. Telnyx has its own route at ./telnyx.
export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  // SECURITY: verify the request really came from Twilio (prevents spoofed picks).
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (token) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const url = process.env.TWILIO_WEBHOOK_URL || `${proto}://${host}${new URL(req.url).pathname}`;
    if (!validateTwilioSignature(token, req.headers.get("x-twilio-signature"), url, params))
      return new Response("Forbidden", { status: 403 });
  } else if (process.env.NODE_ENV === "production") {
    return new Response("SMS not configured", { status: 503 });
  }

  const reply = await handleInboundSms(params["From"] || "", params["Body"] || "");
  return twiml(reply);
}
