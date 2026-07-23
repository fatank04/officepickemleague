// Run: npx tsx src/lib/guided.test.ts
import { parseGuidedAnswer, parseGuidedChange, mentionsTeam, isComplete, recapLine, type FlowGame } from "./guided";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

// Eagles home & favored by 3.5; total 47.5.
const g: FlowGame = { id: "g1", away: "Dallas Cowboys", home: "Philadelphia Eagles", homeSpread: -3.5, total: 47.5 };
const g2: FlowGame = { id: "g2", away: "Buffalo Bills", home: "New York Jets", homeSpread: 2.5, total: 44.5 };
const g3: FlowGame = { id: "g3", away: "Green Bay Packers", home: "Chicago Bears", homeSpread: 1.5, total: 40.5 };
const games = [g, g2, g3];

// ---- team mention ----
eq("nickname", mentionsTeam("I like the eagles", "Philadelphia Eagles"), true);
eq("city two-word", mentionsTeam("new england all day", "New England Patriots"), true);
eq("abbr token", mentionsTeam("gimme GB", "Green Bay Packers"), true);
eq("no false substring", mentionsTeam("the programs are great", "Los Angeles Rams"), false);

// ---- single team = win + cover, plus O/U ----
eq("eagles + under", parseGuidedAnswer("Eagles win and cover, gimme the under", g), { ou: "under", su: "home", ats: "home" });
eq("colloquial boys", parseGuidedAnswer("boys", g), { su: "away", ats: "away" });
eq("voice-to-text chefs", mentionsTeam("i like the chefs", "Kansas City Chiefs"), true);
eq("niners", mentionsTeam("niners cover", "San Francisco 49ers"), true);
eq("cowboys over", parseGuidedAnswer("cowboys and the over", g), { ou: "over", su: "away", ats: "away" });
eq("voice slop", parseGuidedAnswer("uh yeah the eagles i think under", g), { ou: "under", su: "home", ats: "home" });

// ---- favorite / dog / home / away ----
eq("favorite", parseGuidedAnswer("give me the favorite, over", g), { ou: "over", su: "home", ats: "home" });
eq("underdog", parseGuidedAnswer("the dog", g), { su: "away", ats: "away" });
eq("home word", parseGuidedAnswer("home team under", g), { ou: "under", su: "home", ats: "home" });

// ---- split: win one, cover other (order preserved) ----
eq("split win/cover", parseGuidedAnswer("Eagles to win but Cowboys cover", g), { su: "home", ats: "away" });

// ---- nothing parseable ----
eq("empty", parseGuidedAnswer("uhhh not sure", g), {});
eq("ou only", parseGuidedAnswer("over", g), { ou: "over" });

// ---- completeness ----
eq("complete", isComplete({ su: "home", ats: "home", ou: "under" }), true);
eq("incomplete", isComplete({ su: "home", ats: "home" }), false);

// ---- changes at recap ----
eq("lock word", parseGuidedChange("lock it in", games), { lock: true });
eq("done word", parseGuidedChange("yeah that's it", games), { lock: true });
eq("number change", parseGuidedChange("3 under", games), { idx: 2, answer: { ou: "under" } });
eq("number + team", parseGuidedChange("2 jets over", games), { idx: 1, answer: { ou: "over", su: "home", ats: "home" } });
eq("team-find change", parseGuidedChange("flip the Bills to the under", games), { idx: 1, answer: { ou: "under", su: "away", ats: "away" } });
eq("unparseable change", parseGuidedChange("what's the score", games), null);

// number change must not be read as a team via the number itself
eq("bare number is not a lock", parseGuidedChange("1 cowboys", games), { idx: 0, answer: { su: "away", ats: "away" } });

// ---- recap formatting ----
eq("recap same team", recapLine(g, 0, { su: "home", ats: "home", ou: "under" }, true), "1) Eagles, under 🔒");
eq("recap split", recapLine(g, 2, { su: "home", ats: "away", ou: "over" }, false), "3) Eagles win / Cowboys cover, over");
eq("recap blank", recapLine(g, 4, {}, false), "5) —");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
