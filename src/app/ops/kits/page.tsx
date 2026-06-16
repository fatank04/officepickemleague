import { redirect } from "next/navigation";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";
import OpsKits from "./OpsKits";

export const dynamic = "force-dynamic";

export default async function OpsKitsPage() {
  if (!opsAuthed()) redirect("/ops");
  const accounts = await prisma.kitAccount.findMany({ orderBy: [{ metro: "asc" }, { company: "asc" }] });
  const evs = await prisma.event.findMany({ where: { type: { in: ["kit_viewed", "kit_launched"] } }, select: { type: true, meta: true } });
  const viewed: Record<string, number> = {};
  const launched: Record<string, number> = {};
  for (const e of evs) {
    const slug = (e.meta as any)?.slug;
    if (!slug) continue;
    if (e.type === "kit_viewed") viewed[slug] = (viewed[slug] || 0) + 1;
    else launched[slug] = (launched[slug] || 0) + 1;
  }
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://officepickemleague.com").replace(/\/$/, "");
  return <OpsKits accounts={JSON.parse(JSON.stringify(accounts))} viewed={viewed} launched={launched} baseUrl={baseUrl} />;
}
