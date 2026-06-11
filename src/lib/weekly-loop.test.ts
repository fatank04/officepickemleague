// Run with: npm run test:loop   (uses tsx; no DB or Next runtime needed)
import { isGameLocked, planIngest } from "./lock";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

const T0 = new Date("2026-09-13T17:00:00Z"); // a Sunday 1pm ET kickoff
const before = new Date("2026-09-13T16:59:59Z");
const after  = new Date("2026-09-13T17:00:01Z");

// --- per-game lock ---
eq("not locked one second before kickoff", isGameLocked({ kickoff: T0 }, before), false);
eq("locked exactly at kickoff",            isGameLocked({ kickoff: T0 }, T0), true);
eq("locked one second after kickoff",      isGameLocked({ kickoff: T0 }, after), true);

// Thursday game must lock Thursday even though Sunday games are still open.
const thu = new Date("2026-09-10T00:20:00Z");
const sunday = new Date("2026-09-13T17:00:00Z");
eq("Thursday game locked by Sunday-morning pull", isGameLocked({ kickoff: thu }, new Date("2026-09-13T14:00:00Z")), true);
eq("Sunday game still open Sunday morning",        isGameLocked({ kickoff: sunday }, new Date("2026-09-13T14:00:00Z")), false);

// --- frozen-line ingest plan ---
eq("new game -> create",                         planIngest(null, before), "create");
eq("existing + not started -> update (kickoff only)", planIngest({ kickoff: T0 }, before), "update");
eq("existing + already started -> skip",         planIngest({ kickoff: T0 }, after), "skip");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
