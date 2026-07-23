// Remove the throwaway load-test data (league + its fake season 4242 games).
// Cascades players/picks/powerpicks/submissions/slate entries.
//   DATABASE_URL="<your Neon URL>" node scripts/cleanup-loadtest.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.league.deleteMany({ where: { slug: "loadtest" } })
  .then(() => prisma.game.deleteMany({ where: { season: 4242 } }))
  .then((g) => console.log(`Removed load-test league + ${g.count} season-4242 games.`))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
