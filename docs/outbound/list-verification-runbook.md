# List Verification Runbook — Apollo → MillionVerifier → Instantly (staged 2026-07-19)

Execute-ready for **early August**, before the first cold send. Turns the Apollo export into a
clean, low-bounce send list. Apollo emails are only ~70–85% accurate — **nothing goes to Instantly
un-verified** (metrics-sheet.md kill gate: bounce >2% = STOP). Depth check already done
(379 companies / 1,817 people, 2026-07-19).

## Prereqs (have these before you start)
- [ ] **Apollo Basic** upgraded (~$49/mo) — needed for the export volume + the address/phone fields.
- [ ] **MillionVerifier** account + credits (~$1 per 1k; buy for your list size + 20% headroom).
- [ ] Instantly campaign shell built (6 inboxes connected, warmup ON — done 2026-07-18).

## Step 1 — Export from Apollo
- Apply the saved searches in `apollo-icp-spec.md`. Export **max 2 contacts/account** (1 buyer +
  1 champion) — more = duplicate-outreach risk.
- Fields (per apollo-icp-spec §Exports): name, title, company, headcount, industry, LinkedIn URL,
  company domain, city, **company street address, company phone**.
- Don't over-export — Apollo credits don't refund. Fill Ring 3 up to what the depth check supports
  (~1,000–1,500), no more.

## Step 2 — Split and prep the CSV
1. **Pull the 50 kit accounts into their own file** (`kit-accounts.csv`). They are EXCLUDED from
   the cold sequence (they get the kit-recipient variant after delivery + call — apollo-icp §Selecting).
   The kit list still gets verified (a bounced kit-follow-up email wastes the touch), just kept separate.
2. Remaining = `ring3-raw.csv` (the cold universe).
3. Dedupe by email, then by person (same name+company across two rows). Trim whitespace, lowercase
   emails, drop any row with no email.
4. Keep one column as a stable `id` so you can re-join verification results.

## Step 3 — Verify in MillionVerifier
- Upload `ring3-raw.csv` (and `kit-accounts.csv`) to MillionVerifier → run bulk verify.
- Result buckets (keep / cut):
  - **ok / good** → **KEEP.** Safe to send.
  - **catch-all / accept-all** → **HOLD.** Domain accepts everything; real deliverability unknown.
    Default: exclude from the first sends. Only fold in later, in small doses, once your domains
    have a clean bounce history — never in the opening batch.
  - **unknown** → **CUT** from send (re-check a later run if you want; don't risk it early).
  - **invalid / bad** → **CUT.**
  - **disposable** → **CUT.**
- Download the "good/ok" list — that's your sendable file.

## Step 4 — Build the final send list
- `ring3-send.csv` = ok-only rows, re-joined to the personalization fields (company, first name,
  shift/industry signal from refinement-schema.md for the `{{}}` merge vars in sequence-copy.md).
- Sanity: bounce risk should now be well under the 2% gate. If **ok-rate < ~75%**, the Apollo
  source segment is weak — re-check filters before blaming the send.
- Log counts: raw → deduped → ok → sending. Silent shrinkage hides a targeting problem.

## Step 5 — Import into Instantly
- Upload `ring3-send.csv`; map merge fields (first name, company, signal) to the sequence variables.
- **Do not blast.** Respect the ramp (metrics-sheet.md): 5–10/inbox/day wks 1–2 → 15 wk 3 →
  20–25 wk 4+, hard cap 30/inbox/day (50 absolute incl. warmup). Steady state ≈ ~150/day across
  6 inboxes, reached ~mid-August. Warmup stays ON forever.
- Enable Instantly's built-in bounce/reply detection; verify the tracking domain is the custom one.

## Step 6 — Guardrails while sending (from metrics-sheet.md)
- **Bounce >2% on any batch → STOP**, re-verify the source (this runbook exists to prevent that).
- Any inbox <85% warmup deliverability → rest it 5 days.
- Spam complaints >0.1% → pause, audit copy.
- **Email kill gate:** 1,000+ fully-personalized sends, reply <2% AND zero activations → stop spend,
  keep domains warming, revisit list/offer.

## Ordering note
Run this **after** Apollo Basic is live and **before** the send window opens (early Aug). Verification
is same-day; the constraint is warmup readiness (~Aug 17–20), not the list. Re-run Step 3 on any
list that's sat >30 days — emails decay. Wave 2 (Buffalo/Cleveland/Cincinnati) repeats this runbook.
