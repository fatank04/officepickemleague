// Per-account pURL records for the Tier-1 Kickoff Kit landing pages (/kit/<slug>).
// The printed football + Commissioner Card point here; the page pre-builds the league.
// Add ONE entry per mailed account. `accent` is optional (defaults to brand blue).
// No fabricated data — fill from verified target-list research.

export type KitAccount = {
  slug: string;
  company: string;
  teamCity?: string; // e.g. "Pittsburgh" — used in the hero line
  teamName?: string; // e.g. "Steelers" — optional flourish
  accent?: string;   // #rrggbb; falls back to brand blue
  contact?: string;  // first name, for a personal touch (optional)
};

export const KITS: Record<string, KitAccount> = {
  // --- demo / example (safe to keep; matches the mockup) ---
  "acme-logistics": { slug: "acme-logistics", company: "Acme Logistics", teamCity: "Pittsburgh", teamName: "Steelers", contact: "Mike" },
  // --- add real accounts below, one per mailed kit ---
  // "river-city-mfg": { slug: "river-city-mfg", company: "River City Mfg", teamCity: "Cincinnati", teamName: "Bengals", contact: "Dana" },
};

const titleize = (slug: string) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Look up a kit. Unknown slugs fall back to a generic record derived from the slug so the page still converts. */
export function getKit(slug: string): { account: KitAccount; known: boolean } {
  const hit = KITS[slug.toLowerCase()];
  if (hit) return { account: hit, known: true };
  return { account: { slug, company: titleize(slug) }, known: false };
}
