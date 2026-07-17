import Link from "next/link";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import RosterClient, { RosterRow } from "./RosterClient";

export const dynamic = "force-dynamic";

export default async function RosterPage({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug)
    return <div className="card pad muted">Sign in to view.</div>;
  if (!ctx.player.isCommish)
    return <div className="card pad muted">Commissioner only.</div>;

  const players = await prisma.player.findMany({ where: { leagueId: ctx.league.id }, orderBy: { name: "asc" } });
  const rows: RosterRow[] = players.map((p) => ({
    id: p.id, name: p.name, isCommish: p.isCommish, isMe: p.id === ctx.player.id,
    hasPhone: !!p.phone, consented: !!p.smsConsentAt, optedOut: !!p.smsOptOut,
    locked: !!(p.lockedUntil && p.lockedUntil > new Date()),
  }));

  return (
    <>
      <Link href={`/l/${ctx.league.slug}/admin`} className="muted small">← Console</Link>
      <div className="app-kicker" style={{ marginTop: 6 }}>Commissioner</div>
      <h2 style={{ margin: "0 0 2px" }}>Roster</h2>
      <p className="muted small" style={{ marginTop: 0 }}>{rows.length} players in {ctx.league.name}.</p>
      <RosterClient slug={ctx.league.slug} rows={rows} />
    </>
  );
}
