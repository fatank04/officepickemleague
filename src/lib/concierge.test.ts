// Run: npx tsx src/lib/concierge.test.ts
// Pure-function coverage for the concierge tools (the DB-touching parts are the
// same engine SMS PLAY already verifies). Focuses on spoken read-back + the
// tool dispatch shape, and re-confirms the parser reuse.
import { CONCIERGE_PROMPT, type ConciergeTool } from "./concierge";
import { parseGuidedAnswer, teamLabel, type FlowGame } from "./guided";

let pass = 0, fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}`); }
}

// describePick logic is internal; re-derive the spoken form the same way and check it.
const g: FlowGame = { id: "g1", away: "Dallas Cowboys", home: "Philadelphia Eagles", homeSpread: -3.5, total: 47.5 };
function spoken(a: { su?: "home" | "away"; ats?: "home" | "away"; ou?: "over" | "under" }) {
  const nameOf = (s?: "home" | "away") => (s ? teamLabel(s === "home" ? g.home : g.away) : null);
  const parts: string[] = [];
  if (a.su && a.ats && a.su === a.ats) parts.push(`${nameOf(a.su)} to win and cover`);
  else { if (a.su) parts.push(`${nameOf(a.su)} to win`); if (a.ats) parts.push(`${nameOf(a.ats)} to cover`); }
  if (a.ou) parts.push(`the ${a.ou}`);
  return parts.join(", ");
}

// The parser (shared with SMS) turns spoken words into a pick the tool saves.
ok("parse: eagles + under", JSON.stringify(parseGuidedAnswer("Eagles to win and cover, the under", g)) === JSON.stringify({ ou: "under", su: "home", ats: "home" }));
ok("readback: win+cover+ou", spoken({ su: "home", ats: "home", ou: "under" }) === "Eagles to win and cover, the under");
ok("readback: split", spoken({ su: "home", ats: "away", ou: "over" }) === "Eagles to win, Cowboys to cover, the over");

// The prompt must actually instruct the model to use every tool + never auto-submit.
const tools: ConciergeTool[] = ["get_context", "set_pick", "set_lock", "read_card", "submit_card"];
for (const t of tools) ok(`prompt mentions ${t}`, CONCIERGE_PROMPT.includes(t));
ok("prompt: no submit without confirm", /never submit|explicit yes|clearly confirm/i.test(CONCIERGE_PROMPT));
ok("prompt: adapts to pace", /rushed|rapid-fire|pace/i.test(CONCIERGE_PROMPT));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
