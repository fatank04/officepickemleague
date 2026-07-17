// Run: npx tsx src/lib/sheet.test.ts
import { buildSheetPrompt, mapSheetResponse, issueReply, type SheetGame } from "./sheet";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

const games: SheetGame[] = [
  { id: "g1", num: 1, away: "Cowboys", home: "Eagles", awayAbbr: "DAL", homeAbbr: "PHI" },
  { id: "g2", num: 2, away: "Bills", home: "Jets", awayAbbr: "BUF", homeAbbr: "NYJ" },
  { id: "g3", num: 3, away: "Packers", home: "Bears", awayAbbr: "GB", homeAbbr: "CHI" },
];

// prompt sanity
const prompt = buildSheetPrompt(games);
eq("prompt lists every game", games.every((g) => prompt.includes(g.away) && prompt.includes(g.home)), true);
eq("prompt demands strict JSON", prompt.includes("ONLY strict JSON"), true);
eq("prompt forbids guessing", prompt.includes("Never guess"), true);

// clean transcription
const clean = mapSheetResponse(
  { name: "Ruth", picks: [
      { num: 1, su: "away", ats: "away", ou: "under" },
      { num: 2, su: "away", ats: null, ou: "over" },
      { num: 3, su: null, ats: null, ou: null },
    ], lock: 1, issues: [], week: 3, code: "DEMO" },
  games
);
eq("maps picks to game ids", clean.picks, { g1: { su: "away", ats: "away", ou: "under" }, g2: { su: "away", ou: "over" } });
eq("lock mapped to game id", clean.lockGameId, "g1");
eq("name captured", clean.name, "Ruth");
eq("no issues", clean.issues, []);
eq("printed week captured", clean.printedWeek, 3);
eq("printed code lowercased", clean.printedCode, "demo");

// ambiguity → issues, never guesses
const fuzzy = mapSheetResponse({ name: null, picks: [{ num: 2, su: "home", ats: null, ou: null }], lock: null, issues: [2, 99] }, games);
eq("ambiguous cells still save what's clear", fuzzy.picks, { g2: { su: "home" } });
eq("issue kept for real game, bogus num dropped", fuzzy.issues, ["2"]);
const q = issueReply(fuzzy.issues, games)!;
eq("issue reply names the matchup", q.includes("BUF") && q.includes("NYJ") && q.includes("game 2"), true);
eq("issue reply asks ONE simple question", q.includes(`"2 BUF"`) && q.includes(`"2 NYJ"`), true);

// junk input hardening
eq("garbage response yields empty result", mapSheetResponse({ nonsense: true }, games), { picks: {}, lockGameId: null, issues: [], name: null, printedWeek: null, printedCode: null });
eq("absurd week rejected", mapSheetResponse({ week: 99 }, games).printedWeek, null);
eq("non-numeric week rejected", mapSheetResponse({ week: "abc" }, games).printedWeek, null);
eq("invalid enum values dropped", mapSheetResponse({ picks: [{ num: 1, su: "banana", ou: "OVER!!" }] }, games).picks, {});
const notSheet = mapSheetResponse({ picks: [], lock: null, issues: [-1], name: null }, games);
eq("not-a-sheet flagged", notSheet.issues, ["not-a-sheet"]);
eq("not-a-sheet reply asks for a retake", issueReply(notSheet.issues, games)!.includes("whole page"), true);
eq("no issues -> no reply", issueReply([], games), null);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
