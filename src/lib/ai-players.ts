import { prisma } from "@/lib/db";
import { isGameLocked } from "@/lib/league";
import { filterSeasonToSlate } from "@/lib/slate";

// House bots a commissioner can add to keep a small league lively. Each has a
// personality that drives its weekly card. Bots can't sign in (unguessable PIN)
// and never get texts (no phone). Picks are filled when the bot is added and
// again by the pull-lines cron whenever a new week's lines post.
export const AI_PERSONAS = {
  chalk: {
    name: "Chalk Bot",
    blurb: "Rides the Vegas favorite every time. Boring, effective, insufferable.",
  },
  upset: {
    name: "Upset Bot",
    blurb: "Lives for the underdog. Wrong a lot, unbearable when it's right.",
  },
  coinflip: {
    name: "Coin Flip Bot",
    blurb: "Pure chance. Somehow still beats half the office most weeks.",
  },
} as const;
export type AiStyle = keyof typeof AI_PERSONAS;

const flip = <T,>(a: T, b: T, pA = 0.5): T => (Math.random() < pA ? a : b);

function pickSides(style: string, homeSpread: number) {
  const fav = homeSpread < 0 ? "home" : "away";
  const dog = fav === "home" ? "away" : "home";
  switch (style) {
    case "chalk":
      return { su: fav, ats: fav, ou: flip("under", "over", 0.6) }; // chalk fades shootouts
    case "upset":
      // Leans dog, not all-dog — a pure underdog card would be a punchline by Week 4.
      return { su: flip(dog, fav, 0.65), ats: flip(dog, fav, 0.75), ou: flip("over", "under", 0.6) };
    default: // coinflip
      return { su: flip("home", "away"), ats: flip("home", "away"), ou: flip("over", "under") };
  }
}

// The bot's LOCK: chalk stars the biggest favorite, upset the closest game, coinflip anything.
function lockGame<T extends { id: string; homeSpread: number }>(style: string, games: T[]): T {
  const bySpread = [...games].sort((a, b) => Math.abs(b.homeSpread) - Math.abs(a.homeSpread));
  if (style === "chalk") return bySpread[0];
  if (style === "upset") return bySpread[bySpread.length - 1];
  return games[Math.floor(Math.random() * games.length)];
}

// Fill blank picks (+ a LOCK + a submission) for AI players. Scope to one player
// or one league, or run league-wide from cron. Only touches open games.
export async function fillAiPicks(opts: { playerId?: string; leagueId?: string } = {}) {
  const bots = await prisma.player.findMany({
    where: { isAI: true, ...(opts.playerId ? { id: opts.playerId } : {}), ...(opts.leagueId ? { leagueId: opts.leagueId } : {}) },
    include: { league: true },
  });
  if (!bots.length) return { bots: 0, filled: 0 };

  const now = new Date();
  let filled = 0;
  for (const bot of bots) {
    const games = (
      await filterSeasonToSlate(
        bot.league,
        await prisma.game.findMany({
          where: { season: bot.league.season, week: { gte: bot.league.seasonStart, lte: bot.league.seasonEnd } },
          orderBy: [{ week: "asc" }, { kickoff: "asc" }],
        })
      )
    ).filter((g) => !isGameLocked(g, now));
    if (!games.length) continue;

    const byWeek = new Map<number, typeof games>();
    for (const g of games) byWeek.set(g.week, [...(byWeek.get(g.week) ?? []), g]);

    for (const [week, wkGames] of byWeek) {
      const existing = await prisma.pick.findMany({ where: { playerId: bot.id, gameId: { in: wkGames.map((g) => g.id) } } });
      const have = new Map(existing.map((p) => [p.gameId, p]));
      for (const g of wkGames) {
        const p = have.get(g.id);
        if (p?.su && p?.ats && p?.ou) continue;
        const s = pickSides(bot.aiStyle ?? "coinflip", g.homeSpread);
        const data = { su: p?.su ?? s.su, ats: p?.ats ?? s.ats, ou: p?.ou ?? s.ou };
        await prisma.pick.upsert({
          where: { playerId_gameId: { playerId: bot.id, gameId: g.id } },
          update: data,
          create: { leagueId: bot.leagueId, playerId: bot.id, gameId: g.id, ...data },
        });
        filled++;
      }
      const nPower = await prisma.powerPick.count({ where: { playerId: bot.id, season: bot.league.season, week } });
      if (!nPower) {
        const lg = lockGame(bot.aiStyle ?? "coinflip", wkGames);
        await prisma.powerPick.create({
          data: { leagueId: bot.leagueId, playerId: bot.id, gameId: lg.id, season: bot.league.season, week, rank: 1 },
        });
      }
      await prisma.submission.upsert({
        where: { playerId_season_week: { playerId: bot.id, season: bot.league.season, week } },
        update: {},
        create: { leagueId: bot.leagueId, playerId: bot.id, season: bot.league.season, week },
      });
    }
  }
  return { bots: bots.length, filled };
}
