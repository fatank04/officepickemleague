import Link from "next/link";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { nflWeek } from "@/lib/odds";
import { isGameLocked } from "@/lib/lock";
import DangerZone from "@/components/DangerZone";

export const dynamic = "force-dynamic";

export default async function AdminHome({ params }: { params: { slug: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug) return <div className="card pad muted">Sign in to view.</div>;
  if (!ctx.player.isCommish) return <div className="card pad muted">Commissioner only.</div>;

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

  const tiles = [
    { href: `/l/${league.slug}/admin/roster`, ico: "👥", t: "Roster", d: "Add/remove players, reset PINs, manage commissioners, resend text invites." },
    { href: `/l/${league.slug}/admin/games`, ico: "🏈", t: "Games & scores", d: "Correct a final score, regrade a week, fix a missing line before kickoff." },
    { href: `/l/${league.slug}/admin/branding`, ico: "🎨", t: "Branding & prizes", d: "League name, accent color, the prize players are competing for, welcome note." },
    { href: `/l/${league.slug}/health`, ico: "📈", t: "Engagement & health", d: "Opt-in %, weekly-active, retention, and how many play by web / text / phone." },
    { href: `/l/${league.slug}/admin/sheets`, ico: "📄", t: "Paper pick sheets", d: "Print the weekly stack for the break room — players check boxes, snap a photo, text it in." },
  ];

  return (
    <>
      <div className="spread" style={{ marginBottom: 4 }}>
        <div>
          <div className="app-kicker">Commissioner</div>
          <h2 style={{ margin: 0 }}>{league.name}</h2>
        </div>
        <span className="chip">Season {league.season} · Week {week}</span>
      </div>
      <p className="muted small">Two minutes a week, fancy title included.</p>

      <div className="card pad">
        <div className="b" style={{ marginBottom: 10 }}>This week at a glance</div>
        <div className="row">
          <span className={`chip ${linesLoaded ? "ok" : "bad"}`}>{linesLoaded ? `Lines loaded (${games.length})` : "No lines yet"}</span>
          <span className="chip">{lockedCount} of {games.length || 0} games locked</span>
          <span className={`chip ${ungraded === 0 ? "ok" : "warn"}`}>{ungraded === 0 ? "No grading gaps" : `${ungraded} finished, ungraded`}</span>
          <span className="muted small">· {roster} players · {optedIn} reachable by text</span>
        </div>
        {ungraded > 0 && (
          <div className="muted small" style={{ marginTop: 8, color: "var(--gold)" }}>
            Tip: open Games &amp; scores → Regrade week to clear ungraded finals.
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        {tiles.map((c) => (
          <Link key={c.href} href={c.href} className="card pad cardlink" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.ico}</div>
            <div className="b">{c.t}</div>
            <div className="muted small" style={{ marginTop: 4, lineHeight: 1.5 }}>{c.d}</div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <DangerZone leagueName={league.name} />
      </div>
    </>
  );
}
