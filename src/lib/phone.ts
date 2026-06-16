/** Best-effort normalize a US mobile number to E.164 (+1XXXXXXXXXX). Returns null if it can't. */
export function toE164(input: string): string | null {
  const s = (input || "").trim();
  const d = s.replace(/[^\d]/g, "");
  if (s.startsWith("+") && d.length >= 11 && d.length <= 15) return `+${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length === 10) return `+1${d}`;
  return null;
}
