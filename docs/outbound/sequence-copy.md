# Outbound Sequence Copy — Founding Season 2026 (v3, league-is-live rebuild)

Three-step sequence for Instantly, ~10 days. Voice: cheeky epic-mundane, blue-collar, "fall"
never "autumn". Send from lookalike domains (getofficepickem.com / tryofficepickem.com), NEVER
the main domain. Plain-text look, no HTML templates.

**v3 changes (2026-08-01):** the pitch caught up with the product.
- **The league already exists.** Every account has a live personalized page at
  officepickemleague.com/kit/{{slug}} — their company name, their team's colors, launchable on
  the spot. v2 asked "want me to build it?"; v3 says "it's built, look." The link IS the CTA;
  a reply stays as the low-friction alternative.
- **Four ways to play, not three** — the concierge phone line exists now and it's the line
  people remember. It also carries the founding perk (free first season).
- **Email 3 closes self-serve.** The checkout flow (pick tier → founding terms → card on file,
  charged Sept 9) hangs off the kit page, so the breakup email ends at a real "start it
  yourself" — not a reply-and-wait.
- **Attribution baked in:** email links carry ?src=e1/e2/e3. Kit-page visits land in /ops/kits
  and the events table tagged by touch. Do NOT enable Instantly open/click tracking — the
  tracking domain hurts deliverability and ?src makes it redundant.
- **One link per email, written bare** (no anchor text, no shorteners) — best deliverability
  posture from a lookalike domain.

Variables from the refinement schema: {{firstName}}, {{company}}, {{personalLine}},
{{tierPrice}} (from headcount), {{cityTeam}} (per metro), {{kitUrl}} =
officepickemleague.com/kit/{{slug}}.

CAN-SPAM footer on every send: real physical mailing address + one-line opt-out
("Not your thing? Reply 'pass' and that's the last you'll hear from me.").

---

## Email 1 — Day 0 · the hook + the page

**Subject:** the office pool, minus the part HR hates

{{firstName}} — every fall it's the same: someone starts a football pool at {{company}},
money changes hands, and somebody in HR quietly has a heart attack.

Office Pick'em League keeps the fun and takes out the money. No buy-ins, no app — your whole
crew picks winners on the web, by text, on a paper sheet in the break room, or by phoning a
number and talking their picks through. Two minutes a week. {{personalLine}}

I already set up {{company}}'s league — your name on it, in {{cityTeam}} colors, ready to
launch. Have a look:

{{kitUrl}}?src=e1

Nothing is billed until kickoff, Sept 9. Or just reply and I'll walk you through it.

---

## Email 2 — Day 4 · the proof (reply-to-thread)

**Subject:** (same thread)

Quick one, {{firstName}} —

Gallup's engagement research: top-quartile teams run +23% profitability, +18% productivity,
63% fewer safety incidents. Nobody claims a football pool does that by itself. But eighteen
weeks of dispatch and the corner office talking trash in the same standings beats the
$100–500 per employee most companies spend on team-building nobody remembers by Friday.

Your league's still sitting there ready, by the way:

{{kitUrl}}?src=e2

Two minutes to look. Zero to set up — I already did that part.

---

## Email 3 — Day 10 · the breakup (new subject)

**Subject:** Doris is going to win your league

{{firstName}} — last one from me.

Here's what happens if you pass: someone at {{company}} runs a cash pool anyway, four people
join, and the same guy wins every year.

Here's the other version: everyone's in — dispatch, drivers, the front office — and the person
who knows the least about football somehow leads Week 6. It's always the quiet one.

You can start it yourself in about two minutes — pick your company size, done. Founding rate
is {{tierPrice}} flat, locked three seasons, Week-8 money-back guarantee, and nothing is
billed until kickoff on Sept 9:

{{kitUrl}}?src=e3

The season starts Sept 9 whether {{company}} is in it or not.

---

## Kit-recipient variant (Rings 1–2 only — accounts that got a football)

Email 1 opens instead with:

**Subject:** the football on your desk

{{firstName}} — I'm the one who mailed {{company}} a football. It wasn't a stunt; it was a
job application. I'd like to run your office football pool this season — no money, no app,
the whole crew in it, from the group that lives on their phones to the folks who'd rather
use the paper sheets in the box.

The QR code on the letter opens {{company}}'s league — already built. Same page here:

{{kitUrl}}?src=e1

Free to start, nothing billed until Sept 9. Or reply and I'll set it up with you.

(Emails 2–3 as above. Never send the cold variant to a kit account — sequence starts 2–3
days after tracking shows delivery, AFTER the first call attempt. For Wave 1 Pittsburgh that
means kit accounts enter the sequence when sending opens ~Aug 17, as touches 3–4 behind the
calls.)

---

## Reply playbook

- **Positive / "yes" / company size given** → build/confirm the league SAME DAY, reply with the
  invite link + 3-line commissioner cheat sheet. Offer a 15-min walkthrough only if they hesitate.
- **"How much?"** → answer in-thread with their exact tier, link /pricing, restate free-to-start
  + billed-at-kickoff + Week-8 guarantee. No gating.
- **Clicked but didn't launch** (page visit with src=e1/e2/e3, no launch) → next-day one-liner:
  "Saw the league page got a look — anything I can answer? Happy to show it live in 15."
- **"Not now"** → "Totally — leagues can start any week; scoring just begins where you join.
  Want me to ping you before Week 4?" (mid-season re-touch list)
- **"Who is this?" / suspicious** → real name, link to officepickemleague.com, note the kits'
  physical address matches the footer. One human, no pressure.
- **"pass" / any opt-out** → suppress in Instantly immediately, account-level.

## Sending mechanics (launch ~Aug 17)

- 6 inboxes ramped per Instantly's schedule; hold each inbox ≤30 new sends/day the first week.
- Kit accounts (Pittsburgh + all Wave 2/3 cities) get the kit variant; everyone else verified
  in the 7 metros gets the cold sequence. One thread per human; if a buyer and a champion are
  both sequenced at one account, stagger starts by 3 days and never reference the other.
- No open tracking, no click tracking, no images, no shorteners.

## Rules
- Numbers must match docs/CANONICAL_FACTS.md — never invent or round. Founding is "about half
  off," never "more than half off."
- No fabricated customers/testimonials. Proof = Gallup (cited), the video, their own live page.
- After Sept 9: switch to the mid-season variant of email 3 ("scoring starts where you start").
