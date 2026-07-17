// Paper-sheet modality: turn a photo of a filled-out weekly pick sheet into picks.
// The vision call itself lives in ./vision; this module is the pure, testable part —
// building the transcription prompt and converting the model's JSON into the same
// shape parseTextPicks produces, so the save path is identical to text picks.

export interface SheetGame {
  id: string;
  num: number; // 1-indexed game number as printed on the sheet
  away: string;
  home: string;
  awayAbbr: string;
  homeAbbr: string;
}

export interface SheetResult {
  picks: Record<string, { su?: "home" | "away"; ats?: "home" | "away"; ou?: "over" | "under" }>;
  lockGameId: string | null;
  issues: string[]; // game numbers / fields the model couldn't read confidently
  name: string | null; // handwritten name, informational only (identity = sender phone)
  printedWeek: number | null; // week number printed on the sheet header, for mismatch detection
  printedCode: string | null; // league code printed on the sheet header
}

/** Prompt for the vision model. Demands strict JSON; unclear marks become issues, never guesses. */
export function buildSheetPrompt(games: SheetGame[]): string {
  const list = games
    .map((g) => `${g.num}: away=${g.away} (${g.awayAbbr}), home=${g.home} (${g.homeAbbr})`)
    .join("\n");
  return `You are transcribing a photo of a paper NFL pick'em sheet. Players mark picks with checkmarks, X marks, circles, or scribbles — any deliberate mark counts. The games on this week's sheet are:

${list}

For each game row the sheet has three columns: WINNER (away/home), SPREAD (away/home), TOTAL (over/under), plus a LOCK star column the player may mark on at most one game.

The sheet's printed header contains "Week N" and "League code: <code>" — read them too.

Return ONLY strict JSON, no prose:
{"name": <handwritten name on the name line, or null>,
 "week": <the week number printed in the header, or null if unreadable>,
 "code": <the league code printed in the header, or null if unreadable>,
 "picks": [{"num": <game number>, "su": "away"|"home"|null, "ats": "away"|"home"|null, "ou": "over"|"under"|null}, ...],
 "lock": <game number with the lock mark, or null>,
 "issues": [<game numbers (integers) where marks are ambiguous, double-marked, or unreadable>]}

Rules: if a cell has no mark, use null. If BOTH options in one cell are marked or a mark is ambiguous, use null for that cell AND add the game number to issues. Never guess. If the photo is not a pick sheet, return {"name":null,"picks":[],"lock":null,"issues":[-1]}.`;
}

/** Convert the model's JSON (already parsed) into a SheetResult against the real game list. */
export function mapSheetResponse(raw: any, games: SheetGame[]): SheetResult {
  const byNum = new Map(games.map((g) => [g.num, g]));
  const picks: SheetResult["picks"] = {};
  const issues = new Set<string>();
  const rows: any[] = Array.isArray(raw?.picks) ? raw.picks : [];

  for (const r of rows) {
    const g = byNum.get(Number(r?.num));
    if (!g) continue;
    const entry: (typeof picks)[string] = {};
    if (r.su === "away" || r.su === "home") entry.su = r.su;
    if (r.ats === "away" || r.ats === "home") entry.ats = r.ats;
    if (r.ou === "over" || r.ou === "under") entry.ou = r.ou;
    if (Object.keys(entry).length) picks[g.id] = entry;
  }

  for (const n of Array.isArray(raw?.issues) ? raw.issues : []) {
    const num = Number(n);
    if (num === -1) issues.add("not-a-sheet");
    else if (byNum.has(num)) issues.add(String(num));
  }

  const lockGame = byNum.get(Number(raw?.lock));
  const wk = Number(raw?.week);
  return {
    picks,
    lockGameId: lockGame ? lockGame.id : null,
    issues: [...issues],
    name: typeof raw?.name === "string" && raw.name.trim() ? raw.name.trim() : null,
    printedWeek: Number.isInteger(wk) && wk >= 1 && wk <= 30 ? wk : null,
    printedCode: typeof raw?.code === "string" && raw.code.trim() ? raw.code.trim().toLowerCase() : null,
  };
}

/** One friendly follow-up for unreadable cells: a single, simple question. */
export function issueReply(issues: string[], games: SheetGame[]): string | null {
  const real = issues.filter((i) => i !== "not-a-sheet");
  if (issues.includes("not-a-sheet"))
    return "Hmm — that photo doesn't look like a pick sheet. Lay the sheet flat, get the whole page in the shot, and text it again. 📸";
  if (!real.length) return null;
  const first = games.find((g) => String(g.num) === real[0]);
  const extra = real.length > 1 ? ` (same for game${real.length > 2 ? "s" : ""} ${real.slice(1).join(", ")})` : "";
  return first
    ? `One thing — I couldn't read game ${first.num} (${first.awayAbbr} @ ${first.homeAbbr}). Reply "${first.num} ${first.awayAbbr}" or "${first.num} ${first.homeAbbr}" and I'll fill it in${extra}.`
    : null;
}
