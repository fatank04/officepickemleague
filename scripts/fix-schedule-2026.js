// Rewrite the placeholder 2026 game kickoffs to realistic week dates so the
// picks page shows correct dates and lands on Week 1. Anchors Week 1 to the
// real NFL opener (Thu Sep 10, 2026) and spaces each week 7 days out, spreading
// each week's games across Thu / Sun / Mon. Does NOT touch scores or the `final`
// flag. Safe to re-run. The weekly pull-lines cron will later overwrite these
// with the exact schedule once The Odds API posts 2026 lines.
//
// Run:  DATABASE_URL="<your Neon URL>" node scripts/fix-schedule-2026.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SEASON = 2026;
const DAY = 86400000;
// Week 1 Thursday, 20:00 UTC (mid-afternoon ET → the ET calendar day is stable
// regardless of daylight saving, so the displayed date is always the intended day).
const WEEK1_THU = Date.UTC(2026, 8, 10, 20, 0, 0); // month 8 = September

async function main() {
  const games = await prisma.game.findMany({
    where: { season: SEASON },
    orderBy: [{ week: "asc" }, { kickoff: "asc" }],
  });
  if (!games.length) {
    console.log(`No season-${SEASON} games found. Nothing to do.`);
    return;
  }

  const byWeek = new Map();
  for (const g of games) byWeek.set(g.week, [...(byWeek.get(g.week) ?? []), g]);

  let updated = 0;
  for (const [week, wk] of byWeek) {
    const thu = WEEK1_THU + (week - 1) * 7 * DAY;
    const n = wk.length;
    for (let i = 0; i < n; i++) {
      // first game Thursday, last game Monday, everything else Sunday
      const dayOffset = i === 0 ? 0 : i === n - 1 ? 4 : 3;
      const kickoff = new Date(thu + dayOffset * DAY);
      await prisma.game.update({ where: { id: wk[i].id }, data: { kickoff } });
      updated++;
    }
    const span = new Date(thu).toISOString().slice(0, 10) + " → " + new Date(thu + 4 * DAY).toISOString().slice(0, 10);
    console.log(`  Week ${week}: ${n} games  (${span})`);
  }
  console.log(`\nUpdated ${updated} games across ${byWeek.size} weeks. Picks page now lands on Week 1 with correct dates.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
