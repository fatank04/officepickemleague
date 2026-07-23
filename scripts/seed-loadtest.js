// Seed a DISPOSABLE league for load/concurrency testing. Isolated on a fake
// season (4242) so it never touches real or demo data. Creates N players with a
// known uniform PIN so the load runner can sign them all in, plus two weeks of
// games (week 1 open for picks, week 2 later). Re-running wipes and rebuilds.
//
//   DATABASE_URL="<pooled Neon URL>" LT_PLAYERS=200 node scripts/seed-loadtest.js
//
// Prints the slug + player name pattern + PIN for scripts/loadtest.mjs.
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const SEASON = 4242;
const SLUG = "loadtest";
const PIN = "0000";
const N = Number(process.env.LT_PLAYERS || 200);

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pin, salt, 32).toString("hex")}`;
}

const TEAMS = ["Dallas Cowboys","Philadelphia Eagles","Kansas City Chiefs","Buffalo Bills","San Francisco 49ers",
  "Baltimore Ravens","Detroit Lions","Green Bay Packers","Miami Dolphins","Cincinnati Bengals","Pittsburgh Steelers",
  "Cleveland Browns","Los Angeles Rams","Seattle Seahawks","Minnesota Vikings","Chicago Bears"];

async function main() {
  const DAY = 86400000, now = Date.now();
  await prisma.league.deleteMany({ where: { slug: SLUG } });
  await prisma.game.deleteMany({ where: { season: SEASON } });

  const league = await prisma.league.create({
    data: { slug: SLUG, name: "Load Test League", season: SEASON, format: "simple", seasonStart: 1, seasonEnd: 18, homeTeam: "Pittsburgh Steelers" },
  });

  // Two weeks of games. Week 1 kicks off in 3 days (open for picks); week 2 later.
  for (const wk of [1, 2]) {
    const thu = now + (wk === 1 ? 3 : 10) * DAY;
    for (let i = 0; i < TEAMS.length; i += 2) {
      await prisma.game.create({
        data: {
          season: SEASON, week: wk, oddsId: `lt-${SEASON}-w${wk}-${i}`,
          away: TEAMS[i], home: TEAMS[i + 1], homeSpread: [-6.5, -3.5, -1.5, 2.5, 1.5][i / 2 % 5], total: [40.5, 44.5, 47.5][i / 2 % 3],
          kickoff: new Date(thu + (i / 2) * 3600000),
        },
      });
    }
  }

  const rows = [];
  for (let i = 1; i <= N; i++) {
    rows.push({ leagueId: league.id, name: `LT${String(i).padStart(4, "0")}`, pinHash: hashPin(PIN), color: "#4f8cff", isCommish: i === 1 });
  }
  // createMany can't hash per-row, so we built rows above; insert in chunks.
  for (let i = 0; i < rows.length; i += 100) {
    await prisma.player.createMany({ data: rows.slice(i, i + 100) });
  }

  console.log(`\nSeeded load-test league:`);
  console.log(`  slug=${SLUG}  season=${SEASON}  players=${N}  pin=${PIN}`);
  console.log(`  player names: LT0001 … LT${String(N).padStart(4, "0")}`);
  console.log(`\nRun the load test:`);
  console.log(`  LT_PLAYERS=${N} CONCURRENCY=150 node scripts/loadtest.mjs\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
