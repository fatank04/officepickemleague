import Link from "next/link";
import type { Metadata } from "next";
import { getCardData, pct, ordinal } from "@/lib/cardstats";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string; pid: string } }): Promise<Metadata> {
  const d = await getCardData(params.slug, params.pid);
  if (!d) return { title: "Office Pick'em League" };
  const desc = `${d.weekPts >= 0 ? "+" : ""}${d.weekPts} pts · ${ordinal(d.rank)} of ${d.of} · Winner ${pct(d.acc.su.wc, d.acc.su.wn)}% · Spread ${pct(d.acc.ats.wc, d.acc.ats.wn)}% · O/U ${pct(d.acc.ou.wc, d.acc.ou.wn)}%`;
  const title = `${d.player.name} — Week ${d.week} · ${d.league.name} Pick'em`;
  return { title, description: desc, openGraph: { title, description: desc, type: "website" }, twitter: { card: "summary_large_image", title, description: desc } };
}

const C = { bg: "#0A0E18", card: "#0d1424", panel: "#0E1626", line: "#232C40", white: "#F2F6FE", mute: "#93A1BC", faint: "#6B7894" };

function Cat({ label, a, accent }: { label: string; a: { wc: number; wn: number; sc: number; sn: number }; accent: string }) {
  const cell = (c: number, n: number, hero: boolean) => (
    <td style={{ textAlign: "right", padding: "7px 0" }}>
      <div style={{ fontWeight: 700, fontSize: 18, color: hero ? accent : C.white }}>{n ? `${c}/${n}` : "—"}</div>
      <div style={{ fontSize: 11, color: C.faint }}>{n ? `${pct(c, n)}%` : ""}</div>
    </td>
  );
  return (
    <tr>
      <td style={{ color: C.white, fontSize: 15, padding: "7px 0" }}>{label}</td>
      {cell(a.wc, a.wn, true)}
      {cell(a.sc, a.sn, false)}
    </tr>
  );
}

export default async function SharePage({ params }: { params: { slug: string; pid: string }; searchParams: { w?: string } }) {
  const d = await getCardData(params.slug, params.pid);
  const wrap: React.CSSProperties = { minHeight: "100vh", background: C.bg, color: C.white, fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px", gap: 18 };

  if (!d) {
    return (
      <main style={wrap}>
        <div style={{ color: C.mute, marginTop: 40 }}>This card isn’t ready yet — check back after the week is scored.</div>
        <Link href={`/j/${params.slug}`} style={{ background: "#21e08a", color: "#06140d", fontWeight: 700, padding: "12px 20px", borderRadius: 10, textDecoration: "none" }}>Join the league →</Link>
      </main>
    );
  }
  const acc = d.league.accent;
  const mv = d.movement > 0 ? `▲ up ${d.movement}` : d.movement < 0 ? `▼ down ${-d.movement}` : "holding steady";
  const chip = (txt: string) => (
    <span style={{ border: `1px solid ${acc}`, color: acc, background: "#0E2A1E", borderRadius: 16, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>{txt}</span>
  );

  return (
    <main style={wrap}>
      <div style={{ width: "100%", maxWidth: 560, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ width: 22, height: 8, borderRadius: 2, background: acc, display: "inline-block" }} />
          <span style={{ color: acc, fontWeight: 700, fontSize: 12.5, letterSpacing: 1.2, textTransform: "uppercase" }}>{d.league.name} Pick'em · Week {d.week}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{d.player.name}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: acc }}>{d.seasonPts}</span>
              <span style={{ color: C.faint, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>POINTS</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{d.weekPts >= 0 ? "+" : ""}{d.weekPts} this week</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 14 }}>{ordinal(d.rank)} of {d.of}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: acc, marginTop: 2 }}>{mv}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {d.lockHit && chip("LOCK HIT")}
              {d.sweep && chip("CLEAN SWEEP")}
            </div>
          </div>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 18px", minWidth: 230 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", color: C.faint, fontSize: 12.5, fontWeight: 700, letterSpacing: 1, paddingBottom: 6 }}>ACCURACY</th>
                  <th style={{ textAlign: "right", color: C.faint, fontSize: 11.5, fontWeight: 700, paddingBottom: 6 }}>THIS WK</th>
                  <th style={{ textAlign: "right", color: C.faint, fontSize: 11.5, fontWeight: 700, paddingBottom: 6 }}>SEASON</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${C.line}` }}>
                <Cat label="Winner" a={d.acc.su} accent={acc} />
                <Cat label="Spread" a={d.acc.ats} accent={acc} />
                <Cat label="Over / Under" a={d.acc.ou} accent={acc} />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Link href={`/j/${d.league.slug}`} style={{ background: acc, color: "#06140d", fontWeight: 800, padding: "14px 26px", borderRadius: 12, textDecoration: "none", fontSize: 16 }}>Join {d.league.name} →</Link>
        <Link href="/" style={{ color: C.mute, fontSize: 13, textDecoration: "none" }}>or start your own free league — no money, no app</Link>
      </div>
    </main>
  );
}
