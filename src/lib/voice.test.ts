// Run with: npx tsx --import tsx/esm src/lib/voice.test.ts  (pure helpers; no DB/Next)
import { halfWords, favoriteSide, spreadPhrase, applyMethod, ord } from "./voice";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

// --- halfWords (TTS-friendly line reading) ---
eq("3.5 -> '3 and a half'", halfWords(3.5), "3 and a half");
eq("-3.5 -> '3 and a half' (abs)", halfWords(-3.5), "3 and a half");
eq("7 -> '7'", halfWords(7), "7");
eq("44.5 total", halfWords(44.5), "44 and a half");
eq("0.5 -> 'a half'", halfWords(0.5), "a half");

// --- favorite side from home spread ---
eq("home favored (-3.5)", favoriteSide(-3.5), "home");
eq("away favored (+2.5)", favoriteSide(2.5), "away");

// --- spread phrasing ---
eq("home favorite phrase", spreadPhrase({ home: "Steelers", away: "Seahawks", homeSpread: -3.5 }), "Steelers favored by 3 and a half");
eq("away favorite phrase", spreadPhrase({ home: "Browns", away: "Ravens", homeSpread: 6.5 }), "Ravens favored by 6 and a half");

// --- one-tap methods produce a complete card ---
const homeFav = { homeSpread: -3.5 };
eq("favorites -> favorite both + over", applyMethod("fav", homeFav), { su: "home", ats: "home", ou: "over" });
eq("home -> home both + over", applyMethod("home", homeFav), { su: "home", ats: "home", ou: "over" });
eq("dogs -> underdog both + under", applyMethod("dog", homeFav), { su: "away", ats: "away", ou: "under" });
const r = applyMethod("random", homeFav);
eq("random produces all three fields", [["home","away"].includes(r.su), ["home","away"].includes(r.ats), ["over","under"].includes(r.ou)], [true, true, true]);

// --- ordinals (spoken rank) ---
eq("1st", ord(1), "1st"); eq("2nd", ord(2), "2nd"); eq("3rd", ord(3), "3rd");
eq("4th", ord(4), "4th"); eq("11th", ord(11), "11th"); eq("21st", ord(21), "21st");

console.log(`\n${pass} passed, ${fail} failed`);
