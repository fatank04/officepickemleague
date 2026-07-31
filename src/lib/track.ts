import { prisma } from "./db";

export type EventInput = {
  type: string; // 'player_joined' | 'login' | 'pick_saved' | 'card_submitted' | 'card_unsubmitted' | 'week_opened' | 'reminder_sent'
  leagueId?: string;
  playerId?: string;
  season?: number;
  week?: number;
  channel?: "web" | "sms" | "voice" | "email" | "sheet";
  meta?: Record<string, unknown>;
};

/**
 * Fire-and-forget. Analytics must NEVER block or break the request path.
 *
 * One retry, then log. Neon's free tier cold-starts, so the first write after an idle spell can
 * fail with a connection error — and a silently dropped kit_viewed is indistinguishable from
 * "nobody scanned," which is the one thing we're using this data to tell apart. The retry catches
 * the cold start; the log means a persistent failure shows up in Render logs instead of nowhere.
 */
export function track(e: EventInput): void {
  const write = () => prisma.event.create({ data: e as any });
  write()
    .catch(() => new Promise((r) => setTimeout(r, 750)).then(write))
    .catch((err) => console.error("[track] dropped event", e.type, e.meta ?? "", String(err)));
}
