import type { MetadataRoute } from "next";

// League, admin, and API surfaces are private/per-company — keep crawlers on the marketing pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/l/", "/api/", "/ops/", "/signin/", "/r/", "/j/", "/kit/"],
      },
    ],
    sitemap: "https://officepickemleague.com/sitemap.xml",
  };
}
