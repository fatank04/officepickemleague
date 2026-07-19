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

- **Pricing card (updated 2026-07-18 — comp-substantiated reprice):** Founding Season 2026 (unchanged): **$400 / $900 / $1,900 / $3,750** for up-to 50 / 150 / 400 / 1,000 employees, locked 3 seasons, Week-8 money-back guarantee, no card to start. **Standard rates: $750 / $2,250 / $5,400 / $9,900** (old $1,800/$3,900/$7,500 are DEAD — purge on sight). Messaging: founding = "**more than half off** the standard rate" (no longer "about half off"). Substantiation: wellness-challenge comps — Count.It meters an 18-week challenge at ~$1,775 (150 emp) / ~$4,925 (400) / ~$12,485 (1,000); Terryberry ~$15.75/participant per 18 wks; Big Team Challenge ~$935–$5,800 for only 6 weeks; every new standard number sits inside the verified comp band (research 2026-07-18). Enterprise 1,000+ custom; nonprofits/schools 30% off.
- **Packaging (updated 2026-07-19):** Base (all tiers, flat price — unchanged) = **three ways to play (web, text, paper)**, automatic scoring/grading/standings, commissioner console, and basic branding (league name, colors, logo, prize board). **Premium add-ons — any tier, UNPUBLISHED "talk to us" (never a price matrix on the site):** (1) **concierge phone line** (call-in / conversational voice agent — this is the former 4th modality, now decoupled, NOT in base), (2) **multi-department / multi-site**, (3) **white-label** (own domain, OPL marks removed, co-branded sheets). Indicative internal-only starting points to validate: concierge ~+$500/season, white-label ~+$500–1,000, multi-site custom. Messaging = "**three ways in**"; the old "**four ways in**" is DEAD — purge on sight. **SMS-activation framing (use on pricing/FAQ):** web play works day one; text features (reminders, pick-by-text, paper-photo submission) activate once the league's messaging is verified, typically within the first weeks.
- **2026 NFL kickoff = Wednesday, September 9, 2026** (Seahawks–Patriots). Not "Sep 10." Fixed in the investor deck and foundation doc; the sales deck and strategy deck were already right.
- **Gallup Q12, 11th edition:** **+23% profitability / +18% productivity / 63% fewer safety incidents** (top vs. bottom quartile). Verified correct. The "+22% / +21%" that appeared in the exec summary and foundation doc was an older edition — fixed.
- **Team-building spend = $100–500 per employee per year** (SPIN research). Fixed the sales deck's "$100–350 engagement."
- **GTM motion = dimensional-mail KIT (branded football) + geo-social + local PR, stage-gated Pittsburgh-first (25 wave-1 accounts).** NOT the old "postcard → 400–500 buyers" framing. That was rewritten across investor deck slides 12 (distribution), 13 (GTM), 14 (execution), plus "postcard" references in the pricing-model and financial-model-summary docs.

---

## Editing decks / docs — mechanics

The corrected partner package was rebuilt at `Claude Cowork\office-pickem-league\OfficePickem_Partner_Package.zip`.

Deck edits were done at the raw XML level: unzip the pptx/docx → replace the `<a:t>` (pptx) / `<w:t>` (docx) text runs → rezip. Build the zip in `/tmp`, not the outputs mount (zip can't be created directly in the mount), then copy it back. Visual QA was done by rendering with `soffice` and eyeballing.
