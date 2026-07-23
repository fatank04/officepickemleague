// Load / concurrency harness for the deadline hot paths. Signs in the seeded
// load-test players, then drives CONCURRENCY virtual users through a realistic
// weighted mix (standings + picks reads, autofill + submit writes) for DURATION
// seconds, and reports per-endpoint latency percentiles + error rates.
//
// Prereq: run scripts/seed-loadtest.js first, and point DATABASE_URL at the
// POOLED Neon endpoint (the whole point of the test).
//
//   BASE=https://officepickemleague.com LT_PLAYERS=200 CONCURRENCY=150 DURATION_S=30 node scripts/loadtest.mjs
//
// Nothing here needs DB access — it's pure HTTP against the live site.
const BASE = process.env.BASE || "https://officepickemleague.com";
const SLUG = process.env.LT_SLUG || "loadtest";
const PIN = process.env.LT_PIN || "0000";
const N = Number(process.env.LT_PLAYERS || 200);
const CONCURRENCY = Number(process.env.CONCURRENCY || 150);
const DURATION_S = Number(process.env.DURATION_S || 30);
const WEEK = Number(process.env.LT_WEEK || 1);

const name = (i) => `LT${String(i).padStart(4, "0")}`;
const stats = new Map(); // action -> { lat:[], ok, err, codes:{} }
function rec(action, ms, status, ok) {
  const s = stats.get(action) || { lat: [], ok: 0, err: 0, codes: {} };
  s.lat.push(ms); s[ok ? "ok" : "err"]++; s.codes[status] = (s.codes[status] || 0) + 1;
  stats.set(action, s);
}
async function timed(action, fn) {
  const t = performance.now();
  try {
    const res = await fn();
    rec(action, performance.now() - t, res.status, res.status < 500); // 4xx are valid app responses, not failures
    return res;
  } catch (e) {
    rec(action, performance.now() - t, e?.cause?.code || "NETERR", false);
    return null;
  }
}
const cookieOf = (res) => {
  const cs = res.headers.getSetCookie?.() ?? (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  return cs.map((c) => c.split(";")[0]).join("; ");
};

async function signIn(i) {
  const res = await timed("POST /api/join", () =>
    fetch(`${BASE}/api/join`, { method: "POST", headers: { "Content-Type": "application/json" }, redirect: "manual",
      body: JSON.stringify({ slug: SLUG, name: name(i), pin: PIN, confirmNew: true }) }));
  return res ? cookieOf(res) : "";
}

// Weighted action mix (deadline-shaped: mostly reads, some writes).
const ACTIONS = [
  [40, "GET standings", (c) => fetch(`${BASE}/l/${SLUG}/standings`, { headers: { cookie: c }, redirect: "manual" })],
  [25, "GET picks", (c) => fetch(`${BASE}/l/${SLUG}/picks?week=${WEEK}`, { headers: { cookie: c }, redirect: "manual" })],
  [12, "GET insights", (c) => fetch(`${BASE}/l/${SLUG}/insights`, { headers: { cookie: c }, redirect: "manual" })],
  [12, "POST autofill", (c) => fetch(`${BASE}/api/picks/autofill`, { method: "POST", redirect: "manual",
    headers: { "Content-Type": "application/json", cookie: c }, body: JSON.stringify({ week: WEEK, strategy: "favorites" }) })],
  [11, "POST submit", (c) => fetch(`${BASE}/api/submit`, { method: "POST", redirect: "manual",
    headers: { "Content-Type": "application/json", cookie: c }, body: JSON.stringify({ week: WEEK, undo: Math.random() < 0.5 }) })],
];
const total = ACTIONS.reduce((s, a) => s + a[0], 0);
function pickAction() { let r = Math.random() * total; for (const a of ACTIONS) { if ((r -= a[0]) < 0) return a; } return ACTIONS[0]; }

function pct(arr, p) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return Math.round(s[Math.floor((p / 100) * (s.length - 1))]); }

async function main() {
  console.log(`\nLoad test → ${BASE}  league=${SLUG}\n  ${CONCURRENCY} concurrent users · ${DURATION_S}s · ${N} seeded players\n`);

  console.log("Signing in players (this alone stresses /api/join + player lookup)…");
  const cookies = [];
  for (let i = 0; i < N; i += CONCURRENCY) {
    const batch = await Promise.all(Array.from({ length: Math.min(CONCURRENCY, N - i) }, (_, k) => signIn(i + k + 1)));
    cookies.push(...batch.filter(Boolean));
  }
  if (!cookies.length) { console.error("No sign-ins succeeded — is the league seeded? Aborting."); process.exit(1); }
  console.log(`  ${cookies.length}/${N} signed in.\n`);

  console.log(`Driving load for ${DURATION_S}s…`);
  const deadline = performance.now() + DURATION_S * 1000;
  let inFlight = 0, done = 0;
  async function worker(seed) {
    let idx = seed;
    while (performance.now() < deadline) {
      const c = cookies[idx % cookies.length]; idx += 7;
      const [, label, fn] = pickAction();
      inFlight++; await timed(label, () => fn(c)); inFlight--; done++;
    }
  }
  const ticker = setInterval(() => process.stdout.write(`\r  requests=${done} inFlight=${inFlight}   `), 500);
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, k) => worker(k)));
  clearInterval(ticker);

  // ---- report ----
  let totReq = 0, totErr = 0;
  for (const s of stats.values()) { totReq += s.ok + s.err; totErr += s.err; }
  console.log(`\n\n═══ RESULTS ═══`);
  console.log(`total requests: ${totReq}   throughput: ${(totReq / DURATION_S).toFixed(0)}/s   error rate: ${((totErr / totReq) * 100).toFixed(2)}%\n`);
  console.log("endpoint".padEnd(20), "n".padStart(7), "err%".padStart(7), "p50".padStart(7), "p95".padStart(7), "p99".padStart(7), "  status codes");
  for (const [action, s] of stats) {
    const n = s.ok + s.err;
    console.log(
      action.padEnd(20),
      String(n).padStart(7),
      (((s.err / n) * 100).toFixed(1)).padStart(7),
      String(pct(s.lat, 50)).padStart(7),
      String(pct(s.lat, 95)).padStart(7),
      String(pct(s.lat, 99)).padStart(7),
      "  " + Object.entries(s.codes).map(([k, v]) => `${k}:${v}`).join(" ")
    );
  }
  const verdict = totErr / totReq < 0.01 ? "PASS — under 1% errors" : totErr / totReq < 0.05 ? "MARGINAL — 1–5% errors" : "FAIL — >5% errors (look at status codes / p99)";
  console.log(`\nverdict: ${verdict}`);
  console.log(`(watch for 500s and 'NETERR'/'ECONNRESET' — those are the connection-ceiling / crash signals.)\n`);
}
main();
