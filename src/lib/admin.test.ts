// Run: npx tsx src/lib/admin.test.ts
import { cleanName, validHexColor, parseScore, parseLine, newPin, parseRoster } from "./admin";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

eq("trims + collapses name", cleanName("  Mike   R  "), "Mike R");
eq("rejects empty name", cleanName("   "), null);
eq("rejects 41-char name", cleanName("x".repeat(41)), null);
eq("rejects non-string name", cleanName(42), null);

eq("accepts hex", validHexColor("#21E08A"), "#21e08a");
eq("rejects short hex", validHexColor("#fff"), null);
eq("rejects non-hex", validHexColor("green"), null);

eq("score 0", parseScore("0"), 0);
eq("score 31", parseScore(31), 31);
eq("rejects negative score", parseScore(-1), null);
eq("rejects huge score", parseScore(201), null);
eq("rejects decimal score", parseScore("17.5"), null);

eq("line -3.5 ok", parseLine("-3.5", 40), -3.5);
eq("line 0 ok", parseLine(0, 40), 0);
eq("line 44.5 within total max", parseLine(44.5, 100), 44.5);
eq("rejects third-point line", parseLine(3.3, 40), null);
eq("rejects out-of-range line", parseLine(99, 40), null);

const pin = newPin();
eq("pin is 4 digits", /^\d{4}$/.test(pin), true);


// --- parseRoster ---
{
  const r = parseRoster("name,phone\nMike R, 412-555-0123\nDana\nMike R\nSue Q\t5551234567\n , 5");
  eq("parses good rows", r.rows.map((x) => x.name), ["Mike R", "Dana", "Sue Q"]);
  eq("normalizes phone", r.rows[0].phone, "+14125550123");
  eq("name-only -> null phone", r.rows[1].phone, null);
  eq("tab-separated phone", r.rows[2].phone, "+15551234567");
  eq("flags in-list duplicate", r.duplicatesInList, ["Mike R"]);
  eq("reports bad row", r.errors.length, 1);
}
eq("header-only input -> no rows", parseRoster("name, phone").rows.length, 0);
eq("blank lines ignored", parseRoster("\n\nAmy\n\n").rows.map((x) => x.name), ["Amy"]);
eq("row cap enforced", parseRoster(Array.from({length: 12}, (_,i)=>`P${i}`).join("\n"), 5).rows.length, 5);
eq("bad phone is an error, name skipped", parseRoster("Joe, abc").errors.length, 1);

console.log(`\n${pass} passed, ${fail} failed`);
