# List-Build Workflow — Apollo exports → scored master sheet (2026-07-21)

How rolling Apollo account exports become one deduped, metro-bucketed, **pre-scored** master list for
vetting — before any people are pulled. Runnable script: `consolidate-apollo.py` (this folder).

## The loop
1. **Pull a city in Apollo** (Search → People filters per `apollo-icp-spec.md`, then the **Companies**
   tab). Keep it **narrow** (the keyword filter stays off as a *filter* — it's a scoring signal;
   see below). Export → CSV to `~/Downloads/`. Apollo pages ~25/file, so a city = several files.
2. **Run:** `python3 docs/outbound/consolidate-apollo.py` → writes `~/Downloads/opl-companies-master.csv`.
3. **Import to Google Sheets:** new sheet → File → Import → Upload → **Replace spreadsheet**. Freeze
   row 1, Data → Create a filter.
4. **Add more cities / pages anytime** → drop the CSVs in Downloads → re-run (it reads the whole folder
   and dedupes). Overlapping re-exports are safe (dedup by Apollo Account Id).

## What the script does
- **Dedup** by `Apollo Account Id` (fallback company+city).
- **Metro/wave bucketing** by State + ZIP:

  | Metro | Wave | Rule |
  |---|---|---|
  | Pittsburgh | 1 | PA + ZIP 15xxx/16xxx (or Pittsburgh area codes) |
  | Buffalo | 2 | NY |
  | Cleveland | 3 | OH (not a Cincinnati city) |
  | Cincinnati | 4 | OH + Cincinnati-area city |
  | Philadelphia | 5 | PA + ZIP 19xxx/18xxx, or NJ / DE |
  | Detroit | 6 | MI |
  | Baltimore | 7 | MD |
  | Milwaukee/Green Bay | 8 | WI |
  | OTHER (verify) | 9 | anything else — cut or re-check |

- **GeoFlag = `VERIFY-LOCATION`** when the phone area code doesn't match the metro. Catches Apollo
  mis-tags (e.g. "Philadelphia **MS**") and toll-free 800 numbers (which just can't be verified — not
  necessarily wrong). Start vetting here.

## The pre-score (auto, company-level)
`preScore = sizeFit (0–2) + shiftSignal (0/1)` → **0–3**. Ranks every company before you pull people.

- **sizeFit** — `2`: 50–400 employees (sweet spot) · `1`: 25–50 or 400–1,000 · `0`: outside.
- **shiftSignal (0/1)** — fires if the Apollo keyword blob / description / name contains a
  workforce-culture marker that *differentiates* within the blue-collar set: **family-owned, union,
  shift/plant/yard/dispatch/fleet/CDL/foreman/crew/loading dock/warehouse**. (Industry terms like
  "manufacturing" are excluded — they'd fire for everyone.)
- **familyOwned (0/1)** — helper flag: the owner-is-buyer signal → your **Ring-1 kit shortlist**.
- **hasSocials (0/1)** — FB/Twitter present → a **footballSignal candidate** (where you can check
  game-day content).

**Use it:** sort by `preScore` desc within a metro. The `3`s (right size + shift/family signal) are
your A-list — pull people for those first. `0`s (bad size fit) are likely cuts. `preScore 3 +
familyOwned` in the pilot metro ≈ your kit accounts, pre-selected.

## What's NOT scored here (manual / later — see refinement-schema.md)
- **footballSignal** — check the company's actual socials (use `hasSocials` to shortlist).
- **roleFit** + **fanSignal** — need people pulled first (person-level).

## Two lists, two jobs (don't conflate)
- **Narrow list (this master)** = the **kit + call** shortlist (high-touch, ~50 accounts). Great fit,
  small.
- For the **cold-email volume** (Ring 3, ~1,000+ contacts feeding 6 inboxes) you need the **broadened**
  pull (drop the industry-tight/keyword narrowing) — 46 narrow Pittsburgh companies ≈ ~92 email
  contacts, far short of the machine's capacity. Broaden Pittsburgh (~400) for email; keep the narrow
  A-list for kits.

## Step 7 — People (after companies are vetted): `join-people-apollo.py`
Once you've picked the metro to work (Pittsburgh pilot first), pull the humans and tie them to the
scored companies:

1. **Apollo People pull** — from the saved city search, People tab, keep the company filters, add
   **titles** (Owner/Pres/Founder/CEO/GM + HR Mgr/Dir/People Ops + Office/Ops Mgr) and **management
   levels** (Owner→Manager). Export to `~/Downloads/` (file name `apollo-contacts-export*.csv`).
2. **Run:** `python3 docs/outbound/join-people-apollo.py` → writes `~/Downloads/opl-people-master.csv`.
3. It joins each person to their company by **Apollo Account Id** (inherits Metro/Wave/Ring/preScore/
   familyOwned/address), classifies **buyer** (Owner/Pres/CEO/GM, or HR at larger cos) vs **champion**
   (Office/Ops Mgr), and keeps **2 per account** (best buyer + best champion). Ring-labeled + sorted.
4. **Then:** Ring 1–2 people = kit + call motion (need the buyer's name for the label — it's in the
   sheet). Ring-3 email pool comes from the *broadened* pull → MillionVerifier → Instantly
   (`list-verification-runbook.md`).

**Rings** (assigned in `consolidate-apollo.py` by within-metro fit rank): top 20 = Ring 1, next 30 =
Ring 2 (both kit+call), rest = Ring 3 (email pool). Pittsburgh narrow = 20 + 26, no Ring 3 (email uses
the broadened list — see "Two lists").

*Column note:* Apollo people-export headers are read defensively; if a field comes up blank, extend the
name list in that `g(...)` call in `join-people-apollo.py`.

## Adding a new metro
Edit `consolidate-apollo.py`: add the metro's area-code set, add one line in `metro_and_wave()` by
State (split by ZIP if the state has two target metros, like PA). Re-run.

## Snapshot (2026-07-21)
27 export files → **537 unique companies**. Milwaukee/GreenBay 135 (A-list 53) · Cleveland 132 (43) ·
Cincinnati 73 (26) · Philadelphia 58→85 in progress (15) · Pittsburgh 46 pilot (23, 16 family) ·
Detroit 33 (13) · Buffalo 29 (9) · Baltimore 29 (10). preScore: 192 threes / 220 twos / 108 ones /
15 zeros; 57% family-owned. Market rationale + rejected markets: [[opl-market-city-targeting]].
