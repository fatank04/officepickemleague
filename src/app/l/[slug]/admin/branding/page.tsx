import Link from "next/link";
import { current } from "@/lib/league";
import BrandingClient from "./BrandingClient";

export const dynamic = "force-dynamic";

export default async function BrandingPage({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug)
    return <main style={{ padding: 24, color: "#eef", fontFamily: "system-ui" }}>Sign in to view.</main>;
  if (!ctx.player.isCommish)
    return <main style={{ padding: 24, color: "#eef", fontFamily: "system-ui" }}>Commissioner only.</main>;

  const l = ctx.league as any;
  return (
    <main style={{ padding: 24, color: "#eef3fa", fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <Link href={`/l/${ctx.league.slug}/admin`} style={{ color: "#7aa2ff", textDecoration: "none", fontSize: 13 }}>← Console</Link>
      <h1 style={{ margin: "6px 0 2px" }}>Branding &amp; prizes</h1>
      <p style={{ color: "#93a1bc", fontSize: 13, marginTop: 0 }}>How your league looks to players, and what they're playing for.</p>
      <BrandingClient
        initial={{
          name: ctx.league.name,
          accentColor: l.accentColor ?? "",
          prizeText: l.prizeText ?? "",
          welcomeMessage: l.welcomeMessage ?? "",
          logoUrl: l.logoUrl ?? "",
        }}
      />
    </main>
  );
}
