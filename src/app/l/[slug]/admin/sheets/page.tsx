import Link from "next/link";
import { filterToSlate } from "@/lib/slate";
import { prisma } from "@/lib/db";
import { current } from "@/lib/league";
import { nflWeek } from "@/lib/odds";
import { displaySmsNumber } from "@/lib/messaging";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

/**
 * Printable weekly pick sheets — the paper modality's physical artifact.
 * Designed for both audiences at once: pens (big boxes, generous rows, familiar
 * pool layout) and the vision transcriber (high contrast, numbered rows, one
 * mark per cell). Commissioner prints a stack for the break room.
 */
export default async function SheetsPage({ params, searchParams }: { params: { slug: string }; searchParams: { week?: string } }) {
  const ctx = await current();
  if (!ctx || ctx.league.slug !== params.slug) return <div className="card pad muted">Sign in to view.</div>;
  if (!ctx.player.isCommish) return <div className="card pad muted">Commissioner only.</div>;
  const { league } = ctx;
  const week = parseInt(searchParams.week || "", 10) || nflWeek(new Date());
  const games = await filterToSlate(league, week, await prisma.game.findMany({ where: { season: league.season, week }, orderBy: { kickoff: "asc" } }));
  // Display number follows the ACTIVE messaging provider so paper can't print a dead number.
  const smsNumber = displaySmsNumber();

  const box = { display: "inline-block", width: 13, height: 13, border: "2px solid #111", borderRadius: 3, verticalAlign: "-2px", marginRight: 5 } as const;
  const cell = { padding: "7px 8px", borderBottom: "1px solid #bbb", fontSize: 12.5, whiteSpace: "nowrap" } as const;
  const weekHref = (w: number) => `/l/${league.slug}/admin/sheets?week=${w}`;

  if (!smsNumber) {
    return (
      <>
        <div className="app-kicker">Commissioner</div>
        <h2 style={{ marginTop: 0 }}>Paper pick sheets</h2>
        <div className="card pad">
          <div className="b" style={{ marginBottom: 6 }}>⚠️ Texting number not set up yet</div>
          <p className="muted small" style={{ margin: 0, lineHeight: 1.6 }}>
            Sheets tell players to text their photo to your league&apos;s number — printing before that
            number exists would put a blank on paper nobody can fix. Once your texting number is live,
            this page unlocks automatically.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="noprint">
        <div className="app-kicker">Commissioner</div>
        <h2 style={{ marginTop: 0 }}>Paper pick sheets</h2>
        <div className="card pad spread">
          <div className="muted small" style={{ lineHeight: 1.55 }}>
            Print a stack for the break room. Players check their boxes, snap a photo, and text it to the
            league number — we type it in for them and text their card back to confirm.
          </div>
          <PrintButton />
        </div>
        <div className="row" style={{ marginBottom: 12 }}>
          {week > 1 && <Link className="btn ghost sm" href={weekHref(week - 1)}>‹ Week {week - 1}</Link>}
          <span className="chip">Week {week}</span>
          {week < 18 && <Link className="btn ghost sm" href={weekHref(week + 1)}>Week {week + 1} ›</Link>}
        </div>
      </div>

      <div className="sheet" style={{ background: "#fff", color: "#111", borderRadius: 8, padding: "26px 30px", fontFamily: "Arial, Helvetica, sans-serif" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
          <tbody>
            <tr>
              <td style={{ fontSize: 20, fontWeight: 800, paddingBottom: 2 }}>🏈 {league.name} — Week {week}</td>
              <td style={{ textAlign: "right", fontSize: 12, color: "#444" }}>League code: <b>{league.slug}</b> · Season {league.season}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ border: "2px solid #111", borderRadius: 6, padding: "8px 12px", marginBottom: 14, fontSize: 13 }}>
          <b>Your name:</b> ______________________________ <span style={{ color: "#555" }}>(and make sure you text from your own phone — that&apos;s how we know it&apos;s you)</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["#", "Game", "Winner (1pt)", "Spread (2pts)", "Total (2pts)", "⭐ Lock (pick one game)"].map((h) => (
                <th key={h} style={{ ...cell, borderBottom: "2px solid #111", fontSize: 11, textAlign: "left", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => {
              const aw = g.away, hm = g.home;
              const favLine = g.homeSpread < 0 ? `${hm} ${g.homeSpread}` : `${aw} ${-g.homeSpread}`;
              return (
                <tr key={g.id}>
                  <td style={{ ...cell, fontWeight: 800 }}>{i + 1}</td>
                  <td style={cell}><b>{aw}</b> @ <b>{hm}</b><div style={{ fontSize: 10.5, color: "#555" }}>{favLine} · O/U {g.total}</div></td>
                  <td style={cell}><span style={box} /> {aw}&nbsp;&nbsp;<span style={box} /> {hm}</td>
                  <td style={cell}><span style={box} /> {aw}&nbsp;&nbsp;<span style={box} /> {hm}</td>
                  <td style={cell}><span style={box} /> Over&nbsp;&nbsp;<span style={box} /> Under</td>
                  <td style={{ ...cell, textAlign: "center" }}><span style={{ ...box, borderRadius: 8 }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 16, border: "3px solid #111", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Done? Three steps — that&apos;s the whole thing:</div>
          <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
            1️⃣ Check one box per column (pen is perfect) &nbsp; 2️⃣ Take a photo — lay the sheet flat, whole page in the shot
            &nbsp; 3️⃣ Text the photo to <span style={{ fontSize: 16, fontWeight: 800, whiteSpace: "nowrap" }}>{smsNumber}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#444", marginTop: 6 }}>
            We&apos;ll text your picks right back so you can see they went in. Change any pick by text until kickoff.
          </div>
        </div>
      </div>

      {games.length === 0 && <div className="card pad muted noprint" style={{ marginTop: 12 }}>No games loaded for week {week} yet.</div>}
    </>
  );
}
