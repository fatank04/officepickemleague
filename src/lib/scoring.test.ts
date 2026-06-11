// Run with: npm run test:scoring  (uses tsx)
import { gameNet, weekScore, playoffStandings, halfify, type GameScore } from "./scoring";

let pass = 0,
  fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got),
    w = JSON.stringify(want);
  if (g === w) {
    pass++;
    console.log(`  ok ${label}`);
  } else {
    fail++;
    console.error(`  FAIL ${label}\n     got  ${g}\n     want ${w}`);
  }
}

// home -4.5, total 44.5; final 17-24 => truth home/home/under
const g: GameScore = { id: "g1", homeSpread: halfify(-4), total: halfify(44.5), awayScore: 17, homeScore: 24, final: true };

eq("sweep 3/3 -> net 6", gameNet(g, { su: "home", ats: "home", ou: "under" }).net, 6);
eq("whiff 0/3 -> net -2", gameNet(g, { su: "away", ats: "away", ou: "over" }).net, -2);
eq("2/3 -> net 3", gameNet(g, { su: "home", ats: "home", ou: "over" }).net, 3);
eq("ats only correct -> net 2", gameNet(g, { su: "away", ats: "home", ou: "over" }).net, 2);

const games = [g];
eq(
  "simple power (lock ats win) -> +3",
  weekScore(games, { g1: { su: "home", ats: "home", ou: "under" } }, ["g1"], "simple").powerAdj,
  3
);

const { quals } = playoffStandings(
  [
    { playerId: "a", name: "You", reg: 61, playoff: 0, atsWins: 20, bestWeek: 14 },
    { playerId: "b", name: "Mike", reg: 39, playoff: 0, atsWins: 15, bestWeek: 12 },
    { playerId: "c", name: "Dave", reg: 35, playoff: 0, atsWins: 14, bestWeek: 11 },
    { playerId: "d", name: "Sara", reg: 35, playoff: 0, atsWins: 13, bestWeek: 10 },
    { playerId: "e", name: "Tom", reg: 10, playoff: 0, atsWins: 5, bestWeek: 8 },
  ],
  { seasonStart: 1, seasonEnd: 18, playoffOn: true, playoffStart: 15, playoffTeams: 4, seedStep: 2 }
);
eq("playoff qualifiers = 4", quals.length, 4);
eq("seed bonuses 6/4/2/0", quals.map((q) => q.bonus), [6, 4, 2, 0]);
eq("top seed = You", quals[0].name, "You");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
