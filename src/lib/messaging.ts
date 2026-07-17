// Provider-agnostic SMS sending layer.
//
// Flip providers with the SMS_PROVIDER env var — no code change, no redeploy of logic:
//   twilio-10dlc   (default) send through the A2P 10DLC Messaging Service; falls back
//                  to TWILIO_FROM_NUMBER if no service SID is set (preserves prior behavior).
//   twilio-tollfree send from a verified toll-free number (TWILIO_TOLLFREE_NUMBER,
//                  or TWILIO_FROM_NUMBER as a fallback) — sidesteps 10DLC registration.
//   telnyx         send via Telnyx (TELNYX_API_KEY + messaging profile or from-number).
//
// Contract preserved across every provider: sendSms() resolves false when the selected
// provider isn't configured (a no-op), and THROWS on a real send error. The request
// builders below are pure so provider selection and payload shape can be unit-tested
// without touching the network.

export type SmsProviderKey = "twilio-10dlc" | "twilio-tollfree" | "telnyx";

type Env = Record<string, string | undefined>;

/** Resolve the active provider from SMS_PROVIDER. Unset/unknown => twilio-10dlc (prior default). */
export function resolveProviderKey(env: Env = process.env): SmsProviderKey {
  switch ((env.SMS_PROVIDER || "").trim().toLowerCase()) {
    case "twilio-tollfree":
    case "tollfree":
      return "twilio-tollfree";
    case "telnyx":
      return "telnyx";
    default:
      return "twilio-10dlc";
  }
}

// ---- Twilio (10DLC + toll-free share one API; only the sender differs) ----

export type TwilioCreateOpts = { to: string; body: string } & (
  | { messagingServiceSid: string }
  | { from: string }
);

/** Build the twilio.messages.create() options, or null if no sender is configured. */
export function buildTwilioOpts(
  to: string,
  body: string,
  key: SmsProviderKey,
  env: Env = process.env
): TwilioCreateOpts | null {
  if (key === "twilio-tollfree") {
    const from = env.TWILIO_TOLLFREE_NUMBER || env.TWILIO_FROM_NUMBER;
    return from ? { to, body, from } : null;
  }
  // twilio-10dlc: prefer the Messaging Service the campaign is attached to so carriers
  // attribute traffic to the approved campaign; fall back to a raw from-number.
  const svc = env.TWILIO_MESSAGING_SERVICE_SID;
  if (svc) return { to, body, messagingServiceSid: svc };
  const from = env.TWILIO_FROM_NUMBER;
  return from ? { to, body, from } : null;
}

// ---- Telnyx ----

export interface TelnyxRequest {
  url: string;
  headers: Record<string, string>;
  body: string;
}

/** Build the Telnyx v2/messages HTTP request, or null if unconfigured. */
export function buildTelnyxRequest(to: string, body: string, env: Env = process.env): TelnyxRequest | null {
  const apiKey = env.TELNYX_API_KEY;
  const profile = env.TELNYX_MESSAGING_PROFILE_ID;
  const from = env.TELNYX_FROM_NUMBER;
  if (!apiKey || (!profile && !from)) return null;
  const payload: Record<string, string> = { to, text: body };
  if (profile) payload.messaging_profile_id = profile;
  if (from) payload.from = from;
  return {
    url: "https://api.telnyx.com/v2/messages",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

// ---- Configuration probe (for the /ops console + graceful no-op) ----

/** True when the active provider has enough env to actually send. */
export function isSmsConfigured(env: Env = process.env): boolean {
  const key = resolveProviderKey(env);
  if (key === "telnyx") return buildTelnyxRequest("+10000000000", "x", env) != null;
  const sender = buildTwilioOpts("+10000000000", "x", key, env);
  return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && sender);
}

/** Which provider is active and whether it's ready — handy for diagnostics. */
export function smsProviderStatus(env: Env = process.env): { provider: SmsProviderKey; configured: boolean } {
  return { provider: resolveProviderKey(env), configured: isSmsConfigured(env) };
}

/**
 * The phone number to SHOW humans (printed sheets, UI). Follows the active provider's
 * sending number so it can't silently diverge from the number that receives texts;
 * NEXT_PUBLIC_SMS_NUMBER acts only as an explicit display override (e.g. a pretty format).
 */
export function displaySmsNumber(env: Env = process.env): string | null {
  if (env.NEXT_PUBLIC_SMS_NUMBER) return env.NEXT_PUBLIC_SMS_NUMBER;
  const key = resolveProviderKey(env);
  if (key === "telnyx") return env.TELNYX_FROM_NUMBER || null;
  if (key === "twilio-tollfree") return env.TWILIO_TOLLFREE_NUMBER || env.TWILIO_FROM_NUMBER || null;
  return env.TWILIO_FROM_NUMBER || null;
}

// ---- Send ----

/**
 * Send one SMS via the configured provider.
 * @returns false when the provider isn't configured (no-op). @throws on a real send error.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const env = process.env as Env;
  const key = resolveProviderKey(env);

  if (key === "telnyx") {
    const req = buildTelnyxRequest(to, body, env);
    if (!req) return false;
    const res = await fetch(req.url, { method: "POST", headers: req.headers, body: req.body });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Telnyx send failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    return true;
  }

  // twilio-10dlc / twilio-tollfree
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const opts = buildTwilioOpts(to, body, key, env);
  if (!sid || !token || !opts) return false;
  const { default: twilio } = await import("twilio");
  await twilio(sid, token).messages.create(opts);
  return true;
}
