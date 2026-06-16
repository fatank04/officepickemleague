import { prisma } from "@/lib/db";
import { opsAuthed } from "@/lib/ops";

// CSV export of mailing addresses for batch postage (Pirate Ship / Stamps.com import).
export async function GET(req: Request) {
  if (!opsAuthed()) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";
  const metro = url.searchParams.get("metro") || "all";
  const where: any = {};
  if (status !== "all") where.status = status;
  if (metro !== "all") where.metro = metro;
  const rows = await prisma.kitAccount.findMany({ where, orderBy: [{ metro: "asc" }, { company: "asc" }] });

  const headers = ["Name", "Company", "Address1", "Address2", "City", "State", "Zip", "Country"];
  const esc = (v: any) => { const s = (v ?? "").toString(); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [headers.join(",")];
  for (const a of rows) {
    lines.push([a.contact || "", a.company, a.addr1 || "", a.addr2 || "", a.city || "", a.state || "", a.zip || "", "US"].map(esc).join(","));
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="kit-addresses.csv"` },
  });
}
