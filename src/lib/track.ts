import { prisma } from "./db";

export type EventInput = {
  type: string; // 'player_joined' | 'login' | 'pick_saved' | 'card_submitted' | 'card_unsubmitted' | 'week_opened' | 'reminder_sent'
  leagueId?: string;
  playerId?: string;
  season?: number;
  week?: number;
  channel?: "web" | "sms" | "voice" | "email";
  meta?: Record<string, unknown>;
};

/** Fire-and-forget. Analytics must NEVER block or break the request path. */
export function track(e: EventInput): void {
  prisma.event.create({ data: e as any }).catch(() => {});
}
