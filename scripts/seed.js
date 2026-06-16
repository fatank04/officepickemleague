// Seed one league + a commissioner so /l/<slug> and /j/<slug> exist.
// Run after `prisma db push`:  node prisma/seed.js
// Env (optional): SEED_SLUG, SEED_LEAGUE, SEED_PIN, SEASON
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

// Matches src/lib/auth.ts hashPin: "<salt>:<scrypt32hex>"
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${dk}`;
}

async function main() {
  const slug = process.env.SEED_SLUG || "demo";
  const name = process.env.SEED_LEAGUE || "Office Pick'em Demo";
  const pin = process.env.SEED_PIN || "1234";
  const season = Number(process.env.SEASON || 2026);

  // Idempotent: never overwrite a populated database on deploy. Set FORCE_SEED=1 to override.
  const existing = await prisma.league.count();
  if (existing > 0 && !process.env.FORCE_SEED) {
    console.log(`Seed skipped — ${existing} league(s) already exist (set FORCE_SEED=1 to force).`);
    return;
  }

  const league = await prisma.league.upsert({
    where: { slug }, update: {}, create: { slug, name, season },
  });
  await prisma.player.upsert({
    where: { leagueId_name: { leagueId: league.id, name: "Commissioner" } },
    update: { isCommish: true },
    create: { leagueId: league.id, name: "Commissioner", pinHash: hashPin(pin), color: "#1ed47a", isCommish: true },
  });
  console.log(`Seeded "${name}".  Join page: /j/${slug}   Console: /l/${slug}/admin   Commissioner PIN: ${pin}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
