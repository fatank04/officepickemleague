import { TEAMS } from "./teams";

// Parsers for the guided game-by-game SMS pick flow (lib/sms-inbound.ts, PLAY).
// Everything here is pure so it can be unit-tested (guided.test.ts). The flow asks
// one game at a time — "who wins, who covers, over or under?" — and the player
// answers in plain words, often via voice-to-text, so parsing is forgiving:
// nicknames, cities, abbreviations, and loose phrasing all resolve.

export type Side = "home" | "away";
export type OU = "over" | "under";
export type Answer = { su?: Side; ats?: Side; ou?: OU };

export interface FlowGame {
  id: string;
  away: string; // full team name (a TEAMS key)
  home: string;
  homeSpread: number;
  total: number;
}

const words = (t: string): string[] => (t.toLowerCase().match(/[a-z0-9]+/g) ?? []);

// Common colloquial names + frequent voice-to-text mishears, keyed by TEAMS name.
// Unambiguous only — "birds"/"cats" map to more than one team, so they're left out.
const COLLOQUIAL: Record<string, string[]> = {
  "San Francisco 49ers": ["niners", "9ers", "niner"],
  "New England Patriots": ["pats"],
  "Tampa Bay Buccaneers": ["bucs", "buccs", "tampa"],
  "Jacksonville Jaguars": ["jags"],
  "Arizona Cardinals": ["cards"],
  "Miami Dolphins": ["fins", "phins"],
  "Seattle Seahawks": ["hawks"],
  "Dallas Cowboys": ["boys", "cboys"],
  "Green Bay Packers": ["pack"],
  "New York Giants": ["gmen"],
  "Los Angeles Chargers": ["bolts"],
  "Kansas City Chiefs": ["chefs"], // voice-to-text regularly hears "chefs"
};

// Does the text name this team? Match nickname/abbr as whole tokens, city as a
// substring (cities can be two words, e.g. "new england").
export function mentionsTeam(text: string, fullName: string): boolean {
  const t = TEAMS[fullName];
  const lower = text.toLowerCase();
  const w = new Set(words(text));
  const nick = (t?.nick ?? fullName.split(" ").pop() ?? "").toLowerCase();
  const abbr = (t?.abbr ?? "").toLowerCase();
  const city = fullName.slice(0, fullName.length - (t?.nick.length ?? nick.length)).trim().toLowerCase();
  if (nick && w.has(nick)) return true;
  if (abbr && w.has(abbr)) return true;
  if (city && city.length > 2 && lower.includes(city)) return true;
  if ((COLLOQUIAL[fullName] ?? []).some((a) => w.has(a))) return true;
  return false;
}

function readOU(text: string): OU | undefined {
  const t = ` ${text.toLowerCase()} `;
  if (/\bover\b/.test(t) || /\bovers\b/.test(t)) return "over";
  if (/\bunder\b/.test(t) || /\bunders\b/.test(t)) return "under";
  return undefined;
}

// Parse one game's answer. Team named once → win + cover that team (the casual
// default). Two teams named → first is the winner, second the cover. "favorite"/
// "dog" and "home"/"away" also resolve. over/under sets the total.
export function parseGuidedAnswer(text: string, g: FlowGame): Answer {
  const t = ` ${text.toLowerCase()} `;
  const fav: Side = g.homeSpread < 0 ? "home" : "away";
  const dog: Side = fav === "home" ? "away" : "home";
  const ans: Answer = {};

  const ou = readOU(text);
  if (ou) ans.ou = ou;

  const awayHit = mentionsTeam(text, g.away);
  const homeHit = mentionsTeam(text, g.home);
  const sides: Side[] = [];
  // Preserve mention order so "Eagles to win, Cowboys cover" splits correctly.
  if (awayHit || homeHit) {
    const ai = awayHit ? t.search(new RegExp(`\\b${TEAMS[g.away]?.nick.toLowerCase() ?? ""}`)) : -1;
    const hi = homeHit ? t.search(new RegExp(`\\b${TEAMS[g.home]?.nick.toLowerCase() ?? ""}`)) : -1;
    if (awayHit && homeHit) {
      if (ai <= hi) sides.push("away", "home");
      else sides.push("home", "away");
    } else if (awayHit) sides.push("away");
    else sides.push("home");
  } else if (/\bfav(orite)?s?\b|\bchalk\b/.test(t)) sides.push(fav);
  else if (/\bdog\b|\bunderdog\b|\bupset\b/.test(t)) sides.push(dog);
  else if (/\bhome\b/.test(t)) sides.push("home");
  else if (/\baway\b|\broad\b/.test(t)) sides.push("away");

  if (sides.length === 1) { ans.su = sides[0]; ans.ats = sides[0]; }
  else if (sides.length >= 2) { ans.su = sides[0]; ans.ats = sides[1]; }

  return ans;
}

export const isComplete = (a: Answer): boolean => !!a.su && !!a.ats && !!a.ou;

// ---- message formatting (kept here so the flow reads in one place) ----
export const teamLabel = (fullName: string): string => TEAMS[fullName]?.nick ?? fullName;

export function spreadStr(g: FlowGame): string {
  const favName = g.homeSpread < 0 ? g.home : g.away;
  return `${teamLabel(favName)} -${Math.abs(g.homeSpread)}, O/U ${g.total}`;
}

export function askGame(g: FlowGame, idx: number, total: number): string {
  return `Game ${idx + 1}/${total}: ${teamLabel(g.away)} @ ${teamLabel(g.home)}\n${spreadStr(g)}\nWho wins, who covers, over or under?`;
}

// One recap row. su==ats (the casual default) reads "Eagles, under"; a split reads
// "Eagles win / Cowboys cover, under". Blank slots show a dash so gaps are obvious.
export function recapLine(g: FlowGame, idx: number, a: Answer, isLock: boolean): string {
  const nameOf = (s?: Side) => (s ? teamLabel(s === "home" ? g.home : g.away) : null);
  let body: string;
  if (a.su && a.ats && a.su === a.ats) body = nameOf(a.su)!;
  else if (a.su || a.ats) body = [a.su ? `${nameOf(a.su)} win` : null, a.ats ? `${nameOf(a.ats)} cover` : null].filter(Boolean).join(" / ");
  else body = "—";
  if (a.ou) body += `, ${a.ou}`;
  return `${idx + 1}) ${body}${isLock ? " 🔒" : ""}`;
}

// A change at the recap stage. Returns a lock signal, or a target game (by number
// 1..n, else by the team named) plus the re-parsed answer for it.
export function parseGuidedChange(
  text: string,
  games: FlowGame[]
): { lock: true } | { idx: number; answer: Answer } | null {
  const t = text.toLowerCase();
  if (/\block\b|lock it|submit|send it|that'?s? (it|right|good)|all set|finish|done|confirm/.test(t))
    return { lock: true };

  // explicit game number wins
  const numMatch = t.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n >= 1 && n <= games.length) {
      const g = games[n - 1];
      // strip the number so "3 under" doesn't confuse team parsing
      return { idx: n - 1, answer: parseGuidedAnswer(text.replace(numMatch[0], " "), g) };
    }
  }
  // else: the game whose team is named ("flip the Bills to the under")
  for (let i = 0; i < games.length; i++) {
    if (mentionsTeam(text, games[i].away) || mentionsTeam(text, games[i].home)) {
      const a = parseGuidedAnswer(text, games[i]);
      if (a.su || a.ats || a.ou) return { idx: i, answer: a };
    }
  }
  return null;
}
