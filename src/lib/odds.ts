import { prisma } from "./db";
import { halfify } from "./scoring";
import { nick } from "./teams";
import { planIngest } from "./lock";

const ODDS_URL =
  "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?regions=us&markets=spreads,totals&oddsFormat=american";

const ANCHOR = process.env.SEASON_ANCHOR || "2026-09-10T00:00:00Z";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Estimate the NFL week (1-18) from kickoff. Weeks run Thursday -> Wednesday. */
export function nflWeek(kickoff: Date): number {
  const days = (kickoff.getTime() - new Date(ANCHOR).getTime()) / 86_400_000;
  return Math.min(18, Math.max(1, Math.floor((days + 3) / 7) + 1));
}

interface RawOutcome { name: string; point?: number }
interface RawMarket { key: string; outcomes: RawOutcome[] }
interface RawEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: { markets: RawMarket[] }[];
}

export interface NormalizedGame {
  oddsId: string; season: number; week: number; away: string; home: string;
  homeSpread: number; total: number; kickoff: Date;
}

export function normalize(events: RawEvent[], season: number): NormalizedGame[] {
  const out: NormalizedGame[] = [];
  for (const e of events) {
    const spreads: number[] = [];
    const totals: number[] = [];
    for (const bk of e.bookmakers || []) {
      for (const m of bk.markets || []) {
        if (m.key === "spreads") {
          const h = m.outcomes.find((o) => o.name === e.home_team);
          if (h?.point != null) spreads.push(h.point);
        }
        if (m.key === "totals") {
          const ov = m.outcomes.find((o) => o.name === "Over");
          if (ov?.point != null) totals.push(ov.point);
        }
      }
    }
    if (!spreads.length || !totals.length) continue;
    const kickoff = new Date(e.commence_time);
    out.push({
      oddsId: e.id, season, week: nflWeek(kickoff),
      away: nick(e.away_team), home: nick(e.home_team),
      homeSpread: halfify(Math.round(median(spreads) * 2) / 2),
      total: halfify(Math.round(median(totals) * 2) / 2),
      kickoff,
    });
  }
  return out;
}

export async function fetchEvents(): Promise<RawEvent[]> {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY not set");
  const res = await fetch(`${ODDS_URL}&apiKey=${key}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Odds API ${res.status}`);
  return res.json();
}

/** Pull this week's lines and upsert Game rows. The line is FROZEN at first ingestion. Returns count newly created. */
export async function ingestLines(season = Number(process.env.SEASON || 2026)): Promise<number> {
  const games = normalize(await fetchEvents(), season);
  const now = new Date();
  let created = 0;
  for (const g of games) {
    const existing = await prisma.game.findUnique({ where: { oddsId: g.oddsId }, select: { kickoff: true } });
    const plan = planIngest(existing, now);
    if (plan === "create") {
      await prisma.game.create({
        data: {
          oddsId: g.oddsId, season: g.season, week: g.week,
          away: g.away, home: g.home,
          homeSpread: g.homeSpread, total: g.total, kickoff: g.kickoff,
        },
      });
      created++;
    } else if (plan === "update") {
      // Allow flex-scheduling kickoff change ONLY. The line is never touched.
      await prisma.game.update({ where: { oddsId: g.oddsId }, data: { kickoff: g.kickoff, week: g.week } });
    }
    // plan === "skip": game already kicked off -> never modify
  }
  return created;
}
