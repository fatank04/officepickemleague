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

  // Ensure the geo-social landing exists (idempotent) so /kit/pgh-social is branded + tracked.
  await prisma.kitAccount.upsert({
    where: { slug: "pgh-social" },
    update: {},
    create: { slug: "pgh-social", company: "Pittsburgh", metro: "Pittsburgh", teamCity: "Pittsburgh", teamName: "Steelers", status: "ready", notes: "Geo-social paid landing" },
  });

  // Warm personal leads get a kit page too — sent as a link, no mailed kit. UPPI: Kaitlin
  // Rumberger (CFO, family friend), Mechanicsburg PA. She's an Eagles fan, so the page runs
  // Philadelphia — which also makes her Week 1 card show a real Eagles game.
  //
  // Accent is midnight green lifted for a near-black page: the true #004C54 is dark enough that
  // accent text and borders disappear on --bg:#080b11. This keeps the color reading as Eagles
  // while staying legible. Team theme is force-updated (not create-only) so the fan detail lands
  // on the record that already exists in production.
  const uppiTheme = { teamCity: "Philadelphia", teamName: "Eagles", accent: "#1a8f80" };
  await prisma.kitAccount.upsert({
    where: { slug: "uppi" },
    update: uppiTheme,
    create: {
      slug: "uppi", company: "UPPI", metro: "Central PA", contact: "Kaitlin",
      contactTitle: "CFO", addr1: "61 Texaco Road", city: "Mechanicsburg", state: "PA",
      zip: "17050", status: "ready", ...uppiTheme,
      notes: "Warm intro — Kaitlin Rumberger, CFO; dad is CEO. Eagles fan. Link only, no mailed kit.",
    },
  });

  // ADUSA Supply Chain — Heather Evans, HR, asked for an email she can route internally. Left
  // deliberately unthemed: ADUSA's network runs Food Lion, Hannaford, Stop & Shop and Giant
  // territory, so no single team is right for the company page. Per-site team colors are the
  // pitch for a multi-site rollout, not something to guess at here.
  await prisma.kitAccount.upsert({
    where: { slug: "adusa" },
    update: {},
    create: {
      slug: "adusa", company: "ADUSA Supply Chain", contact: "Heather",
      contactTitle: "Organizational Talent Planning", email: "Heather.evans@adusasc.com",
      status: "ready",
      notes: "Warm — Heather Evans, said yes, routing internally. Multi-site: DCs + corporate offices. Link only, no mailed kit yet.",
    },
  });

  // The mailed Pittsburgh kits each point at their own /kit/<slug>. Create-only on update so
  // anything edited later in the ops console survives the next deploy.
  const kits = require("./kit-accounts-pittsburgh.js");
  for (const k of kits) {
    await prisma.kitAccount.upsert({ where: { slug: k.slug }, update: {}, create: k });
  }
  console.log(`Kit accounts ensured: ${kits.length} Pittsburgh + 1 geo-social.`);

  // Sandbox league for the ADUSA pitch — Heather and colleagues join at /j/adusa-demo, add a
  // mobile number, and get the whole product: web picks, text, paper sheet, concierge call.
  // Separate slug from the kit page's buy flow so "start the league" still works untouched.
  const adusaDemo = await prisma.league.upsert({
    where: { slug: "adusa-demo" },
    update: {},
    create: { slug: "adusa-demo", name: "ADUSA Pick'em (Preview)", season },
  });
  await prisma.player.upsert({
    where: { leagueId_name: { leagueId: adusaDemo.id, name: "Ankur" } },
    update: { isCommish: true },
    create: { leagueId: adusaDemo.id, name: "Ankur", pinHash: hashPin(pin), color: "#1ed47a", isCommish: true },
  });
  console.log("ADUSA preview league ensured: /j/adusa-demo");

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
