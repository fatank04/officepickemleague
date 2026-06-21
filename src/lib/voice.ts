import { isGameLocked } from "./lock";

// ---- TwiML builders ----
export function xml(inner: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, { headers: { "Content-Type": "text/xml" } });
}
const esc = (s: string) => s.replace(/&/g, "and").replace(/</g, " ").replace(/>/g, " ");
export const say = (t: string) => `<Say voice="Polly.Joanna">${esc(t)}</Say>`;
export function gather(action: string, prompt: string, numDigits = 1, finishOnKey?: string) {
  const fin = finishOnKey ? ` finishOnKey="${finishOnKey}"` : "";
  return `<Gather input="dtmf" numDigits="${numDigits}" action="${action}" method="POST" timeout="8"${fin}>${say(prompt)}</Gather>`;
}
export const redirect = (path: string) => `<Redirect method="POST">${path}</Redirect>`;
export const hangup = () => `<Hangup/>`;

// ---- phrasing ----
export function halfWords(n: number): string {
  const a = Math.abs(n), whole = Math.floor(a), half = a - whole >= 0.5;
  return half ? (whole === 0 ? "a half" : `${whole} and a half`) : `${whole}`;
}
export const favoriteSide = (homeSpread: number): "home" | "away" => (homeSpread < 0 ? "home" : "away");
export function spreadPhrase(g: { home: string; away: string; homeSpread: number }): string {
  return g.homeSpread < 0 ? `${g.home} favored by ${halfWords(g.homeSpread)}` : `${g.away} favored by ${halfWords(g.homeSpread)}`;
}
export { ord } from "./ord";

// ---- one-tap auto-pick methods (mirror the web quick-pick) ----
export function applyMethod(method: string, g: { homeSpread: number }): { su: string; ats: string; ou: string } {
  const fav = favoriteSide(g.homeSpread), dog = fav === "home" ? "away" : "home";
  switch (method) {
    case "fav": return { su: fav, ats: fav, ou: "over" };
    case "home": return { su: "home", ats: "home", ou: "over" };
    case "dog": return { su: dog, ats: dog, ou: "under" };
    default: { const r = () => (Math.random() < 0.5); return { su: r() ? "home" : "away", ats: r() ? "home" : "away", ou: r() ? "over" : "under" }; }
  }
}
export const methodName: Record<string, string> = { fav: "the favorites", home: "the home teams", dog: "the underdogs", random: "a random card" };

// ---- call context: identify caller + the current open week's games ----
export async function voiceCtx(from: string) {
  const { prisma } = await import("./db");
  const player = await prisma.player.findFirst({ where: { phone: from }, include: { league: true } });
  if (!player) return null;
  const season = player.league.season;
  const weekRows = await prisma.game.findMany({ where: { season }, orderBy: { week: "asc" }, select: { week: true }, distinct: ["week"] });
  let week: number | null = null;
  for (const w of weekRows.map((r) => r.week)) {
    const wg = await prisma.game.findMany({ where: { season, week: w } });
    if (wg.some((g) => !isGameLocked(g))) { week = w; break; }
  }
  const games = week != null ? await prisma.game.findMany({ where: { season, week }, orderBy: { kickoff: "asc" } }) : [];
  return { player, league: player.league, season, week, games };
}
