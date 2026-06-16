// Shared helper for scheduled functions: call an internal cron route with the CRON_SECRET.
export async function hitCron(path) {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://officepickemleague.com";
  const secret = process.env.CRON_SECRET;
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
  const body = await res.text().catch(() => "");
  console.log(`[cron] ${path} -> ${res.status} ${body.slice(0, 300)}`);
  return new Response("ok");
}
