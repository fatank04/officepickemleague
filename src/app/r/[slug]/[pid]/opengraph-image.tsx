import { ImageResponse } from "next/og";
import { getCardData, pct } from "@/lib/cardstats";

export const runtime = "nodejs";
export const alt = "Office Pick'em weekly result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0A0E18", PANEL = "#0E1626", LINE = "#232C40", WHITE = "#F2F6FE", MUTE = "#93A1BC", FAINT = "#6B7894";

export default async function Image({ params }: { params: { slug: string; pid: string } }) {
  let d: Awaited<ReturnType<typeof getCardData>> = null;
  try { d = await getCardData(params.slug, params.pid); } catch { d = null; }

  if (!d) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BG, color: "#21e08a", fontSize: 56, fontWeight: 800 }}>
          Office Pick&apos;em League
        </div>
      ),
      size
    );
  }

  const a = d.league.accent;
  const mv = d.movement > 0 ? `Up ${d.movement} spots` : d.movement < 0 ? `Down ${-d.movement} spots` : "Holding steady";
  const chips = [d.lockHit ? "LOCK HIT" : null, d.sweep ? "CLEAN SWEEP" : null].filter(Boolean) as string[];

  const cell = (c: number, n: number, hero: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: 130 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: hero ? a : WHITE }}>{n ? `${c}/${n}` : "-"}</div>
      <div style={{ fontSize: 18, color: FAINT }}>{n ? `${pct(c, n)}%` : ""}</div>
    </div>
  );
  const row = (label: string, x: { wc: number; wn: number; sc: number; sn: number }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
      <div style={{ fontSize: 28, color: WHITE }}>{label}</div>
      <div style={{ display: "flex" }}>{cell(x.wc, x.wn, true)}{cell(x.sc, x.sn, false)}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BG, padding: 60 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 44, height: 16, background: a, borderRadius: 4, marginRight: 18 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: a, letterSpacing: 2 }}>{d.league.name.toUpperCase()} PICK&apos;EM  ·  WEEK {d.week}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 36 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
            <div style={{ fontSize: 70, fontWeight: 800, color: WHITE }}>{d.player.name}</div>
            <div style={{ display: "flex", alignItems: "flex-end", marginTop: 14 }}>
              <div style={{ fontSize: 96, fontWeight: 800, color: a, lineHeight: 1 }}>{d.seasonPts}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: FAINT, letterSpacing: 2, marginLeft: 20, marginBottom: 14 }}>POINTS</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: WHITE, marginTop: 8 }}>{d.weekPts >= 0 ? "+" : ""}{d.weekPts} this week</div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 30 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: WHITE }}>{d.rank} of {d.of}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: a, marginLeft: 22 }}>{mv}</div>
            </div>
            <div style={{ display: "flex", marginTop: 26 }}>
              {chips.map((t) => (
                <div key={t} style={{ display: "flex", border: `2px solid ${a}`, color: a, background: "#0E2A1E", borderRadius: 24, padding: "8px 20px", fontSize: 24, fontWeight: 700, marginRight: 16 }}>{t}</div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: 460, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: FAINT, letterSpacing: 2 }}>ACCURACY</div>
              <div style={{ display: "flex" }}>
                <div style={{ width: 130, textAlign: "right", fontSize: 18, fontWeight: 700, color: FAINT }}>THIS WK</div>
                <div style={{ width: 130, textAlign: "right", fontSize: 18, fontWeight: 700, color: FAINT }}>SEASON</div>
              </div>
            </div>
            <div style={{ display: "flex", height: 1, background: LINE, marginTop: 14 }} />
            {row("Winner", d.acc.su)}
            {row("Spread", d.acc.ats)}
            {row("Over / Under", d.acc.ou)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 28, borderTop: `1px solid ${LINE}` }}>
          <div style={{ fontSize: 26, color: FAINT }}>Office Pick&apos;em League</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: a }}>Join the league  →  officepickemleague.com</div>
        </div>
      </div>
    ),
    size
  );
}
