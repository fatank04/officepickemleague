import { current } from "@/lib/league";
import { getStandings } from "@/lib/standings";
import ShareButton from "./ShareButton";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const ctx = (await current())!;
  const league = ctx.league;
  const view = await getStandings(league);
  const meId = ctx.player.id;
  const av = (name: string, color: string) => (
    <span className="avatar" style={{ background: color, width: 26, height: 26 }}>{name.slice(0, 2).toUpperCase()}</span>
  );

  if (view.playoff) {
    const { quals, nons } = view.playoff;
    const colorOf = (id: string) => view.rows.find((r) => r.playerId === id)?.color ?? "#1ed47a";
    return (
      <>
        <h2>Playoffs</h2>
        <p className="muted small">
          Weeks {league.seasonStart}–{Math.min(league.playoffStart - 1, league.seasonEnd)} seed the bracket; top {league.playoffTeams} advance.
          Title = seed bonus ((teams − seed) × {league.seedStep}) + playoff points.
        </p>
        <ShareButton slug={league.slug} pid={meId} />
        <div className="card">
          <div className="pad b" style={{ borderBottom: "1px solid var(--line)" }}>🏆 Bracket — top {league.playoffTeams}</div>
          <table>
            <thead>
              <tr><th>#</th><th>Seed</th><th>Player</th><th className="num">Reg</th><th className="num">Bonus</th><th className="num">Playoff</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {quals.map((q, i) => (
                <tr key={q.playerId} className={q.playerId === meId ? "me" : ""}>
                  <td>{i + 1}</td>
                  <td>{q.seed}</td>
                  <td><div className="row" style={{ gap: 8 }}>{av(q.name, colorOf(q.playerId))} <b>{q.name}</b></div></td>
                  <td className="num muted">{q.reg}</td>
                  <td className="num">+{q.bonus}</td>
                  <td className="num">{q.playoff}</td>
                  <td className="num"><b>{q.finalTotal}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {nons.length > 0 && (
          <div className="card">
            <div className="pad b" style={{ borderBottom: "1px solid var(--line)" }}>Missed the cut</div>
            <table><tbody>
              {nons.map((n) => (
                <tr key={n.playerId} className={n.playerId === meId ? "me" : ""} style={{ opacity: 0.6 }}>
                  <td><div className="row" style={{ gap: 8 }}>{av(n.name, colorOf(n.playerId))} <b>{n.name}</b></div></td>
                  <td className="num muted">{n.reg} reg pts</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
      </>
    );
  }

  const top3 = view.rows.slice(0, 3);
  return (
    <>
      <h2>Standings</h2>
      <p className="muted small">Season-long race, Weeks {league.seasonStart}–{league.seasonEnd}. Tiebreaker: The Gauntlet.</p>
      <ShareButton slug={league.slug} pid={meId} />
      {top3.length === 3 && (
        <div className="podium">
          <div className="stand p2"><div className="muted">🥈</div><div className="nm">{top3[1].name}</div><div className="pts">{top3[1].pts} pts</div></div>
          <div className="stand p1"><div className="muted">🥇</div><div className="nm">{top3[0].name}</div><div className="pts">{top3[0].pts} pts</div></div>
          <div className="stand p3"><div className="muted">🥉</div><div className="nm">{top3[2].name}</div><div className="pts">{top3[2].pts} pts</div></div>
        </div>
      )}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Player</th>
              {view.weeks.map((w) => <th key={w} className="num">W{w}</th>)}
              <th className="num">ATS</th><th className="num">🔒</th><th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((r, i) => (
              <tr key={r.playerId} className={r.playerId === meId ? "me" : ""}>
                <td>{i + 1}</td>
                <td><div className="row" style={{ gap: 8 }}>{av(r.name, r.color)} <b>{r.name}</b></div></td>
                {view.weeks.map((w) => <td key={w} className="num">{r.byWeek[w] ?? "—"}</td>)}
                <td className="num muted">{r.atsWins}</td>
                <td className="num muted">{r.powerHits}</td>
                <td className="num"><b>{r.pts}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {view.rows.every((r) => r.pts === 0) && (
        <p className="muted small">Nobody&apos;s won squat yet. Patience.</p>
      )}
    </>
  );
}
