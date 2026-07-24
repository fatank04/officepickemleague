// Seed a fully-populated DEMO league for filming the product walkthrough.
// Isolated on a fake season (3000) so it never touches real 2026 data.
// Weeks 1-3 are played (scored standings + insights); week 4 is open (pick UI).
//
// Run:  DATABASE_URL="<your Neon URL>" node scripts/seed-demo.js
// Then sign in at /signin/demo-film  as  "Mike R"  PIN 2468  (commissioner).
// Re-running wipes and rebuilds the demo cleanly.
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const SEASON = 3000;
const SLUG = "demo-film";

// scrypt hash matching src/lib/auth.ts: "<salt>:<scrypt32hex>"
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${dk}`;
}

// Mildly deterministic RNG so re-runs look similar (not required, just tidy).
let _s = 1337;
const rnd = () => ((_s = (_s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

// Players — Doris always wins (house brand rule); Mike R is the viewer/commish.
const PLAYERS = [
  { name: "Mike R", color: "#4f8cff", acc: 0.66, commish: true }, // the person recording
  { name: "Doris K", color: "#f7cf57", acc: 0.82 },              // brand rule: Doris wins
  { name: "Big Tony", color: "#21e08a", acc: 0.7 },
  { name: "Rosa M", color: "#ff7ac2", acc: 0.63 },
  { name: "Deshawn W", color: "#9b7bff", acc: 0.68 },
  { name: "Sue P", color: "#ff9a4d", acc: 0.55 },
  { name: "Carl from Ops", color: "#4dd0e1", acc: 0.48 },
  { name: "Jenny B", color: "#c0ca33", acc: 0.6 },
];

// Realistic matchups (full names must match src/lib/teams.ts). Home listed second.
const SLATE = {
  1: [
    ["Dallas Cowboys", "Philadelphia Eagles"],
    ["Kansas City Chiefs", "Los Angeles Chargers"],
    ["Pittsburgh Steelers", "Cincinnati Bengals"],
    ["Buffalo Bills", "Baltimore Ravens"],
    ["Detroit Lions", "Green Bay Packers"],
    ["San Francisco 49ers", "Seattle Seahawks"],
  ],
  2: [
    ["Philadelphia Eagles", "Kansas City Chiefs"],
    ["New England Patriots", "Miami Dolphins"],
    ["Cincinnati Bengals", "Cleveland Browns"],
    ["Green Bay Packers", "Chicago Bears"],
    ["Los Angeles Rams", "San Francisco 49ers"],
    ["Baltimore Ravens", "Pittsburgh Steelers"],
  ],
  3: [
    ["Kansas City Chiefs", "Buffalo Bills"],
    ["Dallas Cowboys", "New York Giants"],
    ["Detroit Lions", "Minnesota Vikings"],
    ["Houston Texans", "Jacksonville Jaguars"],
    ["Tampa Bay Buccaneers", "New Orleans Saints"],
    ["Seattle Seahawks", "Los Angeles Rams"],
  ],
  4: [
    ["Philadelphia Eagles", "Dallas Cowboys"],
    ["Buffalo Bills", "Miami Dolphins"],
    ["Cincinnati Bengals", "Pittsburgh Steelers"],
    ["San Francisco 49ers", "Los Angeles Rams"],
    ["Green Bay Packers", "Detroit Lions"],
    ["Baltimore Ravens", "Kansas City Chiefs"],
  ],
};

const truth = (g) => ({
  su: g.homeScore > g.awayScore ? "home" : "away",
  ats: g.homeScore - g.awayScore + g.homeSpread > 0 ? "home" : "away",
  ou: g.homeScore + g.awayScore > g.total ? "over" : "under",
});
// with prob acc take the correct side, else the wrong one
const guess = (correct, opts, acc) => (rnd() < acc ? correct : opts.find((o) => o !== correct));

async function main() {
  const DAY = 86400000;
  const now = Date.now();

  // wipe prior demo
  await prisma.league.deleteMany({ where: { slug: SLUG } });
  await prisma.game.deleteMany({ where: { season: SEASON } });

  const league = await prisma.league.create({
    data: {
      slug: SLUG, name: "Riverside Manufacturing", season: SEASON, format: "simple",
      seasonStart: 1, seasonEnd: 18, accentColor: "#4f8cff",
      prizeText: "Bragging rights + the Golden Hard Hat trophy",
    },
  });

  const players = [];
  for (let i = 0; i < PLAYERS.length; i++) {
    const p = PLAYERS[i];
    players.push({
      ...p,
      row: await prisma.player.create({
        data: { leagueId: league.id, name: p.name, pinHash: hashPin("2468"), color: p.color, isCommish: !!p.commish },
      }),
    });
  }

  // Build games. Weeks 1-3 played (past kickoff, final+scores); week 4 open (future).
  const gamesByWeek = {};
  for (const wk of [1, 2, 3, 4]) {
    const played = wk <= 3;
    const kickoff = new Date(now + (played ? -(4 - wk) * 7 * DAY : 3 * DAY));
    gamesByWeek[wk] = [];
    for (const [away, home] of SLATE[wk]) {
      const homeSpread = pick([-6.5, -3.5, -2.5, -1.5, 1.5, 2.5, 3.5]);
      const total = pick([40.5, 43.5, 44.5, 46.5, 47.5, 49.5]);
      const g = await prisma.game.create({
        data: {
          season: SEASON, week: wk, oddsId: `demo-${SEASON}-w${wk}-${away}-${home}`.replace(/\s+/g, ""),
          away, home, homeSpread, total, kickoff,
          final: played,
          awayScore: played ? between(13, 31) : null,
          homeScore: played ? between(13, 31) : null,
        },
      });
      gamesByWeek[wk].push(g);
    }
  }

  // Picks + power picks + submissions.
  let picks = 0;
  for (const pl of players) {
    for (const wk of [1, 2, 3, 4]) {
      const games = gamesByWeek[wk];
      // The viewer's week 4 stays blank so the walkthrough can demo Autofill + Send.
      if (pl.commish && wk === 4) continue;

      for (const g of games) {
        let su, ats, ou;
        if (wk <= 3) {
          const t = truth(g);
          su = guess(t.su, ["home", "away"], pl.acc);
          ats = guess(t.ats, ["home", "away"], pl.acc);
          ou = guess(t.ou, ["over", "under"], pl.acc);
        } else {
          su = pick(["home", "away"]); ats = pick(["home", "away"]); ou = pick(["over", "under"]);
        }
        await prisma.pick.create({ data: { leagueId: league.id, playerId: pl.row.id, gameId: g.id, su, ats, ou } });
        picks++;
      }
      // one Lock (simple format) — star the biggest favorite that week
      const lock = [...games].sort((a, b) => Math.abs(b.homeSpread) - Math.abs(a.homeSpread))[0];
      await prisma.powerPick.create({ data: { leagueId: league.id, playerId: pl.row.id, gameId: lock.id, season: SEASON, week: wk, rank: 1 } });
      await prisma.submission.create({ data: { leagueId: league.id, playerId: pl.row.id, season: SEASON, week: wk } });
    }
  }

  console.log(`\nSeeded demo league "${league.name}"`);
  console.log(`  ${players.length} players, ${picks} picks, weeks 1-3 scored, week 4 open.`);
  console.log(`  Sign in:  https://officepickemleague.com/signin/${SLUG}`);
  console.log(`  Name: "Mike R"   PIN: 2468   (commissioner)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
