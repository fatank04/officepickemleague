// Seed the Demo Day League with a rich, representative dataset for screenshots.
// Idempotent + batched (bulk inserts) so it finishes in seconds.
//
//   npm i pg
//   DATABASE_URL="postgresql://..."  node scripts/seed-demo-league.mjs
//
//   - Renames commissioner "Ankur" -> demo persona (keeps commish rights)
//   - Ensures 24 players; trims strays so the board is clean
//   - Full 16-game slates for weeks 1-3 (FINAL/graded) + week 4 (OPEN/pickable)
//   - Every player gets a full, varied card each week (winner/spread/total + a Lock)
//   - Sets prize, accent, welcome, league name so it looks configured

import crypto from "crypto";
import pg from "pg";

const SLUG = process.env.DEMO_SLUG || "demo-day-league-x8am";
const SEASON = Number(process.env.DEMO_SEASON || 2026);
const COMMISH_NAME = "Ray Delgado";
const LEAGUE_NAME = "Northgate Logistics Pick'em";

const hashPin = (pin) => { const s = crypto.randomBytes(16).toString("hex"); return `${s}:${crypto.scryptSync(String(pin), s, 32).toString("hex")}`; };
const cid = () => "c" + crypto.randomBytes(12).toString("hex");
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(20260706);

const COLORS = ["#1ed47a","#3f7fe6","#f7cf57","#ff6b8a","#7c5cff","#20c4c4","#ff9f43","#5fd99b","#e06be0","#4da3ff","#ffd166","#ef767a","#8a7bff","#31d0aa","#ffa94d","#63e6be","#c084fc","#38bdf8","#facc15","#fb7185","#a78bfa","#2dd4bf","#fb923c","#4ade80"];
const NAMES = [COMMISH_NAME,"Dana Whitfield","Luis Ferro","Priya Nair","Tom Beckett","Marcus Hill","Sofia Reyes","Jim Kowalski","Andre Boone","Kayla Nguyen","Diego Salas","Rachel Kim","Terrence Ford","Bianca Russo","Sam Okafor","Nina Petrova","Curtis Lane","Gabriela Mota","Wes Halloran","Amara Diallo","Vince Carbone","Leah Abramson","Darius Pope","Holly Bergstrom"];
const TEAMS = ["Cardinals","Falcons","Ravens","Bills","Panthers","Bears","Bengals","Browns","Cowboys","Broncos","Lions","Packers","Texans","Colts","Jaguars","Chiefs","Raiders","Chargers","Rams","Dolphins","Vikings","Patriots","Saints","Giants","Jets","Eagles","Steelers","49ers","Seahawks","Buccaneers","Titans","Commanders"];
const WEEKS = [{ week: 1, graded: true }, { week: 2, graded: true }, { week: 3, graded: true }, { week: 4, graded: false }];

function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function slateFor(week, graded) {
  const r = rng(1000 + week); const teams = shuffle(TEAMS, r); const games = [];
  for (let i = 0; i < 32; i += 2) {
    const away = teams[i], home = teams[i + 1];
    const homeSpread = [-9.5,-7.5,-6.5,-4.5,-3.5,-2.5,-1.5,1.5,2.5,3.5,6.5][Math.floor(r() * 11)];
    const total = [39.5,41.5,43.5,44.5,45.5,47.5,48.5,49.5,51.5][Math.floor(r() * 9)];
    let awayScore = null, homeScore = null, kickoff;
    if (graded) {
      const base = 17 + Math.floor(r() * 14); const fav = -homeSpread; const swing = Math.round(fav / 2 + (r() * 14 - 7));
      homeScore = Math.max(3, base + Math.round(swing / 2)); awayScore = Math.max(0, base - Math.round(swing / 2));
      kickoff = new Date(Date.UTC(2026, 5, 1 + (week - 1) * 7, 17, 0, 0));
    } else { kickoff = new Date(Date.UTC(2026, 8, 13 + Math.floor(i / 8), 17 + (i % 3), 0, 0)); }
    games.push({ away, home, homeSpread, total, awayScore, homeScore, kickoff, final: graded });
  }
  return games;
}
function truth(g) { if (!g.final || g.homeScore == null) return null; const m = g.homeScore - g.awayScore; return { su: g.homeScore > g.awayScore ? "home" : "away", ats: m + g.homeSpread > 0 ? "home" : "away", ou: g.homeScore + g.awayScore > g.total ? "over" : "under" }; }
const oS = (s) => (s === "home" ? "away" : "home");
const oO = (s) => (s === "over" ? "under" : "over");
function vals(rows, n) { const params = []; const chunks = rows.map((r, i) => { params.push(...r); return "(" + r.map((_, j) => "$" + (i * n + j + 1)).join(",") + ")"; }); return { text: chunks.join(","), params }; }

async function main() {
  if (!process.env.DATABASE_URL) { console.error("Set DATABASE_URL"); process.exit(1); }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("BEGIN");
    const lg = await client.query(`SELECT id FROM "League" WHERE slug=$1`, [SLUG]);
    if (!lg.rows.length) throw new Error(`League not found: ${SLUG}`);
    const leagueId = lg.rows[0].id;

    await client.query(`UPDATE "League" SET name=$2,"prizeText"=$3,"welcomeMessage"=$4,"accentColor"=$5 WHERE id=$1`,
      [leagueId, LEAGUE_NAME, "Season champion takes the traveling trophy + a catered lunch for their crew.", "Welcome to the company pick'em - two minutes a week, everybody's in. Reply LINES to start.", "#1ed47a"]);

    await client.query(`UPDATE "Player" SET name=$2,"isCommish"=true WHERE "leagueId"=$1 AND name='Ankur'`, [leagueId, COMMISH_NAME]);

    // ensure players (bulk, skip existing)
    const existing = new Set((await client.query(`SELECT name FROM "Player" WHERE "leagueId"=$1`, [leagueId])).rows.map((r) => r.name));
    const newRows = NAMES.filter((n) => !existing.has(n)).map((n, i) => [cid(), leagueId, n, hashPin(1000 + Math.floor(rand() * 8999)), COLORS[NAMES.indexOf(n) % COLORS.length], n === COMMISH_NAME]);
    if (newRows.length) { const v = vals(newRows, 6); await client.query(`INSERT INTO "Player" (id,"leagueId",name,"pinHash",color,"isCommish") VALUES ${v.text} ON CONFLICT ("leagueId",name) DO NOTHING`, v.params); }
    await client.query(`DELETE FROM "Player" WHERE "leagueId"=$1 AND name <> ALL($2::text[])`, [leagueId, NAMES]);
    const players = (await client.query(`SELECT id FROM "Player" WHERE "leagueId"=$1 ORDER BY name`, [leagueId])).rows.map((r) => r.id);
    const skill = new Map(players.map((id, idx) => [id, 0.44 + ((idx * 37) % 30) / 100]));

    for (const wk of WEEKS) {
      const slate = slateFor(wk.week, wk.graded);
      await client.query('DELETE FROM "Game" WHERE season=$1 AND week=$2', [SEASON, wk.week]);
      const gRows = slate.map((g) => [cid(), SEASON, wk.week, `demo-${SEASON}-w${wk.week}-${g.away}-${g.home}`, g.away, g.home, g.homeSpread, g.total, g.kickoff, g.awayScore, g.homeScore, g.final]);
      const gv = vals(gRows, 12);
      const got = await client.query(
        `INSERT INTO "Game" (id,season,week,"oddsId",away,home,"homeSpread",total,kickoff,"awayScore","homeScore",final) VALUES ${gv.text}
         ON CONFLICT (season,week,away,home) DO UPDATE SET "homeSpread"=EXCLUDED."homeSpread",total=EXCLUDED.total,kickoff=EXCLUDED.kickoff,"awayScore"=EXCLUDED."awayScore","homeScore"=EXCLUDED."homeScore",final=EXCLUDED.final
         RETURNING id,away,home`, gv.params);
      const gid = new Map(got.rows.map((r) => [r.away + "|" + r.home, r.id]));
      const games = slate.map((g) => ({ ...g, id: gid.get(g.away + "|" + g.home) }));

      // picks (bulk)
      const now = new Date();
      const pRows = [];
      for (const pid of players) { const s = skill.get(pid);
        for (const g of games) { const t = truth(g); let su, ats, ou;
          if (t) { su = rand() < s ? t.su : oS(t.su); ats = rand() < s ? t.ats : oS(t.ats); ou = rand() < s ? t.ou : oO(t.ou); }
          else { su = rand() < .5 ? "home" : "away"; ats = rand() < .5 ? "home" : "away"; ou = rand() < .5 ? "over" : "under"; }
          pRows.push([cid(), leagueId, pid, g.id, su, ats, ou, now]); } }
      const pv = vals(pRows, 8);
      await client.query(`INSERT INTO "Pick" (id,"leagueId","playerId","gameId",su,ats,ou,"updatedAt") VALUES ${pv.text}
        ON CONFLICT ("playerId","gameId") DO UPDATE SET su=EXCLUDED.su,ats=EXCLUDED.ats,ou=EXCLUDED.ou,"updatedAt"=EXCLUDED."updatedAt"`, pv.params);

      // one Lock per player (bulk)
      await client.query(`DELETE FROM "PowerPick" WHERE "leagueId"=$1 AND season=$2 AND week=$3`, [leagueId, SEASON, wk.week]);
      const ppRows = players.map((pid) => [cid(), leagueId, pid, games[Math.floor(rand() * games.length)].id, SEASON, wk.week, 1]);
      const ppv = vals(ppRows, 7);
      await client.query(`INSERT INTO "PowerPick" (id,"leagueId","playerId","gameId",season,week,rank) VALUES ${ppv.text}`, ppv.params);

      if (wk.graded) {
        const sRows = players.map((pid) => [cid(), leagueId, pid, SEASON, wk.week, now]);
        const sv = vals(sRows, 6);
        await client.query(`INSERT INTO "Submission" (id,"leagueId","playerId",season,week,"submittedAt") VALUES ${sv.text} ON CONFLICT ("playerId",season,week) DO NOTHING`, sv.params);
      }
      console.log(`week ${wk.week}: 16 games (${wk.graded ? "final" : "open"}), ${pRows.length} picks`);
    }
    await client.query("COMMIT");
    console.log(`\nDone. "${LEAGUE_NAME}" (${SLUG}) -> ${players.length} players, weeks 1-4 seeded. Ankur -> ${COMMISH_NAME}.`);
  } catch (e) { await client.query("ROLLBACK").catch(() => {}); throw e; } finally { await client.end(); }
}
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
