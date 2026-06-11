import { prisma } from "./db";
import { nick } from "./teams";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

export interface Final { away: string; home: string; awayScore: number; homeScore: number; final: boolean; }
export interface GradeResult { graded: number; unmatched: Final[]; }

export async function fetchFinals(season: number, week: number): Promise<Final[]> {
  const res = await fetch(`${ESPN}?seasontype=2&week=${week}&dates=${season}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  const data: any = await res.json();
  const out: Final[] = [];
  for (const ev of data.events || []) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors.find((c: any) => c.homeAway === "home");
    const away = comp.competitors.find((c: any) => c.homeAway === "away");
    if (!home || !away) continue;
    out.push({
      home: nick(home.team.displayName), away: nick(away.team.displayName),
      homeScore: Number(home.score), awayScore: Number(away.score),
      final: comp.status?.type?.completed === true,
    });
  }
  return out;
}

/** Write finals into Game rows for a week. Reports ESPN finals that matched NO Game row (silent grading gaps). */
export async function gradeWeek(season: number, week: number): Promise<GradeResult> {
  const finals = await fetchFinals(season, week);
  let graded = 0;
  const unmatched: Final[] = [];
  for (const f of finals) {
    if (!f.final) continue;
    const match = await prisma.game.findFirst({ where: { season, week, home: f.home, away: f.away } });
    if (!match) { unmatched.push(f); continue; } // name mismatch or missing -> would silently never grade
    if (!match.final) {
      await prisma.game.update({ where: { id: match.id }, data: { homeScore: f.homeScore, awayScore: f.awayScore, final: true } });
      graded++;
    }
  }
  return { graded, unmatched };
}
