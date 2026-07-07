// Records a smooth-scroll walkthrough of the demo league as a video.
// Logs in as the commissioner first (league pages require a session), then
// navigates + smooth-scrolls each page. Runs in CI (Playwright) headless.
import { chromium } from "playwright";
import fs from "fs";

const ORIGIN = process.env.WALK_ORIGIN || "https://officepickemleague.com";
const SLUG   = process.env.WALK_SLUG   || "demo-day-league-x8am";
const NAME   = process.env.WALK_NAME   || "Ray Delgado";
const PIN    = process.env.WALK_PIN    || "2468";
const BASE   = `${ORIGIN}/l/${SLUG}`;
const PAGES  = [`${BASE}/standings`, `${BASE}/picks?week=4`, `${BASE}/insights`, `${BASE}/admin`];
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

// 1) wake Render (it sleeps when idle)
try { await page.goto(ORIGIN, { waitUntil: "load", timeout: 120000 }); } catch (e) { console.log("warmup:", e.message); }
await sleep(3000);

// 2) log in as commissioner -> sets the session cookie on the context
const login = await context.request.post(`${ORIGIN}/api/join`, {
  data: { slug: SLUG, name: NAME, pin: PIN, confirmNew: false },
});
console.log("login status:", login.status());
if (!login.ok()) console.log("login body:", await login.text());

// 3) walk each page with a smooth scroll
for (const url of PAGES) {
  try {
    await page.goto(url, { waitUntil: "load", timeout: 90000 });
    await sleep(2200);              // dwell at top
    await smoothScroll(page, 5200); // smooth scroll to bottom
    await sleep(1600);              // dwell at bottom
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(900);
  } catch (e) { console.log("page failed:", url, e.message); }
}

await context.close(); // finalizes the .webm
await browser.close();

const webm = fs.readdirSync(outDir).find((f) => f.endsWith(".webm"));
if (webm) fs.renameSync(`${outDir}/${webm}`, `${outDir}/walkthrough.webm`);
console.log("recorded:", fs.readdirSync(outDir));
