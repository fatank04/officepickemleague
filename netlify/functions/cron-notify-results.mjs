import { hitCron } from "./_cron.mjs";
export const config = { schedule: "0 15 * * 2" };
export default async () => hitCron("/api/cron/notify?type=results");
