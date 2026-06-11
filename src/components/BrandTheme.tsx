import { onAccent, darken, hexToRgb, DEFAULT_ACCENT } from "@/lib/brand";

/**
 * Emits :root CSS variables so the player UI themes to the league accent.
 * globals.css already reads var(--accent)/var(--accent-d); the rgba tints read var(--accent-rgb).
 * Rendered in the page body, this declaration comes after globals.css and wins the cascade.
 */
export default function BrandTheme({ accent }: { accent?: string | null }) {
  const a = accent || DEFAULT_ACCENT;
  const css = `:root{--accent:${a};--accent-d:${darken(a)};--accent-ink:${onAccent(a)};--accent-rgb:${hexToRgb(a)};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
