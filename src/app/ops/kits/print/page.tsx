import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { opsAuthed } from "@/lib/ops";
import { prisma } from "@/lib/db";
import { DEFAULT_ACCENT } from "@/lib/brand";
import PrintBar from "./PrintBar";

export const dynamic = "force-dynamic";

type A = {
  id: string; slug: string; company: string; metro?: string | null; teamCity?: string | null; teamName?: string | null;
  accent?: string | null; contact?: string | null; contactTitle?: string | null;
  addr1?: string | null; addr2?: string | null; city?: string | null; state?: string | null; zip?: string | null;
};

const lbl = (c: string) => (/pick'?em/i.test(c) ? c : `${c} Pick'em`);
const chunk = <T,>(arr: T[], n: number) => { const o: T[][] = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
async function qrFor(text: string) { try { return await QRCode.toString(text, { type: "svg", margin: 0 }); } catch { return ""; } }

const STYLE = `
  .pp { background:#fff; color:#111; min-height:100vh; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; padding:16px; }
  .sheet { page-break-after: always; } .sheet:last-child { page-break-after: auto; }
  .cards { display:grid; grid-template-columns:3.5in 3.5in; grid-auto-rows:2in; }
  .card { width:3.5in; height:2in; box-sizing:border-box; padding:.16in .18in; border:1px solid #e2e2e2; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; }
  .card-co { font-size:8pt; font-weight:800; letter-spacing:.5px; color:#555; }
  .card-role { font-size:7.5pt; font-weight:800; letter-spacing:1.5px; color:#4f8cff; margin-top:2px; }
  .card-name { font-size:16pt; font-weight:800; line-height:1; margin-top:1px; }
  .card-bottom { display:flex; justify-content:space-between; align-items:flex-end; gap:8px; }
  .card-url { font-size:7.5pt; color:#333; font-weight:700; line-height:1.2; }
  .qr svg { width:.82in; height:.82in; display:block; } .qr-sm svg { width:.7in; height:.7in; display:block; }
  .labels { display:grid; grid-template-columns:2.625in 2.625in 2.625in; grid-auto-rows:1in; }
  .label { box-sizing:border-box; padding:.12in .14in; font-size:9.5pt; line-height:1.28; overflow:hidden; }
  .label .b { font-weight:800; }
  .insert { max-width:6.2in; margin:0 auto; padding:.3in 0; }
  .insert .top { border-top:6px solid #4f8cff; padding-top:14px; }
  .insert .ey { font-size:10pt; font-weight:800; letter-spacing:1.4px; color:#2f6bf0; text-transform:uppercase; }
  .insert h1 { font-size:27pt; line-height:1.05; margin:8px 0 12px; }
  .insert p { font-size:12.5pt; line-height:1.5; color:#222; }
  .insert .ready { background:#eef4ff; border:1px solid #cfe0ff; border-radius:8px; padding:10px 13px; font-weight:800; color:#1c3e86; margin:12px 0; }
  .insert ul { padding-left:18px; } .insert li { margin:6px 0; font-size:12pt; }
  .insert .cta { background:#4f8cff; color:#fff; border-radius:9px; padding:13px 15px; display:flex; justify-content:space-between; align-items:center; gap:14px; margin-top:6px; }
  .insert .cta .big { font-weight:800; font-size:12pt; } .insert .cta .url { font-weight:800; font-size:11pt; white-space:nowrap; }
  .fb { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:9in; text-align:center; gap:18px; }
  .fb .panel { font-size:30pt; font-weight:900; letter-spacing:1px; line-height:1.1; }
  .fb .vs { color:#4f8cff; }
  .fb .url { font-size:15pt; font-weight:800; }
  .fb .qr svg { width:2in; height:2in; }
  .fb .note { color:#777; font-size:10pt; max-width:5in; }
  @media print { .print-hide { display:none !important; } @page { size: letter; margin:0.4in; } .pp { padding:0; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

function Hub({ qs, metros, count, status, metro }: { qs: string; metros: string[]; count: number; status: string; metro: string }) {
  const opt = (cur: string, val: string, label: string, param: "status" | "metro") => {
    const sp = new URLSearchParams(qs); sp.set(param, val);
    return <Link href={`/ops/kits/print?${sp.toString()}`} className={`btn ghost sm`} style={{ opacity: cur === val ? 1 : 0.6, fontWeight: cur === val ? 800 : 600 }}>{label}</Link>;
  };
  const docLink = (doc: string, title: string, desc: string) => (
    <Link href={`/ops/kits/print?doc=${doc}&${qs}`} className="card pad" style={{ display: "block", textDecoration: "none", color: "var(--text)" }}>
      <div className="b" style={{ fontSize: 16 }}>{title}</div><div className="muted small">{desc}</div>
    </Link>
  );
  return (
    <div className="wrap">
      <div className="spread" style={{ margin: "8px 0 14px" }}>
        <h2 style={{ margin: 0 }}>Print pack</h2>
        <Link href="/ops/kits" className="btn ghost sm">← Accounts</Link>
      </div>
      <div className="card pad">
        <div className="muted small b" style={{ marginBottom: 6 }}>FILTER — {count} account(s) selected</div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <span className="muted small" style={{ width: 50 }}>Status</span>
          {opt(status, "all", "all", "status")}{opt(status, "draft", "draft", "status")}{opt(status, "ready", "ready", "status")}{opt(status, "mailed", "mailed", "status")}
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <span className="muted small" style={{ width: 50 }}>Metro</span>
          {opt(metro, "all", "all", "metro")}{metros.map((m) => <span key={m}>{opt(metro, m, m, "metro")}</span>)}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
        {docLink("cards", "Commissioner cards", "2×3.5\" cards, 10/sheet (Avery 5371) — name + QR pURL.")}
        {docLink("inserts", "One-page inserts", "The bespoke letter, one per page, mail-merged.")}
        {docLink("labels", "Mailing labels", "2.625×1\" labels, 30/sheet (Avery 5160) — named contact + address.")}
        {docLink("footballs", "Football art", "Per-account panel art (city + pURL + QR) to send your football printer.")}
      </div>
      <div className="card pad" style={{ marginTop: 12 }}>
        <div className="b">Postage</div>
        <p className="muted small" style={{ marginTop: 4 }}>Download addresses as CSV and batch-buy commercial parcel labels in Pirate Ship / Stamps.com.</p>
        <a className="btn sm" href={`/api/ops/kits/export?${qs}`}>⬇ Download address CSV</a>
      </div>
    </div>
  );
}

export default async function PrintPage({ searchParams }: { searchParams: { doc?: string; status?: string; metro?: string } }) {
  if (!opsAuthed()) redirect("/ops");
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "https://officepickemleague.com").replace(/\/$/, "");
  const status = searchParams.status || "all";
  const metro = searchParams.metro || "all";
  const doc = searchParams.doc;
  const where: any = {};
  if (status !== "all") where.status = status;
  if (metro !== "all") where.metro = metro;
  const accounts = (await prisma.kitAccount.findMany({ where, orderBy: [{ metro: "asc" }, { company: "asc" }] })) as A[];
  const qs = `status=${encodeURIComponent(status)}&metro=${encodeURIComponent(metro)}`;

  if (!doc) {
    const all = await prisma.kitAccount.findMany({ select: { metro: true } });
    const metros = [...new Set(all.map((a) => a.metro).filter(Boolean))] as string[];
    return <Hub qs={qs} metros={metros} count={accounts.length} status={status} metro={metro} />;
  }

  const qr: Record<string, string> = {};
  await Promise.all(accounts.map(async (a) => { qr[a.slug] = await qrFor(`${base}/kit/${a.slug}`); }));
  const shortUrl = (slug: string) => `${base.replace(/^https?:\/\//, "")}/kit/${slug}`;
  const accent = (a: A) => a.accent || DEFAULT_ACCENT;

  let body: React.ReactNode = null;
  let label = "";

  if (doc === "cards") {
    label = "cards";
    body = chunk(accounts, 10).map((pg, i) => (
      <div className="sheet" key={i}><div className="cards">
        {pg.map((a) => (
          <div className="card" key={a.id} style={{ borderLeft: `6px solid ${accent(a)}` }}>
            <div><div className="card-co">{a.company.toUpperCase()}</div><div className="card-role">COMMISSIONER</div>
              <div className="card-name">{a.contact || "You"}</div></div>
            <div className="card-bottom">
              <div className="card-url">{shortUrl(a.slug)}<br />Scan → launch in 60s</div>
              <span className="qr" dangerouslySetInnerHTML={{ __html: qr[a.slug] || "" }} />
            </div>
          </div>
        ))}
      </div></div>
    ));
  } else if (doc === "labels") {
    label = "labels";
    body = chunk(accounts, 30).map((pg, i) => (
      <div className="sheet" key={i}><div className="labels">
        {pg.map((a) => (
          <div className="label" key={a.id}>
            <div>{a.contact || ""}{a.contactTitle ? `, ${a.contactTitle}` : ""}</div>
            <div className="b">{a.company}</div>
            {a.addr1 && <div>{a.addr1}</div>}{a.addr2 && <div>{a.addr2}</div>}
            <div>{[a.city, a.state].filter(Boolean).join(", ")} {a.zip || ""}</div>
          </div>
        ))}
      </div></div>
    ));
  } else if (doc === "inserts") {
    label = "inserts";
    body = accounts.map((a) => {
      const team = a.teamCity ? `${a.teamCity}${a.teamName ? ` ${a.teamName}` : ""}` : "your city";
      return (
        <div className="sheet" key={a.id}><div className="insert"><div className="top">
          <div className="ey">{lbl(a.company).toUpperCase()} · SEASON KICKOFF KIT</div>
          <h1>Floor to front office — everybody&apos;s in.</h1>
          <p>The office football pool your <b>whole</b> team can actually play. No money. No app. Pick winners, spreads &amp; over/unders in <b>two minutes a week</b> — by text, web, or even a phone call. Grandpa in shipping and the VP of Finance, same league.</p>
          <div className="ready">We already built {a.company}&apos;s league. It&apos;s ready to launch.</div>
          <ul>
            <li><b>A rounding error.</b> A few dollars a head for the whole season — cheaper than one team lunch.</li>
            <li><b>No procurement, no IT, no contract.</b> Free to start. Launch it before this kit hits the recycling.</li>
            <li><b>Everyone plays — for real.</b> Frontline crews who&apos;ll never open an app play by text or a phone call.</li>
          </ul>
          <div className="cta"><span className="big">You&apos;re the commissioner{a.contact ? `, ${a.contact}` : ""}. Scan the football — launch in 60 seconds.</span><span className="url">{shortUrl(a.slug)}</span></div>
          <p style={{ fontSize: "9pt", color: "#888", marginTop: 14 }}>No money changes hands, ever. {team} season starts now.</p>
        </div></div></div>
      );
    });
  } else if (doc === "footballs") {
    label = "football art";
    body = accounts.map((a) => (
      <div className="sheet" key={a.id}><div className="fb">
        <div className="panel">{(a.teamCity || a.company).toUpperCase()}<br /><span className="vs">vs THE FRONT OFFICE</span></div>
        <span className="qr" dangerouslySetInnerHTML={{ __html: qr[a.slug] || "" }} />
        <div className="url">{shortUrl(a.slug)}</div>
        <div className="note">Football panel art for {a.company}. Send to your foam-football printer: one panel = the matchup line, the other = the QR + pURL above.</div>
      </div></div>
    ));
  } else {
    return <div className="wrap"><div className="card pad">Unknown doc. <Link href="/ops/kits/print">Back to hub</Link>.</div></div>;
  }

  return (
    <div className="pp">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="print-hide"><PrintBar label={label} /></div>
      {accounts.length === 0 ? <div style={{ padding: 24 }}>No accounts match this filter.</div> : body}
    </div>
  );
}
