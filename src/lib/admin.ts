// Pure, dependency-free validators for the commissioner console (unit-tested).

export function cleanName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim().replace(/\s+/g, " ");
  return s.length >= 1 && s.length <= 40 ? s : null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
export function validHexColor(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  return HEX.test(s) ? s.toLowerCase() : null;
}

/** A team score: integer 0..200. Returns null on anything else. */
export function parseScore(input: unknown): number | null {
  const n = typeof input === "number" ? input : typeof input === "string" ? Number(input.trim()) : NaN;
  return Number.isInteger(n) && n >= 0 && n <= 200 ? n : null;
}

/** A betting line value at half-points (e.g. -3.5, 0, 44.5). Range-guarded. */
export function parseLine(input: unknown, max: number): number | null {
  const n = typeof input === "number" ? input : typeof input === "string" ? Number(String(input).trim()) : NaN;
  if (!Number.isFinite(n) || Math.abs(n) > max) return null;
  // allow only whole or half points
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-9 ? n : null;
}

export function newPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

import { toE164 } from "./phone";

export type ParsedRosterRow = { name: string; phone: string | null };
export type RosterParse = { rows: ParsedRosterRow[]; errors: { line: number; raw: string; reason: string }[]; duplicatesInList: string[] };

/**
 * Parse a pasted/CSV roster. One entry per line; accepts:
 *   "Mike R"                      (name only)
 *   "Mike R, 412-555-0123"        (name, phone)
 *   "Mike R<TAB>4125550123"       (CSV/TSV)
 * A leading header line like "name,phone" is ignored. Importing a phone does NOT grant consent.
 */
export function parseRoster(text: unknown, max = 500): RosterParse {
  const rows: ParsedRosterRow[] = [];
  const errors: RosterParse["errors"] = [];
  const seen = new Set<string>();
  const duplicatesInList: string[] = [];
  if (typeof text !== "string") return { rows, errors: [{ line: 0, raw: "", reason: "No input." }], duplicatesInList };

  const lines = text.split(/\r?\n/);
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    // skip an obvious header row
    if (i === 0 && /^\s*name\s*[,\t]\s*(phone|mobile|cell|number)\s*$/i.test(raw)) continue;
    if (n >= max) { errors.push({ line: i + 1, raw, reason: `Over the ${max}-row limit — split into batches.` }); continue; }

    const parts = raw.split(/[,\t]/).map((p) => p.trim());
    const name = cleanName(parts[0]);
    if (!name) { errors.push({ line: i + 1, raw, reason: "Missing or invalid name." }); continue; }

    let phone: string | null = null;
    if (parts[1]) {
      phone = toE164(parts[1]);
      if (!phone) { errors.push({ line: i + 1, raw, reason: `Couldn't read phone "${parts[1]}".` }); continue; }
    }
    const key = name.toLowerCase();
    if (seen.has(key)) { duplicatesInList.push(name); continue; }
    seen.add(key);
    rows.push({ name, phone });
    n++;
  }
  return { rows, errors, duplicatesInList };
}
