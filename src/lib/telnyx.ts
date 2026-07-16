import crypto from "crypto";

// SPKI DER prefix for a raw 32-byte Ed25519 public key (RFC 8410). Telnyx hands you the public
// key base64-encoded (raw 32 bytes) in the portal; Node's crypto needs it wrapped as SPKI DER.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Verify a Telnyx webhook signature.
 * Telnyx signs `${timestamp}|${rawBody}` with Ed25519 and sends the signature (base64) in the
 * `telnyx-signature-ed25519` header and the unix-seconds timestamp in `telnyx-timestamp`.
 *
 * @param publicKeyB64 base64 raw Ed25519 public key from the Telnyx portal
 * @param signatureB64 the `telnyx-signature-ed25519` header
 * @param timestamp    the `telnyx-timestamp` header (unix seconds)
 * @param rawBody      the exact raw request body string
 */
export function verifyTelnyxSignature(
  publicKeyB64: string | undefined,
  signatureB64: string | null,
  timestamp: string | null,
  rawBody: string,
  opts: { toleranceSec?: number; nowMs?: number } = {}
): boolean {
  if (!publicKeyB64 || !signatureB64 || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const toleranceSec = opts.toleranceSec ?? 300;
  const nowSec = (opts.nowMs ?? Date.now()) / 1000;
  if (Math.abs(nowSec - ts) > toleranceSec) return false; // stale / replayed
  try {
    const rawKey = Buffer.from(publicKeyB64, "base64");
    if (rawKey.length !== 32) return false;
    const key = crypto.createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, rawKey]),
      format: "der",
      type: "spki",
    });
    const signed = Buffer.from(`${timestamp}|${rawBody}`, "utf8");
    return crypto.verify(null, signed, key, Buffer.from(signatureB64, "base64"));
  } catch {
    return false;
  }
}
