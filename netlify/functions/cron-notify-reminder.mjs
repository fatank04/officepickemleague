import { hitCron } from "./_cron.mjs";
export const config = { schedule: "0 17 * * 6" };
export default async () => hitCron("/api/cron/notify?type=reminder");
