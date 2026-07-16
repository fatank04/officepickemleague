// Run: npx tsx src/lib/telnyx.test.ts
import crypto from "crypto";
import { verifyTelnyxSignature } from "./telnyx";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

// Real Ed25519 keypair; export the raw 32-byte public key the way Telnyx hands it to you (base64).
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const spki = publicKey.export({ format: "der", type: "spki" });
const pubB64 = Buffer.from(spki.subarray(spki.length - 32)).toString("base64");

const ts = "1700000000";
const nowMs = 1_700_000_000_000;
const body = '{"data":{"event_type":"message.received","payload":{"from":{"phone_number":"+14125551234"},"text":"LINES"}}}';
const sign = (t: string, b: string) => crypto.sign(null, Buffer.from(`${t}|${b}`, "utf8"), privateKey).toString("base64");
const sig = sign(ts, body);

eq("valid signature verifies", verifyTelnyxSignature(pubB64, sig, ts, body, { nowMs }), true);
eq("tampered body rejected", verifyTelnyxSignature(pubB64, sig, ts, body + " ", { nowMs }), false);
eq("tampered timestamp rejected", verifyTelnyxSignature(pubB64, sig, "1700000001", body, { nowMs }), false);
eq("garbage signature rejected", verifyTelnyxSignature(pubB64, "abcd", ts, body, { nowMs }), false);

const other = crypto.generateKeyPairSync("ed25519");
const otherPub = Buffer.from(other.publicKey.export({ format: "der", type: "spki" }).subarray(-32)).toString("base64");
eq("wrong public key rejected", verifyTelnyxSignature(otherPub, sig, ts, body, { nowMs }), false);

eq("stale timestamp rejected (outside tolerance)", verifyTelnyxSignature(pubB64, sig, ts, body, { nowMs: nowMs + 400_000 }), false);
eq("fresh within tolerance accepted", verifyTelnyxSignature(pubB64, sig, ts, body, { nowMs: nowMs + 120_000 }), true);

eq("missing signature header rejected", verifyTelnyxSignature(pubB64, null, ts, body, { nowMs }), false);
eq("missing timestamp header rejected", verifyTelnyxSignature(pubB64, sig, null, body, { nowMs }), false);
eq("missing public key rejected", verifyTelnyxSignature(undefined, sig, ts, body, { nowMs }), false);
eq("non-numeric timestamp rejected", verifyTelnyxSignature(pubB64, sig, "not-a-number", body, { nowMs }), false);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
