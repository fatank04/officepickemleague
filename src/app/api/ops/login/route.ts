import { NextResponse } from "next/server";
import { checkOpsKey, setOpsCookie } from "@/lib/ops";

export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({}));
  if (!checkOpsKey(key)) return NextResponse.json({ error: "Wrong key." }, { status: 401 });
  setOpsCookie();
  return NextResponse.json({ ok: true });
}
