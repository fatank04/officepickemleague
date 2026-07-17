# Refinement Schema v2 — Apollo export → send/mail/call-ready list

The "Clay layer," defined tool-agnostically: run it manually/spreadsheet at wave-1 volume,
import as a Clay table only when a scale gate hits ($185/mo stays deferred). One row per
CONTACT; account-level fields repeat. v2 adds the kit/call fields (address, phone, ring,
outcome tracking) — this sheet is now the single operating record for all three rings.

## Columns

| Col | Field | Source / rule |
|---|---|---|
| A | company, domain, city, headcount, industry | Apollo export, as-is |
| B | firstName, lastName, title | Apollo export |
| C | **email** | Waterfall: Apollo → verify (NeverBounce/ZeroBounce). Keep only `valid`; `catch-all` → low-volume pool; `invalid` dropped |
| D | **tierPrice** | headcount ≤50 → "$400" · ≤150 → "$900" · ≤400 → "$1,900" · ≤1,000 → "$3,750" (Founding rates — must match /pricing) |
| E | **shiftSignal** (0/1) | Website/LinkedIn mentions shifts, plants, yards, dispatch, CDL, union, "family owned since" |
| F | **footballSignal** (0/1) | Company socials show Steelers content, tailgates, game-day posts |
| G | **sizeFit** (0–2) | 2: 50–400 employees (sweet spot) · 1: 25–50 or 400–1,000 · 0: outside |
| H | **roleFit** (0–2) | 2: Owner/Pres/GM or HR · 1: Office/Ops Mgr · 0: other |
| I | **SCORE** | E+F+G+H (0–6). Ring 1 = top 20 of the 5–6s · Ring 2 = next 30 at 4+ · Ring 3 send order: 5–6 first, 3–4 normal, ≤2 hold |
| J | **personalLine** | ONE researched sentence for Email 1. Formula: [specific real detail] + [football/league tie]. Ex: "Saw the plant runs three shifts — that's three shifts of people who all think they know football better than each other." Never generic flattery; if nothing real in 2 min, use the shiftSignal fallback line |
| K | **ring** (1/2/3) | 1–2 → EXCLUDED from cold sequence; they get the kit-recipient variant, started 2–3 days after tracked delivery and AFTER the first call attempt |
| L | **streetAddress** | Rings 1–2 only. HQ street address, verified on the company website (not Apollo alone, not a PO box) |
| M | **phone** | Rings 1–2: direct line if findable, else main line. Ring 3: main line, optional |
| N | **labelName** | Rings 1–2: exact name for the shipping label — the buyer human, never "HR Department" |
| O | **kitTracking** | USPS tracking # once shipped; delivery date once landed (triggers call + email variant) |
| P | **callLog** | attempt dates + outcome: NA (no answer) / VM / GATE (gatekeeper) / CONV (conversation) / MTG / LEAGUE |
| Q | suppression | Existing league, competitor, opt-out, bounced — never re-add |

## Clay translation (when a scale gate hits)
- C = waterfall enrichment column (Clay's native email waterfall + validation)
- E/F/J = "Use AI" columns with the research prompts above verbatim (J's prompt: "Find one
  specific, verifiable detail about {{company}} from their website/LinkedIn and write one
  sentence connecting it to running a workplace football pick'em league. Cheeky, blue-collar,
  no flattery. If nothing verifiable, output NONE.")
- D/G/H/I = formula columns · L/M = Clay's address/phone enrichment
- Export → Instantly via native integration, mapped to the sequence variables.

## Quality gates
**Before any list hits Instantly:**
1. Zero `invalid` emails; catch-alls ≤20% of the batch.
2. Spot-check 10 random personalLines — every one must reference something real.
3. Dedupe on email AND on company+lastName.
4. ring≤2 and suppression rows removed from the cold sequence.

**Before any kit ships (Rings 1–2):**
5. streetAddress verified against the company website; labelName is a person.
6. phone present for every Ring-1 row (a kit without a follow-up call is half a kit).
