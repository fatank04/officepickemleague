import { current } from "@/lib/league";
import { getStandings } from "@/lib/standings";
import { prisma } from "@/lib/db";
import { truth, gameNet, type GameScore } from "@/lib/scoring";

export const dynamic = "force-dynamic";

const pct = (c: number, n: number) => (n ? Math.round((100 * c) / n) : 0);
const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`;
type Cat = { c: number; n: number };
const ec = (): Cat => ({ c: 0, n: 0 });

export default async function InsightsPage() {
  const ctx = (await current())!;
  const league = ctx.league;
  const myId = ctx.player.id;

  const view = await getStandings(league);
  const rows = view.rows;
  const N = rows.length;
  const rank = rows.findIndex((r) => r.playerId === myId) + 1;
  const me = rows.find((r) => r.playerId === myId) ?? { pts: 0, atsWins: 0, powerHits: 0, byWeek: {} as Record<number, number | null> };
  const leader = rows[0] ?? me;
  const avgPts = Math.round(rows.reduce((s, r) => s + r.pts, 0) / Math.max(1, N));
  const percentile = N > 1 ? Math.round(((N - rank) / (N - 1)) * 100) : 100;
  const behind = leader.pts - (me.pts ?? 0);

  const games = await prisma.game.findMany({
    where: { season: league.season, week: { gte: league.seasonStart, lte: league.seasonEnd } },
    orderBy: [{ week: "asc" }, { kickoff: "asc" }],
  });
  const allPicks = await prisma.pick.findMany({ where: { leagueId: league.id } });
  const tByGame = new Map<string, ReturnType<typeof truth>>();
  const wByGame = new Map<string, number>();
  for (const g of games) { tByGame.set(g.id, truth(g as unknown as GameScore)); wByGame.set(g.id, g.week); }
  const gradedWeeks = [...new Set(games.filter((g) => g.final).map((g) => g.week))].sort((a, b) => a - b);

  const perPlayer = new Map<string, { su: Cat; ats: Cat; ou: Cat }>();
  const myWeek = new Map<number, { su: Cat; ats: Cat; ou: Cat; made: number; correct: number }>();
  for (const w of gradedWeeks) myWeek.set(w, { su: ec(), ats: ec(), ou: ec(), made: 0, correct: 0 });
  for (const pk of allPicks) {
    const t = tByGame.get(pk.gameId); if (!t) continue;
    const w = wByGame.get(pk.gameId)!;
    let pc = perPlayer.get(pk.playerId);
    if (!pc) { pc = { su: ec(), ats: ec(), ou: ec() }; perPlayer.set(pk.playerId, pc); }
    (["su", "ats", "ou"] as const).forEach((cat) => {
      const sel = (pk as any)[cat]; if (!sel) return;
      const ok = sel === (t as any)[cat];
      pc![cat].n++; if (ok) pc![cat].c++;
      if (pk.playerId === myId) { const mw = myWeek.get(w); if (mw) { mw[cat].n++; mw.made++; if (ok) { mw[cat].c++; mw.correct++; } } }
    });
  }
  const mine = perPlayer.get(myId) ?? { su: ec(), ats: ec(), ou: ec() };
  const leagueCat = (cat: "su" | "ats" | "ou") => { let c = 0, n = 0; for (const v of perPlayer.values()) { c += v[cat].c; n += v[cat].n; } return pct(c, n); };
  const catRank = (cat: "su" | "ats" | "ou") => {
    const arr = [...perPlayer.entries()].map(([id, v]) => ({ id, p: v[cat].n ? v[cat].c / v[cat].n : 0 }));
    arr.sort((a, b) => b.p - a.p);
    return arr.findIndex((x) => x.id === myId) + 1;
  };

  const wk = gradedWeeks.map((w) => ({
    w,
    pts: (me.byWeek?.[w] ?? 0) as number,
    avg: Math.round(rows.reduce((s, r) => s + ((r.byWeek?.[w] ?? 0) as number), 0) / Math.max(1, N)),
    rec: myWeek.get(w)!,
  }));
  const best = wk.length ? wk.reduce((a, b) => (b.pts > a.pts ? b : a), wk[0]) : null;
  const lastWk = wk[wk.length - 1];
  const priorAvg = wk.length > 1 ? Math.round(wk.slice(0, -1).reduce((s, x) => s + x.pts, 0) / (wk.length - 1)) : lastWk?.pts ?? 0;
  const trendUp = lastWk ? lastWk.pts >= priorAvg : true;
  const maxBar = Math.max(1, ...wk.map((x) => Math.max(x.pts, x.avg)));

  const myPickByGame = new Map(allPicks.filter((p) => p.playerId === myId).map((p) => [p.gameId, p]));
  let sweeps = 0;
  for (const g of games) { if (!g.final) continue; if (gameNet(g as unknown as GameScore, myPickByGame.get(g.id) as any).sweep) sweeps++; }
  const overallC = mine.su.c + mine.ats.c + mine.ou.c;
  const overallN = mine.su.n + mine.ats.n + mine.ou.n;

  const A = "var(--accent)", MU = "var(--muted)", MU2 = "var(--muted2)", LN = "var(--line)", GOLD = "var(--gold)", BAD = "var(--bad)", PU = "var(--purp)", TX = "var(--text)";
  const cats: { key: "su" | "ats" | "ou"; label: string; col: string }[] = [
    { key: "su", label: "Winner", col: "#7fb2ff" },
    { key: "ats", label: "Spread", col: GOLD },
    { key: "ou", label: "Over / Under", col: PU },
  ];

  return (
    <>
      <h2>Insights</h2>
      <p className="muted small">Your season so far — how you're playing, and how it stacks up against the league.</p>

      <div className="card pad">
        <div className="row" style={{ gap: 10 }}>
          <span className="avatar" style={{ background: ctx.player.color, width: 42, height: 42, fontSize: 15 }}>{ctx.player.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <div className="b" style={{ fontSize: 17 }}>{ctx.player.name}</div>
            <div className="muted small">{ord(rank || N)} of {N} · top {percentile}% of the league</div>
          </div>
          <span className="ptsbadge" style={{ marginLeft: "auto", fontSize: 14, padding: "6px 13px" }}>{me.pts ?? 0} pts</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 14 }}>
          {[
            { n: `${ord(rank || N)}`, l: `of ${N} players` },
            { n: `${pct(overallC, overallN)}%`, l: `overall accuracy (${overallC}/${overallN})` },
            { n: best ? `${best.pts}` : "—", l: best ? `best week (W${best.w})` : "best week" },
            { n: `${me.pts ?? 0}`, l: behind > 0 ? `${behind} behind leader` : "league leader" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--panel2)", border: `1px solid ${LN}`, borderRadius: 12, padding: "12px 12px" }}>
              <div className="b" style={{ fontSize: 22, color: A }}>{s.n}</div>
              <div className="muted small" style={{ marginTop: 2, lineHeight: 1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card pad">
        <div className="spread" style={{ marginBottom: 4 }}>
          <div className="b">Weekly points — you vs. league average</div>
          <span className="chip" style={{ color: trendUp ? A : BAD, borderColor: trendUp ? "#234a6b" : "#5a2230" }}>{trendUp ? "▲ trending up" : "▼ cooling off"}</span>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>
          {lastWk ? <>Last week you scored <b style={{ color: TX }}>{lastWk.pts}</b> vs a league average of <b style={{ color: TX }}>{lastWk.avg}</b> — {lastWk.pts >= lastWk.avg ? `${lastWk.pts - lastWk.avg} above the field.` : `${lastWk.avg - lastWk.pts} below the field.`}</> : "Weekly scoring shows up here once games are graded."}
        </p>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", marginTop: 10, paddingTop: 6 }}>
          {wk.map((x) => (
            <div key={x.w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div className="small b" style={{ color: x.pts >= x.avg ? A : MU }}>{x.pts}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 92, width: "100%", justifyContent: "center" }}>
                <div title="You" style={{ width: 18, height: `${Math.round((x.pts / maxBar) * 100)}%`, minHeight: 4, background: `linear-gradient(180deg, ${A}, var(--accent-d))`, borderRadius: "4px 4px 0 0" }} />
                <div title="League avg" style={{ width: 18, height: `${Math.round((x.avg / maxBar) * 100)}%`, minHeight: 4, background: "var(--panel2)", border: `1px solid ${LN}`, borderRadius: "4px 4px 0 0" }} />
              </div>
              <div className="small" style={{ color: MU, fontWeight: 700 }}>W{x.w}</div>
              <div className="small" style={{ color: MU2 }}>{x.rec.correct}/{x.rec.made}</div>
            </div>
          ))}
        </div>
        <div className="row small" style={{ gap: 16, marginTop: 8, color: MU }}>
          <span className="row" style={{ gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: A, display: "inline-block" }} /> You</span>
          <span className="row" style={{ gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--panel2)", border: `1px solid ${LN}`, display: "inline-block" }} /> League average</span>
        </div>
      </div>

      <div className="card pad">
        <div className="b" style={{ marginBottom: 2 }}>Accuracy by pick type</div>
        <p className="muted small" style={{ marginTop: 0 }}>How often each call lands — and where you rank against all {N} players.</p>
        {cats.map(({ key, label, col }) => {
          const mp = pct(mine[key].c, mine[key].n);
          const lp = leagueCat(key);
          const cr = catRank(key);
          return (
            <div key={key} style={{ marginTop: 14 }}>
              <div className="spread" style={{ marginBottom: 6 }}>
                <span className="b" style={{ color: col }}>{label}</span>
                <span className="small" style={{ color: MU }}><b style={{ color: TX }}>{mine[key].c}/{mine[key].n}</b> · {mp}% · {ord(cr)} of {N}</span>
              </div>
              <div style={{ position: "relative", height: 12, background: "var(--panel2)", border: `1px solid ${LN}`, borderRadius: 999 }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${mp}%`, background: col, opacity: 0.85, borderRadius: 999 }} />
                <div title={`League avg ${lp}%`} style={{ position: "absolute", top: -3, bottom: -3, left: `calc(${lp}% - 1px)`, width: 2, background: TX, opacity: 0.7 }} />
              </div>
              <div className="small" style={{ color: MU2, marginTop: 4 }}>League average {lp}% {mp >= lp ? `· you're ${mp - lp} pts ahead` : `· ${lp - mp} pts behind`}</div>
            </div>
          );
        })}
      </div>

      <div className="card pad">
        <div className="b" style={{ marginBottom: 8 }}>How you stack up</div>
        <div className="spread small" style={{ color: MU }}><span>Overall rank</span><b style={{ color: TX }}>{ord(rank || N)} of {N} — top {percentile}%</b></div>
        <div style={{ height: 10, background: "var(--panel2)", border: `1px solid ${LN}`, borderRadius: 999, margin: "8px 0 12px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${percentile}%`, background: `linear-gradient(90deg, var(--accent-d), ${A})`, borderRadius: 999 }} />
        </div>
        <div className="spread small" style={{ color: MU, marginBottom: 6 }}><span>Your points vs. league average</span><b style={{ color: (me.pts ?? 0) >= avgPts ? A : BAD }}>{me.pts ?? 0} vs {avgPts} ({(me.pts ?? 0) >= avgPts ? "+" : ""}{(me.pts ?? 0) - avgPts})</b></div>
        <div className="spread small" style={{ color: MU }}><span>{behind > 0 ? "Behind the leader" : "You lead by"}</span><b style={{ color: TX }}>{behind > 0 ? `${behind} pts (${leader.name})` : `${(me.pts ?? 0) - (rows[1]?.pts ?? 0)} pts`}</b></div>

        <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <span className="chip">🔥 Best week: W{best?.w ?? "—"} · {best?.pts ?? 0} pts</span>
          <span className="chip" style={{ color: GOLD, borderColor: "#5a4a14", background: "#241d08" }}>🎯 {me.atsWins ?? 0} spread wins</span>
          <span className="chip">🔒 {me.powerHits ?? 0} Lock hits</span>
          {sweeps > 0 && <span className="chip" style={{ color: A }}>✨ {sweeps} clean sweep{sweeps > 1 ? "s" : ""}</span>}
        </div>
      </div>

      <p className="muted small">Insights update automatically as each week is graded.</p>
    </>
  );
}
