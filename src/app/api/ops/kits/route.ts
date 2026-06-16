import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { opsAuthed } from "@/lib/ops";
import { slugifyCompany } from "@/lib/kits";

const FIELDS = ["metro","teamCity","teamName","accent","contact","contactTitle","email","addr1","addr2","city","state","zip","notes"] as const;
function clean(r: any) {
  const out: Record<string, any> = {};
  for (const f of FIELDS) out[f] = (r?.[f]?.toString().trim() || null);
  return out;
}

export async function POST(req: Request) {
  if (!opsAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  if (action === "create" || action === "update") {
    const d = body.account || {};
    if (!d.company?.toString().trim()) return NextResponse.json({ error: "Company is required." }, { status: 400 });
    const data = { company: d.company.toString().trim(), status: d.status || "draft", ...clean(d) };
    if (action === "create") {
      const slug = (d.slug?.toString().trim() || slugifyCompany(data.company)).toLowerCase();
      if (await prisma.kitAccount.findUnique({ where: { slug } }))
        return NextResponse.json({ error: `Slug "${slug}" already exists.` }, { status: 409 });
      const created = await prisma.kitAccount.create({ data: { slug, ...data } });
      return NextResponse.json({ ok: true, id: created.id, slug });
    }
    await prisma.kitAccount.update({ where: { id: body.id }, data });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await prisma.kitAccount.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  if (action === "setStatus") {
    await prisma.kitAccount.update({
      where: { id: body.id },
      data: { status: body.status, mailedAt: body.status === "mailed" ? new Date() : null },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "import") {
    const rows = Array.isArray(body.rows) ? body.rows : [];
    let created = 0, skipped = 0; const errors: string[] = [];
    for (const r of rows) {
      const company = r.company?.toString().trim();
      if (!company) { skipped++; continue; }
      const slug = (r.slug?.toString().trim() || slugifyCompany(company)).toLowerCase();
      if (await prisma.kitAccount.findUnique({ where: { slug } })) { skipped++; errors.push(`dup: ${slug}`); continue; }
      await prisma.kitAccount.create({ data: { slug, company, status: "draft", ...clean(r) } });
      created++;
    }
    return NextResponse.json({ ok: true, created, skipped, errors: errors.slice(0, 10) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
