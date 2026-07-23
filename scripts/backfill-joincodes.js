// Give every existing league a memorable two-word join code.
//   DATABASE_URL="<your Neon URL>" node scripts/backfill-joincodes.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const LEFT = ["steel","iron","blue","gold","river","north","south","east","west","red","stone","oak","pine","copper","silver","granite","amber","coal","brick","storm","swift","bold","prime","solid","sharp","true","lucky","wild","brave","big","third","double","triple","long","deep","high","open","clean","quick","sunday"];
const RIGHT = ["crew","shift","squad","yard","dock","floor","bench","huddle","drive","block","anvil","hammer","gear","bolt","rivet","forge","press","line","gate","post","eagle","falcon","bear","wolf","hawk","ram","colt","jet","chief","packer","monday","kickoff","endzone","gridiron","tailgate","playbook","redzone","punt","snap","blitz"];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

(async () => {
  const leagues = await prisma.league.findMany({ where: { joinCode: null }, select: { id: true, name: true, slug: true } });
  if (!leagues.length) return console.log("Every league already has a join code.");
  const taken = new Set((await prisma.league.findMany({ where: { joinCode: { not: null } }, select: { joinCode: true } })).map((l) => l.joinCode));
  for (const l of leagues) {
    let code;
    do { code = `${pick(LEFT)}-${pick(RIGHT)}`; } while (taken.has(code));
    taken.add(code);
    await prisma.league.update({ where: { id: l.id }, data: { joinCode: code } });
    console.log(`  ${l.name} (${l.slug})  →  JOIN ${code} <your name>`);
  }
  console.log(`\nBackfilled ${leagues.length} league(s).`);
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
