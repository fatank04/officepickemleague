/**
 * Every plausible stored form of a number, for a forgiving (still indexed)
 * lookup. Inbound callers arrive in different shapes depending on the provider
 * (+1XXXXXXXXXX, 1XXXXXXXXXX, XXXXXXXXXX); an exact match silently fails.
 */
export function phoneVariants(input: string): string[] {
  const raw = (input || "").trim();
  const d = raw.replace(/[^\d]/g, "");
  const ten = d.length >= 10 ? d.slice(-10) : d;
  const out = new Set<string>();
  if (raw) out.add(raw);
  if (d) { out.add(d); out.add(`+${d}`); }
  if (ten.length === 10) { out.add(ten); out.add(`1${ten}`); out.add(`+1${ten}`); }
  return [...out];
}

/** Best-effort normalize a US mobile number to E.164 (+1XXXXXXXXXX). Returns null if it can't. */
export function toE164(input: string): string | null {
  const s = (input || "").trim();
  const d = s.replace(/[^\d]/g, "");
  if (s.startsWith("+") && d.length >= 11 && d.length <= 15) return `+${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length === 10) return `+1${d}`;
  return null;
}
