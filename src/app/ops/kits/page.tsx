import { redirect } from "next/navigation";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";
import OpsKits from "./OpsKits";

export const dynamic = "force-dynamic";

/**
 * Everything before this timestamp was us, not a buyer: QR proofing before the drop, plus a round
 * of curl health checks on Jul 30 that logged five scans against real companies. Kits were
 * delivered Jul 29 and no genuine scan had come in as of this cutoff, so starting the count here
 * loses nothing real. Going forward the user-agent gate on /kit/[slug] keeps tooling out of the
 * data, so this baseline shouldn't need moving again. Lifetime counts stay in the tooltip.
 */
const BASELINE = new Date("2026-07-31T01:35:00Z"); // just after the last self-inflicted scan

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
