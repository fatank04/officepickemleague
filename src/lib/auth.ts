import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
const COOKIE = "sp_session";

// ---- PIN hashing (scrypt; no native deps) ----
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${dk}`;
}
export function verifyPin(pin: string, stored: string): boolean {
  const [salt, dk] = stored.split(":");
  if (!salt || !dk) return false;
  const got = crypto.scryptSync(pin, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(got, "hex"), Buffer.from(dk, "hex"));
}

// ---- Signed session token: { leagueSlug, playerId } ----
export interface Session { leagueSlug: string; playerId: string; }
function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}
export function encodeSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function decodeSession(token?: string | null): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sign(payload) !== sig) return null;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { return null; }
}

// ---- Cookie helpers ----
export function setSessionCookie(s: Session) {
  cookies().set(COOKIE, encodeSession(s), {
    httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", path: "/",
    maxAge: 60 * 60 * 24 * 120,
  });
}
export function clearSessionCookie() { cookies().delete(COOKIE); }
export function getSession(): Session | null { return decodeSession(cookies().get(COOKIE)?.value); }

const PALETTE = ["#1ed47a", "#4f8cff", "#f7cf57", "#f0556a", "#b06bff", "#06b6d4", "#fb923c", "#ec4899"];
export const colorForIndex = (i: number) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length];

/**
 * Validate Twilio's X-Twilio-Signature on an inbound webhook so picks can't be spoofed.
 * data = full request URL + each POST param key+value, sorted by key; HMAC-SHA1 with the Auth Token, base64.
 */
export function validateTwilioSignature(authToken: string, signature: string | null, url: string, params: Record<string, string>): boolean {
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
