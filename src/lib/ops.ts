import { cookies } from "next/headers";
import crypto from "crypto";

// Founder-level ops console gate (separate from league/player sessions).
// Set OPS_KEY in the environment; the founder enters it once to get a signed cookie.
const SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";
const COOKIE = "sp_ops";
const TOKEN = "ops-ok";

const sign = (p: string) => crypto.createHmac("sha256", SECRET).update(p).digest("base64url");

export function opsAuthed(): boolean {
  const v = cookies().get(COOKIE)?.value;
  if (!v) return false;
  const [p, sig] = v.split(".");
  return p === TOKEN && !!sig && sig === sign(TOKEN);
}
export function setOpsCookie() {
  cookies().set(COOKIE, `${TOKEN}.${sign(TOKEN)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}
export function clearOpsCookie() { cookies().delete(COOKIE); }
export function checkOpsKey(key: string): boolean {
  const real = process.env.OPS_KEY || "";
  if (!real || !key) return false;
  const a = Buffer.from(key), b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
