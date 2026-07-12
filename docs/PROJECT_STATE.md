# Project State — Office Pick'em League

Snapshot of where we left off. Point-in-time as of early July 2026. Verify against `main` and the live site before treating any of this as current.

---

## Shipped into the repo (was pending my commit + push — confirm on `main`)

**UX walkthrough + fixes:**
- New `InviteBanner.tsx` — invite banner + copy-link on the Picks page for commissioners.
- "Admin" link added to nav — the admin console was previously unreachable.
- Enroll flow no longer lies when SMS fails. It now returns `smsSent`, shows the PIN once, and offers a web fallback. This softens the hard A2P gate so people can still join if texting isn't live.
- Submit-model copy fixed ("picks save as you tap").
- Disabled-button styling.
- Insights README leak removed.
- Join-code helper text.
- Deleted 12 tracked `.fuse_hidden` junk files and added a gitignore rule.

**Pricing:**
- `/pricing` page published. Founding tiers $400 / $900 / $1,900 / $3,750 with standard 2x struck through.
- Review verdict: keep the card. Amendments = a soft free-tier fence (web-only, ≤15 players free; texting / branding / unlimited require Founding) and make the Week-8 guarantee measurable (opt-in ≥30%, weekly pick-rate ≥60%).
- Doc: `01-strategy/pricing-review-2026-07-01.md`.

**SEO / GEO:**
- Shipped: `robots.ts`, `sitemap.ts`, OG/Twitter metadata, homepage rewritten as a server-rendered marketing page (h1, how-it-works, HR section, 6-question FAQ), JSON-LD (SoftwareApplication + FAQPage), `public/llms.txt`.
- Next: 4 metro landing pages, Search Console, OG image.
- Doc: `07-gtm/seo-geo-plan-2026-07-01.md`.

---

## Twilio 10DLC / A2P — the texting critical path

Updated 2026-07-07. EIN is in hand, dated 7/7/2026 → can submit the Standard brand now.

- The "15-day-old-EIN rule" is a **reseller myth**, not an official Twilio/TCR requirement (verified against Twilio's own troubleshooting doc). The only real age risk is a too-new EIN not yet propagated to IRS-linked vetting DBs, which can cause a FAILED brand. Fix = 3 free self-service resubmissions, or a $10 manual appeal to Twilio Support with the CP575/147C letter (~5–7 business days).
- **Two real pre-submit failure causes:**
  1. Brand contact email must be a **business domain**, not gmail — Twilio Authentication+ rejects gmail.com (error 21740). Use `you@officepickemleague.com`.
  2. Legal name / address must match the EIN letter character-for-character.
- **Structure:** one Standard brand + one Low-Volume-Standard "Mixed" campaign + one Messaging Service holding many local numbers. Wave-1 cities (Pittsburgh 412 pilot → Buffalo 716 → Cleveland 216 → Cincinnati 513) all ride the SAME brand + campaign. Expansion = add a number to the pool, no re-registration.
- **Timing:** campaign review ~10–15 days, end-to-end 1–4 weeks. Time the kit drop ~2–3 weeks after campaign approval. Web-join fallback covers us if review drags.
- Canonical playbook: `02-product/twilio-10dlc-GO-checklist.md`. It supersedes the older runbook and registration packet, which have Netlify-stale deploy sections.

---

## GTM — $1,500 staged envelope (kits stage-gated, not killed)

- ~$300 for 100 branded footballs now (3–4 week lead time).
- ~$150 for 25 Pittsburgh first-wave kits.
- ~$125 enrichment.
- $550 geo-social flight (synced to the kit window).
- $0 PR.
- ~$350 gated reserve. Release triggers: ≥2 demos or 1 pilot from the 25 kits → fund wave 2; social CPL ≤$40 → shift budget to ads.
- Doc: `07-gtm/gtm-1500-budget-plan-2026-07-01.md`.
- Note: the GTM motion is the dimensional-mail KIT + geo-social + local PR, Pittsburgh-first. The old "postcard → 400–500 buyers" framing is dead — see CANONICAL_FACTS.

---

## Housekeeping

- **Delete test data:** "ZZ Test League" (slug `zz-test-league-68nr`), plus players "ZZ Test Commish" and "ZZ Test Player". ("ZZ Nobody Test" in the demo league was a confirm-step test only, never created.)
- Data room canonical path: `Claude Cowork\office-pickem-league\office-pickem-data-room`. UX audit at `02-product/ux-audit-2026-07-01.md`.

---

## Suggested first moves in a fresh Claude Code session

1. Confirm what's actually on `main` vs. the "pending commit" list above.
2. Run the verify suite (`npx tsc --noEmit`, unit tests, `next lint`) to get a clean baseline.
3. Check the live Render deploy is healthy.
4. Pick up the Twilio A2P submission or the 4 metro landing pages, whichever I point you at.
