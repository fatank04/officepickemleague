import { hitCron } from "./_cron.mjs";
export const config = { schedule: "0 * * * *" };
export default async () => hitCron("/api/cron/grade");
