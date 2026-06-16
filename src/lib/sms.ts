import { abbr } from "./teams";
import { leagueLabel } from "./brand";

export const RATES = "Msg&data rates may apply. Reply STOP to opt out, HELP for help.";

/** Single source of truth for the welcome text used by both web-enroll and SMS JOIN. */
export function buildWelcomeSms(
  name: string,
  leagueName: string,
  opts: { pin?: string | null; suffix?: string } = {}
): string {
  const pinPart = opts.pin ? ` (Web login PIN: ${opts.pin})` : "";
  const suffix = opts.suffix || "";
  return `Welcome to ${leagueLabel(leagueName)}, ${name}! You're set to play by text. Reply LINES to see this week's games, HELP for commands.${pinPart}${suffix} ${RATES}`;
}

export interface SmsGame {
  id: string;
  away: string; // nickname
  home: string;
}
export interface ParseResult {
  picks: Record<string, { su?: "home" | "away"; ats?: "home" | "away"; ou?: "over" | "under" }>;
  lockGameId: string | null;
  done: number;
  errors: string[];
}

/**
 * Parse a texted pick string against the week's slate (1-indexed).
 * Grammar: "<game#> <TEAM|side> <o/u>"  plus  "LOCK <game#>".
 * Example: "1 SEA u  2 LAR o  3 PIT u  LOCK 9"  (team = winner + spread, o/u = total)
 */
export function parseTextPicks(raw: string, games: SmsGame[]): ParseResult {
  const picks: ParseResult["picks"] = {};
  const toks = raw.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  let gi = -1,
    done = 0;
  let lockGameId: string | null = null;
  const errors: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].toUpperCase();
    if (t === "LOCK" || t === "L") {
      const num = parseInt(toks[i + 1], 10);
      if (num >= 1 && num <= games.length) {
        lockGameId = games[num - 1].id;
        i++;
      }
      continue;
    }
    if (/^\d+$/.test(t)) {
      gi = parseInt(t, 10) - 1;
      continue;
    }
    if (gi < 0 || gi >= games.length) continue;
    const g = games[gi];
    const cur = (picks[g.id] = picks[g.id] || {});
    if (t === "O" || t === "OVER") {
      cur.ou = "over";
      done++;
      continue;
    }
    if (t === "U" || t === "UNDER") {
      cur.ou = "under";
      done++;
      continue;
    }
    if (t === abbr(g.away) || t === g.away.toUpperCase()) {
      cur.su = "away";
      cur.ats = "away";
      done++;
      continue;
    }
    if (t === abbr(g.home) || t === g.home.toUpperCase()) {
      cur.su = "home";
      cur.ats = "home";
      done++;
      continue;
    }
    errors.push(toks[i]);
  }
  return { picks, lockGameId, done, errors };
}

/** Send an SMS via Twilio (no-op if env not configured). */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const svc = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  // A2P 10DLC: prefer sending through the Messaging Service the campaign is attached to,
  // so carriers attribute traffic to the approved campaign. Fall back to a raw from-number.
  if (!sid || !token || (!svc && !from)) return false;
  const { default: twilio } = await import("twilio");
  const opts = svc ? { to, messagingServiceSid: svc, body } : { to, from: from!, body };
  await twilio(sid, token).messages.create(opts);
  return true;
}
