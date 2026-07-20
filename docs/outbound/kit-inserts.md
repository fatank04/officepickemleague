# Kit Inserts — print-ready (both Telnyx variants) — staged 2026-07-19

Everything that goes in the box, finalized so it can go to print the moment the **Jul 24–27
Telnyx checkpoint** resolves. Copy is locked to docs/CANONICAL_FACTS.md — do not ad-lib numbers.

## WHICH VARIANT TO PRINT (decide at the Telnyx checkpoint)

- **Telnyx brand VERIFIED → print Variant A** (text-to-join is the hero response).
- **Not verified at print time → print Variant B** (QR/web-join hero; text line omitted).
  Do NOT hold the drop waiting on Telnyx — B is a first-class fallback, not a downgrade.

Only the **response line** differs between A and B. The letter body, the paper pick-sheet, and
all print specs are identical either way — so the only open decision on Jul 24–27 is A vs B.

---

## 1. Welcome letter — shared body (both rings, both variants)

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
> **《RESPONSE LINE — Variant A or B, see below》**
>
> Doris in receiving is going to win your league. Let's get her started. — Ankur

### Variant A — response line (Telnyx VERIFIED)
> **Text `FOOTBALL` to «VERIFIED TELNYX NUMBER» and I'll set {{company}}'s league up today.**
> Prefer the web? Scan below. → [QR]

### Variant B — response line (QR / web-join fallback)
> **Scan to start — I'll have {{company}}'s league live before kickoff.** → [QR]
> (Or call the number on the card I'll follow up with.)

**Ring split (only difference between Ring 1 and Ring 2 letters):**
- Ring 1 (full-size kit) → QR encodes `https://officepickemleague.com/?utm_source=kit1`
- Ring 2 (mini kit) → QR encodes `https://officepickemleague.com/?utm_source=kit2`
- Body copy is otherwise word-for-word identical across rings.

### Pre-print checklist
- [ ] Variant chosen (A only if Telnyx shows **VERIFIED** in-portal on Jul 24–27).
- [ ] Variant A only: real verified Telnyx number dropped in, and the `FOOTBALL` keyword is
      confirmed to route to the start-a-league flow (test-text it yourself first).
- [ ] QR generated from the EXACT utm URL per ring, and scan-tested with a phone.
- [ ] `{{company}}` merged correctly on every card (spot-check 5).

---

## 2. Paper pick-sheet (the product-in-the-box)

This is an **app-generated artifact**, not free copy — produce it, don't rewrite it:
- Generate from `/l/{slug}/admin/sheets`. Until a real league exists for the account, print the
  **demo-league sheet marked `SAMPLE`** (the playbook's spec).
- Ring 1: a **10-sheet pad**. Ring 2: **3 loose sample sheets**.
- The sheet already carries the week's matchups with check-boxes + the "snap a photo, text it in"
  instruction — that instruction line only functions once messaging is verified, so it matches
  whichever Telnyx variant you printed. If Variant B (unverified), the sheet still demos the paper
  motion; the photo-submission goes live when the league's SMS activates (SMS-activation framing).

---

## 3. Print & QR specs (identical both variants)

| Item | Spec |
|---|---|
| Welcome card | 8.5 × 5.5, card stock, 1-sided, brand blue `#4f8cff` + black on white |
| QR | Generate per-ring from the exact utm URL above; ≥ 1" square; test-scan before bulk run |
| Pick-sheet | App-generated (see §2); Ring 1 = 10-pad, Ring 2 = 3 loose |
| Quantities | 22 Ring-1 sets (20 + 2 spare), 30 Ring-2 sets |
| Vendor | Vistaprint/low-minimum for cards; pads DIY or same vendor |

**QR generation:** any offline generator (e.g. `qrencode -o kit1.png "https://officepickemleague.com/?utm_source=kit1"`).
Keep the two ring QRs in clearly-named files so the wrong utm never lands in the wrong ring.

## Do NOT put in the box
Pricing tables (offer is "free to start" + "more than half off" — no price matrix), the words
"four ways in" (DEAD — it's **three ways**), any gambling/buy-in language, any invented stat.
