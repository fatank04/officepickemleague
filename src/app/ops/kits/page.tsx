import { redirect } from "next/navigation";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";
import OpsKits from "./OpsKits";

export const dynamic = "force-dynamic";

/**
 * Everything before this timestamp was us, not a buyer. Twice now our own traffic has read as
 * demand: curl health checks on Jul 30 logged five scans against real Pittsburgh companies, then
 * checkout testing on Aug 2 logged more from a real browser (which the user-agent gate can't
 * catch, because it IS a real browser).
 *
 * Moving the baseline hides nothing — every event stays in the table and lifetime counts stay in
 * the chip tooltip. To test a kit page from now on, append ?src=test: those views are excluded
 * below, so this baseline shouldn't need moving a third time.
 */
const BASELINE = new Date("2026-08-03T01:25:00Z"); // just after checkout testing, before Monday's calls

export default async function OpsKitsPage() {
  if (!opsAuthed()) redirect("/ops");
  const accounts = await prisma.kitAccount.findMany({ orderBy: [{ metro: "asc" }, { company: "asc" }] });
  const evs = await prisma.event.findMany({
    where: { type: { in: ["kit_viewed", "kit_launched", "kit_signup"] } },
    select: { type: true, meta: true, ts: true },
  });
  const viewed: Record<string, number> = {};
  const launched: Record<string, number> = {};
  const viewedAll: Record<string, number> = {};
  const lastViewed: Record<string, string> = {};
  const signups: Record<string, number> = {};
  for (const e of evs) {
    const slug = (e.meta as any)?.slug;
    if (!slug) continue;
    // Our own testing, tagged at the URL (?src=test). Counts toward lifetime, never toward demand.
    const ours = (e.meta as any)?.src === "test";
    const fresh = e.ts >= BASELINE && !ours;
    if (e.type === "kit_viewed") {
      viewedAll[slug] = (viewedAll[slug] || 0) + 1;
      if (fresh) {
        viewed[slug] = (viewed[slug] || 0) + 1;
        const iso = e.ts.toISOString();
        if (!lastViewed[slug] || iso > lastViewed[slug]) lastViewed[slug] = iso;
      }
    } else if (e.type === "kit_signup") {
      signups[slug] = (signups[slug] || 0) + 1;
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
      signups={signups}
      baseUrl={baseUrl}
      baselineLabel={BASELINE.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}
    />
  );
}
