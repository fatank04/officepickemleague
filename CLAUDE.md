# CLAUDE.md — Office Pick'em League

This is the context file for the Office Pick'em League project. Read it first. It tells you what the app is, where it lives, how it deploys, how I like to work, and the gotchas that have already bitten us so you don't repeat them.

If anything here contradicts what you see in the code, trust the code and tell me the doc is stale.

---

## What this is

Office Pick'em League is an NFL pick'em app aimed at workplaces and small groups. Commissioners spin up a league, players make weekly picks by text or web, and the app scores them and runs the weekly loop. There's a B2C side (individual leagues) and a B2B side (companies running it as a team-building / engagement play).

**Stack:** Next.js 14 (App Router) + Neon Postgres + Prisma + Twilio (SMS). Cron runs on GitHub Actions.

---

## Where the code lives

- **Machine:** Mac (moved off Windows July 2026). Fresh clone.
- **Suggested path:** `~/dev/officepickemleague` — a plain path, NOT inside iCloud Drive / Dropbox / any synced folder. (On the old Windows box, syncing corrupted git; keep the clone out of sync territory here too.)
- **GitHub remote:** github.com/fatank04/officepickemleague, branch `main`. Unchanged by the computer switch — the remote lives in the cloud.
- This folder is NOT automatically a connected folder in a Cowork session. If you're in Cowork and need to read or edit it, confirm I've added it as a connected folder first — don't assume you have access.

I push via **GitHub Desktop** (works on Mac too) or the command line. Not the web "Add files via upload" button.

### History (old Windows machine — not relevant to the Mac, kept for context)

On Windows the repo had to live at `C:\dev\officepickemleague` specifically to escape two corrupted synced copies: one under `Claude Cowork\...` whose sync layer truncated writes and jammed `.git/*.lock`, and one under `OneDrive\Desktop` where OneDrive corrupted `.git/index`. None of that follows to the Mac — just don't recreate the mistake by cloning into a synced folder.

---

## Deploy chain

Push to GitHub → **Render** Web Service (free tier) picks it up.

- Blueprint: `render.yaml`
- Build command: `npm install && npx prisma db push && node scripts/seed.js && npm run build`
- Also reachable at `officepickemleague.onrender.com`
- **Netlify is dead.** We migrated off it in June 2026 (hit the free-tier credit wall). `netlify.toml` and `netlify/functions` are still in the repo but inert. Ignore any docs that describe a Netlify deploy — they're stale.

**Cron:** GitHub Actions (`.github/workflows/cron.yml`) pings `/api/cron/*`. NOT a Render or Netlify scheduler. Needs repo secret `CRON_SECRET` and repo var `CRON_BASE_URL=https://officepickemleague.onrender.com`.

**DNS:** domain at Spaceship (NS launch1/launch2.spaceship.net). Apex A → `216.24.57.1` (Render), www CNAME → `officepickemleague.onrender.com`. Old Netlify IP was `75.2.60.5` — if you see that anywhere, it's stale.

### Env vars (set in Render dashboard)

Required: `DATABASE_URL`, `DIRECT_URL`, `ODDS_API_KEY`, `SEASON`, `SESSION_SECRET`, `CRON_SECRET`, `OPS_KEY` (founder `/ops` console), and the `TWILIO_*` set including `TWILIO_MESSAGING_SERVICE_SID` (needed for A2P-correct sends once Twilio is registered).

---

## How I like to work

I use two commands a lot. They're written up in `.claude/commands/` — read those for the full definitions.

- **/goal** — before you build anything, restate my request as a precise, verifiable goal: exact end state, how you'll verify it, what you must NOT touch, and the stop condition. Confirm that goal with me, then execute.
- **/loop** — self-correcting build → verify → fix iteration until the work is provably green. Verify with real machine checks, not vibes. For this repo that means `npm run typecheck` (tsc --noEmit), `npm test` (the `*.test.ts` unit tests — scoring / brand / ord / admin / voice / weekly-loop, run via tsx), and `npm run lint` (next lint, Strict). For anything high-stakes, spawn a separate verifier subagent rather than grading your own work. **Hard-stop and tell me** if you make no progress, repeat the same approach, flip-flop, the verifier rejects the same thing twice, or you hit a reasonable budget. Don't loop forever and don't declare a self-congratulatory "done."

General preferences:
- Keep a running task list. Only mark a task done after its checks actually pass.
- Be concise and direct. Cut words that don't earn their place.
- Write copy and docs so they sound like a person wrote them, not an AI.

---

## Gotchas — mostly Windows-era, but the lesson carries

The nastiest bugs on this project came from editing files through a sync/mount layer that served a **stale, truncated** view — a bash in-place edit (`perl -pi`, `sed -i`, `cmd file > file`) would read the truncated view and write it back, silently chopping the real file. That was tied to the Windows OneDrive/synced-mount setup and broke 8 live pages once.

On the Mac, cloned to a plain non-synced path, this shouldn't recur. But keep the habits, because they're cheap insurance:
1. Prefer the **Edit/Write tools** over bash in-place edits for repo files.
2. If bash must generate file content, source it from git rather than a mount: `git show <ref>:<file> | <transform> > file`, and verify with `git cat-file -p :<file>`.
3. Don't clone into iCloud Drive / Dropbox / any synced folder — that's what caused the corruption in the first place.
4. If you ever DO end up working under a sync layer again, re-read the full Windows-era rules in git history — but on a clean `~/dev` path you can treat editing as normal.

---

## Where things stand / what's next

See `docs/PROJECT_STATE.md` for the detailed current state. Short version as of early July 2026:

- A batch of UX fixes, the `/pricing` page, and SEO/GEO work were shipped into the repo but were **pending my commit + push** — confirm what's actually on `main` before assuming.
- Twilio 10DLC / A2P registration is the critical path for texting. EIN is in hand. Follow `02-product/twilio-10dlc-GO-checklist.md` in the data room — it supersedes the older runbook and registration packet (those have Netlify-stale deploy sections).
- Test data to clean out: "ZZ Test League" (slug `zz-test-league-68nr`) plus the ZZ Test players.

---

## Canonical business facts

If you touch any pitch deck, financial summary, pricing page, or marketing copy, the numbers must match `docs/CANONICAL_FACTS.md`. There are two conflicting sets of financials floating around — that doc says which one wins and lists the stale set to purge. Don't invent or "round" numbers; pull them from there.

The data room (decks, docs, financial model) lives at `Claude Cowork\office-pickem-league\office-pickem-data-room` — separate from the code repo.
