import { redirect } from "next/navigation";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";
import OpsOrders from "./OpsOrders";

export const dynamic = "force-dynamic";

/**
 * The signed column of the Friday gate. /ops/kits answers "who looked"; this answers "who's
 * actually buying" — cards saved for kickoff, invoices waiting to go out, and the dollar total
 * committed for Sept 9.
 *
 * Orders tagged src=test are ours (checkout smoke tests). They're kept, not deleted, but excluded
 * from every headline number — the same lesson as the scan baseline: never let our own traffic
 * read as demand.
 */
export default async function OpsOrdersPage() {
  if (!opsAuthed()) redirect("/ops");
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return <OpsOrders orders={JSON.parse(JSON.stringify(orders))} />;
}
