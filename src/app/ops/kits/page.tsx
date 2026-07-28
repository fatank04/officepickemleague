import { redirect } from "next/navigation";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";
import OpsKits from "./OpsKits";

export const dynamic = "force-dynamic";

/**
 * Scans before this moment were our own QR tests and deploy checks (batch 1 shipped the morning
 * of Jul 27; nothing could be delivered before the 29th). The headline count starts here so a
 * pre-ship test never reads as a buyer. Lifetime counts stay in the tooltip.
 */
const BASELINE = new Date("2026-07-28T04:00:00Z"); // midnight ET, Jul 28

export default async function OpsKitsPage() {
  if (!opsAuthed()) redirect("/ops");
  const accounts = await prisma.kitAccount.findMany({ orderBy: [{ metro: "asc" }, { company: "asc" }] });
  const evs = await prisma.event.findMany({
    where: { type: { in: ["kit_viewed", "kit_launched"] } },
    select: { type: true, meta: true, ts: true },
  });
  const viewed: Record<string, number> = {};
  const launched: Record<string, number> = {};
  const viewedAll: Record<string, number> = {};
  const lastViewed: Record<string, string> = {};
  for (const e of evs) {
    const slug = (e.meta as any)?.slug;
    if (!slug) continue;
    const fresh = e.ts >= BASELINE;
    if (e.type === "kit_viewed") {
      viewedAll[slug] = (viewedAll[slug] || 0) + 1;
      if (fresh) {
        viewed[slug] = (viewed[slug] || 0) + 1;
        const iso = e.ts.toISOString();
        if (!lastViewed[slug] || iso > lastViewed[slug]) lastViewed[slug] = iso;
      }
    } else if (fresh) {
      launched[slug] = (launched[slug] || 0) + 1;
    }
  }
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://officepickemleague.com").replace(/\/$/, "");
  return (
    <OpsKits
      accounts={JSON.parse(JSON.stringify(accounts))}
      viewed={viewed}
      launched={launched}
      viewedAll={viewedAll}
      lastViewed={lastViewed}
      baseUrl={baseUrl}
    />
  );
}
