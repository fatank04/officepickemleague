# Kit Inserts — print-ready (QR-only response line) — staged 2026-07-19

Everything that goes in the box, print-ready. Kits are **minis-only** (150 First Down foam
footballs ordered 2026-07-19). Copy is locked to docs/CANONICAL_FACTS.md — do not ad-lib numbers.

## RESPONSE LINE: QR-ONLY (decided 2026-07-22)

**Print the QR/web-join response line. The "Text FOOTBALL" variant is DEAD** — the Telnyx number
is a **player** line (JOIN/picks/photo sheets); the app has no employer start-a-league text flow,
so an employer texting FOOTBALL would get "We don't recognize this number." The kit CTA is:
employer scans the QR → landing page → you follow up by phone. SMS stays the product
differentiator *inside* the box (the paper sheet's "snap a photo, text it in" line), not the
response channel.

---

## 1. Welcome letter — shared body (both rings)

Print on 8.5 × 5.5 card stock, one side. Brand blue `#4f8cff` headline on white.
`{{company}}` is hand-personalized per account (mail-merge from the refinement sheet).

> ## This football is a job application.
>
> I'd like to run **{{company}}'s** office football pool this season — the kind with **no money,
> no app, and everybody in it**. Winners, spreads, over/unders — two minutes a week, **three ways
> to play: on the web, by text, or on the paper sheets in this box** (check the boxes, snap a
> photo, text it in — that's a real way to play, built for the floor, not just the desk).
>
> **It's free to start.** I do the setup; you forward one link to the crew. Founding season is
> **more than half off** the standard rate and locks that price for three years — but I only run
> a handful of founding leagues, and **kickoff is Sept 9**.
>
> **Scan to start — I'll have {{company}}'s league live before kickoff.** → [QR]
> (Or call the number on the card I'll follow up with.)
>
> Doris in receiving is going to win your league. Let's get her started. — Ankur

**Ring split (only difference between Ring 1 and Ring 2 letters):**
- Ring 1 (richer mini kit: 10-sheet pad + handwritten note) → QR encodes `https://officepickemleague.com/?utm_source=kit1`
- Ring 2 (mini kit: 3 sample sheets) → QR encodes `https://officepickemleague.com/?utm_source=kit2`
- Body copy is otherwise word-for-word identical across rings.

### Pre-print checklist
- [ ] QR generated from the EXACT utm URL per ring, and scan-tested with a phone.
- [ ] `{{company}}` merged correctly on every card (spot-check 5).
- [ ] **Ring 1 only:** handwritten note added per account (copy + rules: kit-and-call-playbook.md § Handwritten note).

---

## 2. Paper pick-sheet (the product-in-the-box)

This is an **app-generated artifact**, not free copy — produce it, don't rewrite it:
- Generate from `/l/{slug}/admin/sheets`. Until a real league exists for the account, print the
  **demo-league sheet marked `SAMPLE`** (the playbook's spec).
- Ring 1: a **10-sheet pad**. Ring 2: **3 loose sample sheets**.
- The sheet already carries the week's matchups with check-boxes + the "snap a photo, text it in"
  instruction — that line is LIVE (Telnyx SMS end-to-end since 2026-07-22) once the account's
  league exists; on the SAMPLE sheet it demos the paper motion, and photo-submission activates
  with the league.

---

## 3. Print & QR specs

| Item | Spec |
|---|---|
| Welcome card | 8.5 × 5.5, card stock, 1-sided, brand blue `#4f8cff` + black on white |
| QR | Generate per-ring from the exact utm URL above; ≥ 1" square; test-scan before bulk run |
| Pick-sheet | App-generated (see §2); Ring 1 = 10-pad, Ring 2 = 3 loose |
| Quantities | 20 Ring-1 sets (10-sheet pad + handwritten note) + 30 Ring-2 sets (3 sheets); print ~55 cards for spares |
| Vendor | Vistaprint/low-minimum for cards; pads DIY or same vendor |

**QR generation:** any offline generator (e.g. `qrencode -o kit1.png "https://officepickemleague.com/?utm_source=kit1"`).
Keep the two ring QRs in clearly-named files so the wrong utm never lands in the wrong ring.

## Do NOT put in the box
Pricing tables (offer is "free to start" + "more than half off" — no price matrix), the words
"four ways in" (DEAD — it's **three ways**), any gambling/buy-in language, any invented stat.
