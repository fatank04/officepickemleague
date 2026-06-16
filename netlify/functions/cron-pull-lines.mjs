import { hitCron } from "./_cron.mjs";
export const config = { schedule: "0 10 * * 3" };
export default async () => hitCron("/api/cron/pull-lines");
