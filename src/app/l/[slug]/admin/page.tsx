import Link from "next/link";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { nflWeek } from "@/lib/odds";
import { isGameLocked } from "@/lib/lock";
import DangerZone from "@/components/DangerZone";

export const dynamic = "force-dynamic";

const wrap: React.CSSProperties = { padding: 24, color: "#eef3fa", fontFamily: "system-ui", maxWidth: 880, margin: "0 auto" };
const card: React.CSSProperties = { display: "block", background: "#141c2e", border: "1px solid #2a3550", borderRadius: 12, padding: 18, textDecoration: "none", color: "#eef3fa" };
const mut: React.CSSProperties = { color: "#93a1bc", fontSize: 13 };
const pill = (ok: boolean): React.CSSProperties => ({ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: ok ? "#103a28" : "#3a1414", color: ok ? "#21e08a" : "#ff7a7a", border: `1px solid ${ok ? "#1c6b48" : "#6b1c1c"}` });

export default async function AdminHome({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug) return <main style={wrap}>Sign in to view.</main>;
  if (!ctx.player.isCommish) return <main style={wrap}>Commissioner only.</main>;

  const { league } = ctx;
  const now = new Date();
  const week = nflWeek(now);
  const [roster, games] = await Promise.all([
    prisma.player.count({ where: { leagueId: league.id } }),
    prisma.game.findMany({ where: { season: league.season, week } }),
  ]);
  const optedIn = await prisma.player.count({ where: { leagueId: league.id, phone: { not: null }, smsConsentAt: { not: null }, smsOptOut: false } });
  const linesLoaded = games.length > 0;
  const ungraded = games.filter((g) => isGameLocked(g, now) && !g.final).length;
  const lockedCount = games.filter((g) => isGameLocked(g, now)).length;

  return (
    <main style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0 }}>{league.name} · Commissioner</h1>
        <span style={mut}>Season {league.season} · current week {week}</span>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>This week at a glance</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={pill(linesLoaded)}>{linesLoaded ? `Lines loaded (${games.length})` : "No lines yet"}</span>
          <span style={pill(true)}>{lockedCount} of {games.length || 0} games locked</span>
          <span style={pill(ungraded === 0)}>{ungraded === 0 ? "No grading gaps" : `${ungraded} finished, ungraded`}</span>
          <span style={mut}>· {roster} players · {optedIn} reachable by text</span>
        </div>
        {ungraded > 0 && <div style={{ ...mut, marginTop: 8, color: "#ffb86b" }}>Tip: open Games &amp; scores → Regrade week to clear ungraded finals.</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 12 }}>
        <Link href={`/l/${league.slug}/admin/roster`} style={card}>
          <div style={{ fontWeight: 700 }}>Roster</div>
          <div style={mut}>Add/remove players, reset PINs, manage commissioners, resend text invites.</div>
        </Link>
        <Link href={`/l/${league.slug}/admin/games`} style={card}>
          <div style={{ fontWeight: 700 }}>Games &amp; scores</div>
          <div style={mut}>Correct a final score, regrade a week, fix a missing line before kickoff.</div>
        </Link>
        <Link href={`/l/${league.slug}/admin/branding`} style={card}>
          <div style={{ fontWeight: 700 }}>Branding &amp; prizes</div>
          <div style={mut}>League name, accent color, the prize players are competing for, welcome note.</div>
        </Link>
        <Link href={`/l/${league.slug}/health`} style={card}>
          <div style={{ fontWeight: 700 }}>Engagement &amp; health</div>
          <div style={mut}>Opt-in %, weekly-active, retention, and how many play by web / text / phone.</div>
        </Link>
      </div>

      <DangerZone leagueName={league.name} />
    </main>
  );
}
