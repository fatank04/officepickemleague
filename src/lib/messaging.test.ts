// Run: npx tsx src/lib/messaging.test.ts
import {
  displaySmsNumber,
  resolveProviderKey,
  buildTwilioOpts,
  buildTelnyxRequest,
  isSmsConfigured,
  smsProviderStatus,
} from "./messaging";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}
function truthy(label: string, got: unknown) { eq(label, Boolean(got), true); }

// ---- provider selection ----
eq("unset => twilio-10dlc (prior default)", resolveProviderKey({}), "twilio-10dlc");
eq("unknown => twilio-10dlc", resolveProviderKey({ SMS_PROVIDER: "carrier-pigeon" }), "twilio-10dlc");
eq("explicit twilio-10dlc", resolveProviderKey({ SMS_PROVIDER: "twilio-10dlc" }), "twilio-10dlc");
eq("twilio-tollfree", resolveProviderKey({ SMS_PROVIDER: "twilio-tollfree" }), "twilio-tollfree");
eq("tollfree alias", resolveProviderKey({ SMS_PROVIDER: "tollfree" }), "twilio-tollfree");
eq("telnyx", resolveProviderKey({ SMS_PROVIDER: "telnyx" }), "telnyx");
eq("case + whitespace insensitive", resolveProviderKey({ SMS_PROVIDER: "  TELNYX " }), "telnyx");

// ---- twilio-10dlc sender selection ----
eq("10dlc prefers messaging service",
  buildTwilioOpts("+1412", "hi", "twilio-10dlc", { TWILIO_MESSAGING_SERVICE_SID: "MG1", TWILIO_FROM_NUMBER: "+1855" }),
  { to: "+1412", body: "hi", messagingServiceSid: "MG1" });
eq("10dlc falls back to from-number (prior behavior)",
  buildTwilioOpts("+1412", "hi", "twilio-10dlc", { TWILIO_FROM_NUMBER: "+1855" }),
  { to: "+1412", body: "hi", from: "+1855" });
eq("10dlc unconfigured => null",
  buildTwilioOpts("+1412", "hi", "twilio-10dlc", {}), null);

// ---- twilio-tollfree sender selection ----
eq("tollfree uses toll-free number",
  buildTwilioOpts("+1412", "hi", "twilio-tollfree", { TWILIO_TOLLFREE_NUMBER: "+1855", TWILIO_MESSAGING_SERVICE_SID: "MG1" }),
  { to: "+1412", body: "hi", from: "+1855" });
eq("tollfree falls back to TWILIO_FROM_NUMBER",
  buildTwilioOpts("+1412", "hi", "twilio-tollfree", { TWILIO_FROM_NUMBER: "+1999" }),
  { to: "+1412", body: "hi", from: "+1999" });
eq("tollfree ignores messaging service (won't use 10DLC sender)",
  buildTwilioOpts("+1412", "hi", "twilio-tollfree", { TWILIO_MESSAGING_SERVICE_SID: "MG1" }), null);

// ---- telnyx request shape ----
const t = buildTelnyxRequest("+1412", "hi", { TELNYX_API_KEY: "KEY", TELNYX_MESSAGING_PROFILE_ID: "P1" });
eq("telnyx url", t?.url, "https://api.telnyx.com/v2/messages");
eq("telnyx bearer auth", t?.headers.Authorization, "Bearer KEY");
eq("telnyx json content-type", t?.headers["Content-Type"], "application/json");
eq("telnyx body carries profile + to + text",
  t && JSON.parse(t.body),
  { to: "+1412", text: "hi", messaging_profile_id: "P1" });
eq("telnyx from-number only",
  (() => { const r = buildTelnyxRequest("+1412", "hi", { TELNYX_API_KEY: "K", TELNYX_FROM_NUMBER: "+1855" }); return r && JSON.parse(r.body); })(),
  { to: "+1412", text: "hi", from: "+1855" });
eq("telnyx no api key => null", buildTelnyxRequest("+1412", "hi", { TELNYX_MESSAGING_PROFILE_ID: "P1" }), null);
eq("telnyx key but no sender => null", buildTelnyxRequest("+1412", "hi", { TELNYX_API_KEY: "K" }), null);

// ---- configuration probe ----
eq("unconfigured => false", isSmsConfigured({}), false);
truthy("10dlc configured", isSmsConfigured({ TWILIO_ACCOUNT_SID: "AC", TWILIO_AUTH_TOKEN: "tok", TWILIO_MESSAGING_SERVICE_SID: "MG1" }));
eq("10dlc without creds => false", isSmsConfigured({ TWILIO_MESSAGING_SERVICE_SID: "MG1" }), false);
truthy("telnyx configured", isSmsConfigured({ SMS_PROVIDER: "telnyx", TELNYX_API_KEY: "K", TELNYX_FROM_NUMBER: "+1855" }));
eq("status reports active provider",
  smsProviderStatus({ SMS_PROVIDER: "telnyx", TELNYX_API_KEY: "K", TELNYX_FROM_NUMBER: "+1855" }),
  { provider: "telnyx", configured: true });

// ---- display number follows the active provider ----
eq("display: explicit override wins", displaySmsNumber({ NEXT_PUBLIC_SMS_NUMBER: "(412) 555-0100", TELNYX_FROM_NUMBER: "+1999" }), "(412) 555-0100");
eq("display: telnyx provider number", displaySmsNumber({ SMS_PROVIDER: "telnyx", TELNYX_FROM_NUMBER: "+1888" }), "+1888");
eq("display: tollfree falls back to from", displaySmsNumber({ SMS_PROVIDER: "twilio-tollfree", TWILIO_FROM_NUMBER: "+1777" }), "+1777");
eq("display: nothing configured -> null", displaySmsNumber({}), null);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
