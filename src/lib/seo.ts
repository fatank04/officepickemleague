// Shared structured-data snippets used on multiple pages — single source, no drift.
export const promoVideoJsonLd = {
  "@type": "VideoObject",
  name: "Office Pick'em League — Game Day",
  description:
    "The spot: a warehouse shift drags until the picks drop. One sheet, everybody's in, trash talk all week, and Sunday settles it. The office football pool for everyone — no money, no app, two minutes a week.",
  thumbnailUrl: "https://officepickemleague.com/promo-hero-poster.jpg",
  contentUrl: "https://officepickemleague.com/promo-hero.mp4",
  uploadDate: "2026-08-02T22:00:00-04:00", // full ISO 8601 w/ timezone — Google VideoObject requires it
  duration: "PT43S",
} as const;
