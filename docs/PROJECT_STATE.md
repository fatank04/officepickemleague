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

## GTM — $1,500 fused funnel (v2, rebuilt 2026-07-17 — SUPERSEDES the staged envelope)

- **Canonical doc: `docs/outbound/gtm-plan.md`** + the four playbooks beside it
  (apollo-icp-spec, refinement-schema, sequence-copy, metrics-sheet, kit-and-call-playbook).
- Goal: **5–10 leagues LIVE by Sept 9** (activation, not signed checks — free to start).
  Motion: three concentric rings, one offer ("free to start, I set it up myself"):
  Ring 1 = 20 full-size football kits + calls + LinkedIn (~$560) · Ring 2 = 30 mini kits +
  calls (~$330) · Ring 3 = cold email ~1,000–1,500 contacts (~$300 stack) · phone ~$35 ·
  gated reserve ~$275 (trigger: ≥2 leagues or ≥4 hot convos from the 50 kits).
- **DEAD, evidence-based — do not resurrect:** the $550 geo-social flight (Meta learning-phase
  math: sub-$600 B2B flights are structurally too small), Sales Navigator, the 14–21-day
  warmup assumption (2026 floor is 30 days), and demo-first CTAs (offer-CTAs win decisively).
- Footballs ship in 3–7 days, not the old "3–4 week" assumption; minis have 100-unit
  minimums (extras = wave-2 stock). Old `07-gtm/gtm-1500-budget-plan-2026-07-01.md` is
  historical only.

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
