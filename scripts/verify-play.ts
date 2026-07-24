// End-to-end check of the guided PLAY flow against the LIVE database, with no
// real texts sent: handleInboundSms() returns the reply string (sending is the
// route's job), so this exercises the whole flow — slate, parsing, recap, change,
// lock — deterministically. Creates a disposable tester in the test league and
// deletes it (cascading its picks) when done.
//
// Run AFTER the deploy that adds Player.flowWeek is live:
//   DATABASE_URL="<your Neon URL>" npx tsx scripts/verify-play.ts
import { handleInboundSms } from "@/lib/sms-inbound";
import { prisma } from "@/lib/db";

const SLUG = process.env.PLAY_SLUG || "test-league-123-25yh";
const PHONE = "+15550000199"; // fake; disposable tester only

async function say(text: string): Promise<string> {
  const reply = await handleInboundSms(PHONE, text, new Date());
  console.log(`\n📲 you → ${text}\n🤖 bot → ${reply}`);
  return reply;
}

async function main() {
  const league = await prisma.league.findUnique({ where: { slug: SLUG } });
  if (!league) throw new Error(`League "${SLUG}" not found. Set PLAY_SLUG to a real league slug.`);

  await prisma.player.deleteMany({ where: { leagueId: league.id, phone: PHONE } });
  const tester = await prisma.player.create({
    data: { leagueId: league.id, name: "PLAY Check", pinHash: "verify:disposable", color: "#8899bb", phone: PHONE, smsConsentAt: new Date() },
  });

  let ok = true;
  try {
    const start = await say("PLAY");
    if (!/Game 1\//.test(start)) { ok = false; console.error("  ✗ expected the flow to open on Game 1"); }

    // Answer each game (alternating) until the recap appears.
    let reply = start, guard = 0, recap = false;
    while (guard++ < 20) {
      reply = await say(guard % 2 ? "home team, under" : "away, over");
      if (/whole slate|Your card:/i.test(reply)) { recap = true; break; }
    }
    if (!recap) { ok = false; console.error("  ✗ never reached the recap after answering"); }

    const change = await say("3 over");            // change a pick in plain words
    if (!/Updated/i.test(change) && !/Your card:/i.test(change)) { ok = false; console.error("  ✗ change didn't take"); }
    await say("lock game 2");                        // move the Lock
    const locked = await say("LOCK");                // submit
    if (!/locked/i.test(locked)) { ok = false; console.error("  ✗ LOCK didn't submit the card"); }

    console.log(`\n${ok ? "✅ PLAY flow verified end-to-end." : "❌ PLAY flow had failures — see ✗ above."}`);
  } finally {
    await prisma.player.delete({ where: { id: tester.id } }).catch(() => {});
    await prisma.$disconnect();
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
