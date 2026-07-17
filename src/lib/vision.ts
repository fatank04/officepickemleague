// Vision transcription via OpenRouter (reuses the account already used for video gen).
// Reads OPENROUTER_API_KEY from env; when unset, sheet photos get a graceful "not set up"
// reply instead of an error. Model kept cheap — a pick sheet is a high-contrast form.
//
// Every failure is differentiated so the player is never blamed for a server-side problem:
//   { ok: true, json }            — transcription parsed
//   { ok: false, kind: "media" }  — the photo itself couldn't be fetched (retake/resend)
//   { ok: false, kind: "service" }— our side (config, network, API error) — logged, not the user's fault
//   { ok: false, kind: "parse" }  — model answered but not with usable JSON (treat as unreadable photo)

const MODEL = process.env.SHEET_VISION_MODEL || "anthropic/claude-haiku-4.5";

export type VisionResult =
  | { ok: true; json: any }
  | { ok: false; kind: "media" | "service" | "parse" };

/** Fetch inbound MMS media. Twilio media URLs need basic auth; Telnyx URLs are pre-signed. */
export async function fetchMediaAsDataUrl(url: string, provider: "twilio" | "telnyx"): Promise<string | null> {
  try {
    const headers: Record<string, string> = {};
    if (provider === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN;
      if (sid && tok) headers.Authorization = `Basic ${Buffer.from(`${sid}:${tok}`).toString("base64")}`;
    }
    const res = await fetch(url, { headers, redirect: "follow" });
    if (!res.ok) { console.error(`[sheet] media fetch ${res.status} from ${provider}`); return null; }
    const type = res.headers.get("content-type") || "image/jpeg";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8_000_000) return null; // sanity cap
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch (e) {
    console.error("[sheet] media fetch network error:", (e as Error).message);
    return null;
  }
}

/** Send prompt + image to the vision model. */
export async function transcribeImage(prompt: string, imageDataUrl: string): Promise<VisionResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { ok: false, kind: "service" };
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
  } catch (e) {
    console.error("[sheet] vision network error:", (e as Error).message);
    return { ok: false, kind: "service" };
  }
  if (!res.ok) {
    console.error(`[sheet] vision API ${res.status} (model=${MODEL}):`, (await res.text().catch(() => "")).slice(0, 200));
    return { ok: false, kind: "service" };
  }
  const j = await res.json().catch(() => null);
  const text: string | undefined = j?.choices?.[0]?.message?.content;
  if (!text) return { ok: false, kind: "parse" };
  const m = text.match(/\{[\s\S]*\}/); // tolerate stray prose around the JSON
  if (!m) return { ok: false, kind: "parse" };
  try { return { ok: true, json: JSON.parse(m[0]) }; } catch { return { ok: false, kind: "parse" }; }
}

export const sheetsConfigured = () => Boolean(process.env.OPENROUTER_API_KEY);
