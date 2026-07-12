# Canonical Facts — Office Pick'em League

Every deck, doc, pricing page, and piece of marketing copy has to match these. This came out of a full collateral audit on 2026-07-07 after the numbers drifted into two conflicting sets. My call: **match the spreadsheet.**

Source of truth = `06-financials/office-pickem-financial-model.xlsx`, the **Scenarios tab**. Only that tab has cached values; the P&L tab cells don't cache, so don't read numbers off it.

---

## Financials — USE THESE

- Revenue: **~$32K (2026) → ~$2.48M (2030)**.
  - 2026 = $32K total: B2C ~$10K + roughly 12 founding logos × ~$1,800 ≈ $22K B2B. The old "$10K" figure was wrong — that was B2C only.
- **NPV +$4.6M · IRR ~106% · peak funding ~$2.2M · LTV:CAC ~5.0 · payback ~17 months.**
- Scenarios:
  - Base: **+$4.6M / 106%**
  - Bull: **+$16.9M / 189%**
  - Bear: **−$0.6M / ~breakeven**
  - Base + Data: **+$5.3M / ~113%**
- Unit economics: ACV ~$3,200 · NRR 112% · gross margin 78% · 25% discount rate · 6× exit multiple.

### Stale financials — DO NOT USE (purge on sight)

$2.52M · +$4.8M · 109% · $2.1M peak · Bull +$17.3M / 198% · Base+Data +$5.5M.

This set had crept into: investor deck slide 15, the financial-model-summary headline, the operating-strategy docx, and the strategy deck. All were fixed in the audit — but if you see these numbers reappear, they're wrong.

---

## Other locked facts

- **2026 NFL kickoff = Wednesday, September 9, 2026** (Seahawks–Patriots). Not "Sep 10." Fixed in the investor deck and foundation doc; the sales deck and strategy deck were already right.
- **Gallup Q12, 11th edition:** **+23% profitability / +18% productivity / 63% fewer safety incidents** (top vs. bottom quartile). Verified correct. The "+22% / +21%" that appeared in the exec summary and foundation doc was an older edition — fixed.
- **Team-building spend = $100–500 per employee per year** (SPIN research). Fixed the sales deck's "$100–350 engagement."
- **GTM motion = dimensional-mail KIT (branded football) + geo-social + local PR, stage-gated Pittsburgh-first (25 wave-1 accounts).** NOT the old "postcard → 400–500 buyers" framing. That was rewritten across investor deck slides 12 (distribution), 13 (GTM), 14 (execution), plus "postcard" references in the pricing-model and financial-model-summary docs.

---

## Editing decks / docs — mechanics

The corrected partner package was rebuilt at `Claude Cowork\office-pickem-league\OfficePickem_Partner_Package.zip`.

Deck edits were done at the raw XML level: unzip the pptx/docx → replace the `<a:t>` (pptx) / `<w:t>` (docx) text runs → rezip. Build the zip in `/tmp`, not the outputs mount (zip can't be created directly in the mount), then copy it back. Visual QA was done by rendering with `soffice` and eyeballing.
