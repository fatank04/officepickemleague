// Shared structured-data snippets used on multiple pages — single source, no drift.
export const promoVideoJsonLd = {
  "@type": "VideoObject",
  name: "Office Pick'em League — Give them a season",
  description:
    "The spot: every fall the league returns. Pick on the web, by text, or a quick call — say your picks, hear your final card read back, done. No money, no app, two minutes a week.",
  thumbnailUrl: "https://officepickemleague.com/promo-hero-poster.jpg",
  contentUrl: "https://officepickemleague.com/promo-hero.mp4",
  uploadDate: "2026-07-16T09:00:00-04:00", // full ISO 8601 w/ timezone — Google VideoObject requires it
  duration: "PT35S",
} as const;
