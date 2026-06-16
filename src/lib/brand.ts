// Resolve a league's player-facing branding to a safe, defaulted theme.
export const DEFAULT_ACCENT = "#4f8cff";

/** League display label: append " Pick'em" only if the name doesn't already contain it. */
export function leagueLabel(name: string): string {
  const n = (name ?? "").trim();
  return /pick'?em/i.test(n) ? n : `${n} Pick'em`;
}

export type LeagueBrandFields = {
  accentColor?: string | null;
  logoUrl?: string | null;
  prizeText?: string | null;
  welcomeMessage?: string | null;
};
export type Brand = { accent: string; ink: string; logoUrl: string | null; prizeText: string | null; welcomeMessage: string | null };

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Readable text color to sit ON the accent (buttons): dark ink on light accents, white on dark. */
export function onAccent(hex: string): string {
  const h = (HEX.test(hex) ? hex : DEFAULT_ACCENT).slice(1);
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#06140d" : "#ffffff";
}

export function brandOf(league: LeagueBrandFields | null | undefined): Brand {
  const accent = league?.accentColor && HEX.test(league.accentColor) ? league.accentColor.toLowerCase() : DEFAULT_ACCENT;
  const clean = (s: string | null | undefined) => { const t = (s ?? "").trim(); return t.length ? t : null; };
  const logo = clean(league?.logoUrl);
  return {
    accent,
    ink: onAccent(accent),
    logoUrl: logo && /^https:\/\//i.test(logo) ? logo : null,
    prizeText: clean(league?.prizeText),
    welcomeMessage: clean(league?.welcomeMessage),
  };
}

/** A short, SMS-safe welcome suffix from the commissioner's note (trimmed to fit a text). */
export function welcomeSuffix(brand: Brand, max = 120): string {
  if (!brand.welcomeMessage) return "";
  const m = brand.welcomeMessage.replace(/\s+/g, " ").trim();
  return " " + (m.length > max ? m.slice(0, max - 1).trimEnd() + "…" : m);
}

/** "#1ed47a" -> "30, 212, 122" (for rgba(var(--accent-rgb), .12) tints). */
export function hexToRgb(hex: string): string {
  const h = (HEX.test(hex) ? hex : DEFAULT_ACCENT).slice(1);
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

/** Darken a hex color by a fraction (0..1) — used for the button gradient's darker stop. */
export function darken(hex: string, frac = 0.28): string {
  const h = (HEX.test(hex) ? hex : DEFAULT_ACCENT).slice(1);
  const f = Math.min(1, Math.max(0, frac));
  const ch = (i: number) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - f)).toString(16).padStart(2, "0");
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}
