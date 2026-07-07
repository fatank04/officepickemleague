// Records a smooth-scroll walkthrough of the demo league as a video.
// Runs headless in CI (or locally with: npm i playwright && npx playwright install chromium && node scripts/record-walkthrough.mjs)
import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.WALK_BASE || "https://officepickemleague.com/l/demo-day-league-x8am";
const PAGES = [
  `${BASE}/standings`,
  `${BASE}/picks?week=4`,
  `${BASE}/insights`,
  `${BASE}/admin`,
];
const W = 1440, H = 1024;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, dur) {
  await page.evaluate((ms) => new Promise((res) => {
    const max = document.body.scrollHeight - window.innerHeight;
    if (max <= 4) return res();
    const start = performance.now();
    (function frame(t) {
      const p = Math.min((t - start) / ms, 1);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
      window.scrollTo(0, max * e);
      p < 1 ? requestAnimationFrame(frame) : res();
    })(start);
  }), dur);
}

const outDir = "recording";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: outDir, size: { width: W, height: H } },
});
const page = await context.newPage();

// warm Render (it sleeps when idle; first hit can take ~30s)
await page.goto(`${BASE}/standings`, { waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
await sleep(4000);

for (const url of PAGES) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await sleep(2000);            // dwell at top
  await smoothScroll(page, 5200); // smooth scroll top -> bottom
  await sleep(1600);            // dwell at bottom
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(900);
}

await context.close(); // finalizes the .webm
await browser.close();

const webm = fs.readdirSync(outDir).find((f) => f.endsWith(".webm"));
if (webm) fs.renameSync(`${outDir}/${webm}`, `${outDir}/walkthrough.webm`);
console.log("recorded:", fs.readdirSync(outDir));
