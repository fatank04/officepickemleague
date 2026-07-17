# Outbound Metrics Sheet — targets, math, and kill criteria

## Infrastructure guardrails (Instantly)
- 2 lookalike domains × 3 inboxes = 6 senders. Warmup ≥14 days (21 better) before real volume.
- Ramp: 10/inbox/day wk1 → 20 wk2 → 30 cap. Steady state ≈ 150–180 sends/day.
- Warmup stays ON forever. Any inbox <85% warmup deliverability → rest it 5 days.

## Funnel targets (cold B2B, personalized)

| Stage | Floor | Good | Great |
|---|---|---|---|
| Deliverability (non-bounce) | 97% | 98.5% | 99% |
| Reply rate (all) | 2% | 5% | 8%+ |
| Positive reply share | 25% | 40% | 50% |
| Positive → demo booked | 50% | 60% | 75% |
| Demo → Founding close | 20% | 30% | 40% |

**The math to one close:** at "good" (5% reply · 40% positive · 60% demo · 30% close)
→ ~1 close per ~280 contacts sequenced. Wave-1 list of 600 contacts ≈ 2 closes from cold
email alone; kits + geo-social + referrals carry the rest of the Founding-50 path. This is
why cold email is the *air cover*, not the whole plan.

## Weekly review (every Monday, 15 min)
1. Bounce rate >3% on any batch → STOP, re-verify the list source before resuming.
2. Reply rate after 200+ sends of a step <2% → rewrite that step (subject first, then first
   two lines). Change ONE variable at a time.
3. Spam-complaint >0.1% or two straight weeks of declining warmup scores → rest domain,
   investigate copy for spam triggers.
4. Track in one sheet: sends, bounces, replies, positives, demos, closes — per step, per week.

## Kill / scale criteria (aligns with the $1,500-envelope gate discipline)
- **Kill:** after 1,000 sends at full personalization, reply <2% AND zero demos → the channel
  isn't working for this ICP; stop spend, keep domains warming, revisit ICP or offer.
- **Scale:** ≥2 demos or 1 close from the first ~500 contacts → add wave-2 city, consider
  Clay ($185/mo) and a third domain.
- Calendar hard-stop: after **Sep 9 kickoff**, switch messaging from "before kickoff" urgency
  to "join mid-season — scoring starts where you start" (Email 3 variant), and expect lower
  urgency conversion; judge the channel on pre-kickoff data only.

## Stack cost snapshot (verified 2026-07)
Apollo Basic $49/mo · Instantly Growth $47/mo · (defer Clay $185/mo until scale criteria hit)
→ lean stack ≈ $96/mo. Domains ~$20/yr each; inboxes (Google Workspace) ~$7/user/mo.
