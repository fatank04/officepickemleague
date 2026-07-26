// Rebuild the Pittsburgh batch-1 letters, one per company, each with its own QR code pointing at
// that company's personalized landing page (/kit/<slug>).
//
//   node scripts/build-kit-letters.js [outDir]
//
// Writes letters.html (print to PDF) and qr/<slug>.png into outDir.
// Default outDir: ~/Downloads/opl-kit-batch1

const fs = require("fs");
const path = require("path");
const os = require("os");
const QRCode = require("qrcode");

const ACCOUNTS = require("./kit-accounts-pittsburgh.js");
const BASE = process.env.KIT_BASE_URL || "https://officepickemleague.com";
const OUT = process.argv[2] || path.join(os.homedir(), "Downloads", "opl-kit-batch1");

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function letter(a, qrDataUrl) {
  const url = `${BASE}/kit/${a.slug}`;
  return `
<section class="letter">
  <header>
    <div class="brand"><span class="mark">O</span><span class="bn">Office Pick'em League</span></div>
    <div class="tag">Founding Season 2026 · Kickoff Sept&nbsp;9</div>
  </header>

  <p class="hi">${esc(a.contact)} —</p>

  <p>Most of what companies spend on their people only ever reaches the office. The crews, the shop,
  and the second shift rarely see any of it — and they're most of the payroll.</p>

  <p>Office Pick'em League is an <strong>NFL pick'em league your company puts on for its employees</strong>.
  No money, no betting, and your people never pay a cent — you cover it once and the whole building plays,
  about two minutes a week for eighteen weeks. There are four ways to hand in a card — web, text, a paper
  sheet, or a phone call — so nobody sits it out because of their phone, their age, or where they work.</p>

  <p>It never touches work email or anything IT runs. There is nothing to install, nothing to review.</p>

  <p class="cta-line"><strong>${esc(a.company)}'s league is already set up.</strong> Scan the code to see
  it — your company name on it, in Steelers colors, ready to launch the moment you say so.</p>

  <div class="qrbox">
    <img class="qr" src="${qrDataUrl}" alt="Scan to open ${esc(a.company)}'s league">
    <div class="qrtxt">
      <div class="qrhead">${esc(a.company)} Pick'em</div>
      <div class="qrsub">Point your phone camera here</div>
      <div class="qrurl">${esc(url.replace(/^https:\/\//, ""))}</div>
    </div>
  </div>

  <p>Founding pricing is about half off and locked for three seasons, and nothing is charged until
  kickoff. If your team isn't more engaged by Week 8, you get every dollar back.</p>

  <p class="sig">— Ankur Doshi<br>
    <span class="sigsub">Office Pick'em League · ankur@officepickemleague.com · 717.903.5334</span></p>
</section>`;
}

const CSS = `
  @page{size:letter;margin:0}
  *{box-sizing:border-box}
  body{margin:0;font-family:Georgia,"Times New Roman",serif;color:#121a26;background:#fff}
  .letter{width:8.5in;height:11in;padding:0.85in 0.95in;page-break-after:always;
    display:flex;flex-direction:column;position:relative;font-size:12.4pt;line-height:1.62}
  .letter:last-child{page-break-after:auto}
  header{display:flex;align-items:center;justify-content:space-between;
    border-bottom:2px solid #0b1220;padding-bottom:11px;margin-bottom:30px}
  .brand{display:flex;align-items:center;gap:9px}
  .mark{width:27px;height:27px;border-radius:7px;background:#2f6bf0;color:#fff;
    display:inline-grid;place-items:center;font-weight:800;font-size:15px;font-family:Arial,sans-serif}
  .bn{font-family:Arial,sans-serif;font-weight:800;font-size:14.5px;letter-spacing:-.2px}
  .tag{font-family:Arial,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:1.3px;
    text-transform:uppercase;color:#6b7890}
  p{margin:0 0 15px}
  .hi{margin-bottom:19px}
  .cta-line{margin-top:3px}
  .qrbox{display:flex;align-items:center;gap:19px;margin:7px 0 19px;padding:15px 17px;
    border:1.5px solid #e2e8f2;border-left:5px solid #FFB612;border-radius:9px;background:#fbfcfe}
  .qr{width:1.42in;height:1.42in;display:block}
  .qrtxt{font-family:Arial,sans-serif}
  .qrhead{font-size:15px;font-weight:800;letter-spacing:-.2px}
  .qrsub{font-size:11.5px;color:#6b7890;margin-top:3px}
  .qrurl{font-size:10.5px;color:#2f6bf0;margin-top:7px;font-weight:700}
  .sig{margin-top:auto;padding-top:14px}
  .sigsub{font-family:Arial,sans-serif;font-size:10px;color:#6b7890}
`;

(async () => {
  const qrDir = path.join(OUT, "qr");
  fs.mkdirSync(qrDir, { recursive: true });

  const parts = [];
  for (const a of ACCOUNTS) {
    const url = `${BASE}/kit/${a.slug}`;
    // High error correction: these get printed, folded, and scanned in bad break-room light.
    const opts = { errorCorrectionLevel: "H", margin: 1, width: 560, color: { dark: "#0b1220ff", light: "#ffffffff" } };
    await QRCode.toFile(path.join(qrDir, `${a.slug}.png`), url, opts);
    const dataUrl = await QRCode.toDataURL(url, opts);
    parts.push(letter(a, dataUrl));
  }

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Pittsburgh batch 1 — letters</title><style>${CSS}</style></head><body>
${parts.join("\n")}
</body></html>`;

  fs.writeFileSync(path.join(OUT, "letters.html"), html);
  console.log(`Wrote ${ACCOUNTS.length} letters -> ${path.join(OUT, "letters.html")}`);
  console.log(`Wrote ${ACCOUNTS.length} QR codes -> ${qrDir}`);
  console.log(`QR target: ${BASE}/kit/<slug>`);
})().catch((e) => { console.error(e); process.exit(1); });
