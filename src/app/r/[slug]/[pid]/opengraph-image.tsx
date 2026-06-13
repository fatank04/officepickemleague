import { ImageResponse } from "next/og";
import { getCardData, pct } from "@/lib/cardstats";

export const runtime = "nodejs";
export const alt = "Office Pick'em weekly result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0A0E18", PANEL = "#0E1626", LINE = "#232C40", WHITE = "#F2F6FE", FAINT = "#6B7894";

// Satori requires display:flex on every div with >1 child. We set it on ALL divs to be safe.
const F = (extra: Record<string, any> = {}) => ({ display: "flex", ...extra });

export default async function Image({ params }: { params: { slug: string; pid: string } }) {
  let d: Awaited<ReturnType<typeof getCardData>> = null;
  try { d = await getCardData(params.slug, params.pid); } catch { d = null; }

  if (!d) {
    return new ImageResponse(
      <div style={F({ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: BG, color: "#4f8cff", fontSize: 56, fontWeight: 800 })}>Office Pick&apos;em League</div>,
      size
    );
  }

  const a = d.league.accent;
  const mv = d.movement > 0 ? `Up ${d.movement} spots` : d.movement < 0 ? `Down ${-d.movement} spots` : "Holding steady";
  const chips = [d.lockHit ? "LOCK HIT" : null, d.sweep ? "CLEAN SWEEP" : null].filter(Boolean) as string[];

  const cell = (c: number, n: number, hero: boolean) => (
    <div style={F({ flexDirection: "column", alignItems: "flex-end", width: 130 })}>
      <div style={F({ fontSize: 28, fontWeight: 800, color: hero ? a : WHITE })}>{n ? `${c}/${n}` : "-"}</div>
      <div style={F({ fontSize: 15, color: FAINT })}>{n ? `${pct(c, n)}%` : " "}</div>
    </div>
  );
  const row = (label: string, x: { wc: number; wn: number; sc: number; sn: number }) => (
    <div style={F({ alignItems: "center", justifyContent: "space-between", marginTop: 14 })}>
      <div style={F({ fontSize: 28, color: WHITE })}>{label}</div>
      <div style={F({})}>{cell(x.wc, x.wn, true)}{cell(x.sc, x.sn, false)}</div>
    </div>
  );

  return new ImageResponse(
    <div style={F({ width: "100%", height: "100%", flexDirection: "column", background: BG, padding: 50 })}>
      <div style={F({ alignItems: "center" })}>
        <div style={F({ width: 44, height: 16, background: a, borderRadius: 4, marginRight: 18 })} />
        <div style={F({ fontSize: 28, fontWeight: 700, color: a, letterSpacing: 2 })}>{`${d.league.name.toUpperCase()} PICK'EM  ·  WEEK ${d.week}`}</div>
      </div>

      <div style={F({ justifyContent: "space-between", marginTop: 22 })}>
        <div style={F({ flexDirection: "column", width: 560 })}>
          <div style={F({ fontSize: 56, fontWeight: 800, color: WHITE })}>{d.player.name}</div>
          <div style={F({ alignItems: "flex-end", marginTop: 8 })}>
            <div style={F({ fontSize: 76, fontWeight: 800, color: a, lineHeight: 1 })}>{`${d.seasonPts}`}</div>
            <div style={F({ fontSize: 26, fontWeight: 700, color: FAINT, letterSpacing: 2, marginLeft: 20, marginBottom: 14 })}>POINTS</div>
          </div>
          <div style={F({ fontSize: 30, fontWeight: 700, color: WHITE, marginTop: 6 })}>{`${d.weekPts >= 0 ? "+" : ""}${d.weekPts} this week`}</div>
          <div style={F({ alignItems: "baseline", marginTop: 20 })}>
            <div style={F({ fontSize: 42, fontWeight: 800, color: WHITE })}>{`${d.rank} of ${d.of}`}</div>
            <div style={F({ fontSize: 24, fontWeight: 700, color: a, marginLeft: 20 })}>{mv}</div>
          </div>
          <div style={F({ marginTop: 16 })}>
            {chips.map((t) => (
              <div key={t} style={F({ border: `2px solid ${a}`, color: a, background: "#10203f", borderRadius: 22, padding: "6px 16px", fontSize: 20, fontWeight: 700, marginRight: 16 })}>{t}</div>
            ))}
          </div>
        </div>

        <div style={F({ flexDirection: "column", width: 460, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: 22 })}>
          <div style={F({ alignItems: "center", justifyContent: "space-between" })}>
            <div style={F({ fontSize: 22, fontWeight: 700, color: FAINT, letterSpacing: 2 })}>ACCURACY</div>
            <div style={F({})}>
              <div style={F({ width: 130, justifyContent: "flex-end", fontSize: 18, fontWeight: 700, color: FAINT })}>THIS WK</div>
              <div style={F({ width: 130, justifyContent: "flex-end", fontSize: 18, fontWeight: 700, color: FAINT })}>SEASON</div>
            </div>
          </div>
          <div style={F({ height: 1, background: LINE, marginTop: 14 })} />
          {row("Winner", d.acc.su)}
          {row("Spread", d.acc.ats)}
          {row("Over / Under", d.acc.ou)}
        </div>
      </div>

      <div style={F({ alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 18, borderTop: `1px solid ${LINE}` })}>
        <div style={F({ fontSize: 26, color: FAINT })}>Office Pick&apos;em League</div>
        <div style={F({ fontSize: 30, fontWeight: 800, color: a })}>Join the league  →  officepickemleague.com</div>
      </div>
    </div>,
    size
  );
}
