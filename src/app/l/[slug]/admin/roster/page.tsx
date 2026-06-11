import Link from "next/link";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import RosterClient, { RosterRow } from "./RosterClient";

export const dynamic = "force-dynamic";

export default async function RosterPage({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug)
    return <main style={{ padding: 24, color: "#eef", fontFamily: "system-ui" }}>Sign in to view.</main>;
  if (!ctx.player.isCommish)
    return <main style={{ padding: 24, color: "#eef", fontFamily: "system-ui" }}>Commissioner only.</main>;

  const players = await prisma.player.findMany({ where: { leagueId: ctx.league.id }, orderBy: { name: "asc" } });
  const rows: RosterRow[] = players.map((p) => ({
    id: p.id, name: p.name, isCommish: p.isCommish, isMe: p.id === ctx.player.id,
    hasPhone: !!p.phone, consented: !!p.smsConsentAt, optedOut: !!p.smsOptOut,
    locked: !!(p.lockedUntil && p.lockedUntil > new Date()),
  }));

  return (
    <main style={{ padding: 24, color: "#eef3fa", fontFamily: "system-ui", maxWidth: 880, margin: "0 auto" }}>
      <Link href={`/l/${ctx.league.slug}/admin`} style={{ color: "#7aa2ff", textDecoration: "none", fontSize: 13 }}>← Console</Link>
      <h1 style={{ margin: "6px 0 2px" }}>Roster</h1>
      <p style={{ color: "#93a1bc", fontSize: 13, marginTop: 0 }}>{rows.length} players in {ctx.league.name}.</p>
      <RosterClient slug={ctx.league.slug} rows={rows} />
    </main>
  );
}
