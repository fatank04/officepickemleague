import { current } from "@/lib/league";
import { getStandings } from "@/lib/standings";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const ctx = (await current())!;
  const view = await getStandings(ctx.league);
  const me = view.rows.find((r) => r.playerId === ctx.player.id);
  const rank = view.rows.findIndex((r) => r.playerId === ctx.player.id) + 1;

  return (
    <>
      <h2>Insights</h2>
      <p className="muted small">Your season so far.</p>
      <div className="card pad">
        <div className="row" style={{ gap: 10, marginBottom: 10 }}>
          <span className="avatar" style={{ background: ctx.player.color, width: 40, height: 40 }}>
            {ctx.player.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="b">{ctx.player.name}</div>
            <div className="muted small">Rank #{rank || "—"} of {view.rows.length}</div>
          </div>
          <span className="ptsbadge" style={{ marginLeft: "auto" }}>{me?.pts ?? 0} pts</span>
        </div>
        <div className="spread" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
          <span className="muted">Correct spreads (ATS)</span><b>{me?.atsWins ?? 0}</b>
        </div>
        <div className="spread"><span className="muted">🔒 Power-Pick hits</span><b>{me?.powerHits ?? 0}</b></div>
      </div>
      <p className="muted small">
        More insights — pick distribution, badges, league tendencies, weekly winners — unlock as the season plays out.
      </p>
    </>
  );
}
