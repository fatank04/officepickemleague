# Outbound Metrics Sheet v2 — targets, math, and kill criteria

Rebuilt 2026-07-17 for the $1,500 fused-funnel plan (see gtm-plan.md). North star:
**leagues live by Sept 9** — track activations, not just replies.

## Infrastructure guardrails (Instantly)

- 2 lookalike domains × 3 inboxes = 6 senders. **Warmup ≥30 days** (2026 consensus floor;
  4–6 weeks to full volume — the old 14-day assumption is dead). Warmup stays ON forever.
- Ramp per inbox: 5–10/day wks 1–2 → 15 wk 3 → 20–25 wk 4+. Hard cap 30/inbox/day
  (50 absolute incl. warmup sends). Steady state ≈ **~150/day across 6 inboxes, reached
  ~mid-August** if domains are live the week of July 21.
- Any inbox <85% warmup deliverability → rest it 5 days. Bounce >2% on any batch → STOP,
  re-verify the list source.

## Funnel targets

### Kits (Rings 1–2, n=50)
*Minis-only as of 2026-07-19 (full-size dropped). A boxed mini foam football is still dimensional
mail but a lighter wow than a leather ball — read Response toward the floor and lean on the
Ring-1 handwritten note + the founder call to lift it.*
| Stage | Floor | Good | Great |
|---|---|---|---|
| Delivered (tracked) | 95% | 98% | 100% |
| Response (any channel, incl. after call) | 5% | 8–10% | 15% |
| Call connect rate (SMB owners; 3–4 attempts) | 15% | 20% | 25% |
| Conversation → league created | 30% | 50% | 70% |

### Cold email (Ring 3)
| Stage | Floor | Good | Great |
|---|---|---|---|
| Deliverability (non-bounce) | 97% | 98.5% | 99% |
| Reply rate (2026 industry avg = 3.4%) | 2% | 4–5% | 8%+ |
| Positive share of replies | 25% | 40% | 50% |
| Positive → league created (concierge) | 30% | 50% | 65% |

### Facebook-organic (free layer, groups + DMs — see facebook-organic-playbook.md)
Replaces LinkedIn (this owner persona lives on Facebook, not LinkedIn). ~30 min/day, 5 days/wk.
Weekly funnel once warmed: ~50–75 friend requests → ~50% accept → 10–25 DM conversations →
positive convo ≈ activation (free league closes in the DM, no call gate). No automation EVER
(ban risk; the founder account is irreplaceable). 1–2 wk warmup before DMing, so near-zero
before ~Aug, compounds after. Track: requests / accepts / convos / leagues, weekly.

**The math to the goal:** 50 kits at "good" ≈ 4–5 convos ≈ 2–3 leagues. Email at "good"
(~1,200 contacts, 4.5% reply, 40% positive, 50% activate) ≈ 8–10 leagues; at "floor" ≈ 2.
Blended honest expectation: **4–7 leagues live; 10 = everything breaks right.**

## Weekly review (every Monday, 15 min)
1. Kits: delivered / called / connected / convos / leagues — per ring.
2. Email: sends, bounces, replies, positives, activations — per step. Reply <2% after 200+
   sends of a step → rewrite subject first, then first two lines. One variable at a time.
3. Spam complaints >0.1% or two weeks of declining warmup scores → rest domain, audit copy.
4. Leagues created this week + cumulative vs. the 5–10 goal.

## Kill / scale gates
- **Reserve release ($365):** ≥2 leagues live OR ≥4 hot conversations from the 50 kits →
  wave-2 kits (hot email repliers get one) or Buffalo minis (~100 already in hand from the 150 order).
- **Email kill:** 1,000+ sends at full personalization, reply <2% AND zero activations →
  stop spend, keep domains warming, revisit list/offer.
- **Call kill:** none — calls are free. If connects <10% after 100 dials, shift windows
  (8–9am local first, then 4–5pm; Wed/Thu best).
- **Calendar hard-stop:** after Sept 9, flip messaging to "join mid-season — scoring starts
  where you start" and judge all channels on pre-kickoff data only.

## Stack cost snapshot (verified 2026-07)
Apollo Basic $49/mo · Instantly Growth $47/mo · 6 Google inboxes ~$42/mo · 2 domains ~$25
one-time · Quo/Google Voice ~$15/mo. Clay stays DEFERRED until a scale gate hits.
Full budget table: gtm-plan.md.
