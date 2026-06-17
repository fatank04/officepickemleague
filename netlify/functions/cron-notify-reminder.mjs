// DISABLED — cron moved to GitHub Actions (.github/workflows/cron.yml) to save Netlify credits.
// No `export const config.schedule`, so Netlify will not schedule or invoke this. Safe to delete the netlify/ folder.
export default async () => new Response("disabled");
