import { validateTwilioSignature } from "./auth";

/** Full request URL INCLUDING query string (Twilio signs the exact action URL it POSTs to). */
export function fullUrl(req: Request): string {
  const u = new URL(req.url);
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}${u.pathname}${u.search}`;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || u.host;
  return `${proto}://${host}${u.pathname}${u.search}`;
}

export async function readTwilioForm(req: Request): Promise<Record<string, string>> {
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);
  return params;
}

/** true = valid, false = invalid (reject), "skip" = no token configured (dev only). */
export function verifyTwilio(req: Request, params: Record<string, string>): boolean | "skip" {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return process.env.NODE_ENV === "production" ? false : "skip";
  return validateTwilioSignature(token, req.headers.get("x-twilio-signature"), fullUrl(req), params);
}
