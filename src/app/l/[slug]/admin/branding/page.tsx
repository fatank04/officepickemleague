import Link from "next/link";
import { current } from "@/lib/league";
import BrandingClient from "./BrandingClient";

export const dynamic = "force-dynamic";

export default async function BrandingPage({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug)
    return <div className="card pad muted">Sign in to view.</div>;
  if (!ctx.player.isCommish)
    return <div className="card pad muted">Commissioner only.</div>;

  const l = ctx.league as any;
  return (
    <>
      <Link href={`/l/${ctx.league.slug}/admin`} className="muted small">← Console</Link>
      <div className="app-kicker" style={{ marginTop: 6 }}>Commissioner</div>
      <h2 style={{ margin: "0 0 2px" }}>Branding &amp; prizes</h2>
      <p className="muted small" style={{ marginTop: 0 }}>How your league looks to players, and what they&apos;re playing for.</p>
      <BrandingClient
        initial={{
          name: ctx.league.name,
          accentColor: l.accentColor ?? "",
          prizeText: l.prizeText ?? "",
          welcomeMessage: l.welcomeMessage ?? "",
          logoUrl: l.logoUrl ?? "",
          homeTeam: l.homeTeam ?? "",
          fullSlate: !!l.fullSlate,
        }}
      />
    </>
  );
}
