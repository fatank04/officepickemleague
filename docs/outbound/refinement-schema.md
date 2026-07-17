# Refinement Schema — Apollo export → send-ready list

The "Clay layer," defined tool-agnostically: run it manually/spreadsheet now at wave-1 volume
(300–500 accounts), import as a Clay table when volume or multi-city justifies $185/mo. One row
per CONTACT; account-level fields repeat.

## Columns

| Col | Field | Source / rule |
|---|---|---|
| A | company, domain, city, headcount, industry | Apollo export, as-is |
| B | firstName, lastName, title | Apollo export |
| C | **email** | Waterfall: Apollo → verify (NeverBounce/ZeroBounce or Clay waterfall). Keep only `valid`; `catch-all` goes to a low-volume pool; `invalid` dropped |
| D | **tierPrice** | headcount ≤50 → "$400" · ≤150 → "$900" · ≤400 → "$1,900" · ≤1,000 → "$3,750" (Founding rates — must match /pricing) |
| E | **shiftSignal** (0/1) | Website/LinkedIn mentions shifts, plants, yards, dispatch, CDL, union, "family owned since" |
| F | **footballSignal** (0/1) | Company socials show Steelers content, tailgates, game-day posts |
| G | **sizeFit** (0–2) | 2: 50–400 employees (sweet spot) · 1: 25–50 or 400–1,000 · 0: outside |
| H | **roleFit** (0–2) | 2: Owner/Pres/GM or HR · 1: Office/Ops Mgr · 0: other |
| I | **SCORE** | E+F+G+H (0–6). Send order: 5–6 first ("hot"), 3–4 normal, ≤2 hold |
| J | **personalLine** | ONE researched sentence for Email 1. Formula: [specific real detail] + [football/league tie]. Ex: "Saw the plant runs three shifts — that's three shifts of people who all think they know football better than each other." Never generic flattery; if nothing real found in 2 min, use the shiftSignal fallback line |
| K | kitAccount (0/1) | Is this one of the 25 kit accounts? If 1 → EXCLUDE from cold sequence; they get the kit-synced track instead |
| L | suppression | Existing league, competitor, opt-out, bounced — never re-add |

## Clay translation (when adopted)
- C = waterfall enrichment column (Clay's native email waterfall + validation)
- E/F/J = "Use AI" columns with the research prompts above verbatim (J's prompt: "Find one
  specific, verifiable detail about {{company}} from their website/LinkedIn and write one
  sentence connecting it to running a workplace football pick'em league. Cheeky, blue-collar,
  no flattery. If nothing verifiable, output NONE.")
- D/G/H/I = formula columns
- Export → Instantly via native integration, mapped to the sequence variables.

## Quality gates (before any list hits Instantly)
1. Zero `invalid` emails; catch-alls ≤20% of the batch.
2. Spot-check 10 random personalLines — every one must reference something real.
3. Dedupe on email AND on company+lastName.
4. kitAccount=1 and suppression rows removed.
