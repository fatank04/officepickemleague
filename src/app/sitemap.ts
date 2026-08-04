import type { MetadataRoute } from "next";

const base = "https://officepickemleague.com";

/**
 * lastModified is a hand-maintained date of the last REAL content change, not new Date().
 * The old dynamic stamp told Google every page changed seconds ago on every fetch — a lastmod
 * Google's docs say they learn to distrust, which costs the sitemap its crawl-scheduling value.
 * Bump a date only when that page's content actually changes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, lastModified: new Date("2026-08-02"), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: new Date("2026-07-26"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/terms`, lastModified: new Date("2026-07-22"), changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: new Date("2026-07-22"), changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/sms-terms`, lastModified: new Date("2026-07-22"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
