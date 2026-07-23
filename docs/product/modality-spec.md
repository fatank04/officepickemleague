# Modality spec — what the landing page promises, so the product must ship it

Decided 2026-07-22. The landing page's "Four ways to play" showcases are the product spec.
Everything here must work before kickoff (Sept 9), or the corresponding showcase copy gets
pulled. Owner: build in this order — slate → text flow → paper confirm → concierge.

## 1. Featured slate (the pick-volume decision)

**SHIPPED 2026-07-22** (lib/slate.ts; League.homeTeam/fullSlate; SlateEntry; wired into picks,
autofill, bots, SMS, voice, paper sheets; commissioner override on admin/games; home-team +
full-slate settings on admin/branding; kit metro prefill).

**Decision: featured slate, not the full schedule.** ~8–10 marquee games per week, all three
calls on each (winner / spread / O–U) → 24–30 picks, honestly two-to-three minutes. A
commissioner setting can open the full 16-game slate for die-hard offices.

Why: 48 picks intimidates the casual half of the building — the exact people OPL exists for.
A short slate levels the field, makes the sitewide "two minutes a week" claim true, and keeps
the 3-call scoring (sweep bonus, Lock) intact.

Build notes:
- `League.slateSize` (default ~9, "full" allowed). Slate = the week's games ranked by
  matchup quality (line closeness, prime-time, local team always included) or commissioner-picked.
- Picks page, sheets, SMS, and voice all read the same slate.
- Local team rule: the league's `teamCity` game is ALWAYS on the slate.

## 2. Guided text flow ("like texting a friend")

**SHIPPED 2026-07-22** (lib/guided.ts parsers + guided.test.ts; Player.flowWeek state; PLAY starts
the flow in sms-inbound.ts; one game at a time → recap → plain-words changes / LOCK submit; weekly
nudge invites PLAY; colloquial + voice-to-text aliases). Concierge voice reuses these parsers next.


Landing shows: bot offers the slate one game at a time with the lines; player answers each in
plain words (talk-to-text welcomed); bot echoes each pick inline, then sends a full-card
recap + Lock prompt; player can revise in plain words; LOCK submits.

Build notes:
- New conversational state machine in `sms-inbound.ts` (keyword `PLAY` or reply to the weekly
  nudge starts it). One game per message; parse plain-word answers (team names/nicknames,
  "over/under", "cover"); tolerate transcription slop (voice-to-text).
- Recap message lists every pick compactly; accepts plain-word corrections
  ("flip Bills to the under") and `LOCK`.
- Existing power-user path (batch pick strings) stays; the guided flow is the default for
  everyone else.
- Volume: ~20 messages/player/week on Telnyx Low Volume Mixed — fine at pilot scale; watch
  campaign throughput as leagues grow.

## 3. Paper: scan → full confirm → one revision round

**SHIPPED 2026-07-22** (sms-inbound.ts photo path). A read sheet now drops the player into the guided
recap/correction stage (flowWeek): the reply lists EVERY slate game in plain English, unreadable
cells are asked one at a time, and corrections use the same plain-word parser as PLAY ("make game 3
an under", "flip the Bills", talk-to-text) before LOCK. Reuses lib/guided.ts — no separate paper parser.


Landing shows: photo of the checked sheet → bot texts back EVERY pick game-by-game in plain
English + the Lock → player fixes anything in plain words (talk-to-text) → locked.

Build notes:
- Vision ingestion exists (`vision.ts`); upgrade the confirmation reply from summary to a
  complete, easy-scan list of all picks.
- Accept plain-word corrections in the reply window (shares the parser with the guided flow).
- Target: at most ONE revision round-trip before lock.

## 4. Concierge call (premium add-on)

Landing shows: a conversational voice agent with adaptive personality — chatty when the
player wants company, rapid-fire when they're rushed; remembers past weeks; talks each game
out; reads the full card back; submits only on explicit confirmation.

Build notes:
- Today's `/api/voice` is DTMF (press-a-number). The showcase promises a conversational
  agent — needs a realtime voice-LLM layer (e.g. OpenAI Realtime / Retell / Vapi over Telnyx
  SIP) with the same pick parser + slate source.
- Personality adaptation: infer from response length/latency/tone; offer "rapid-fire" mode
  explicitly when the player sounds rushed.
- Memory: last week's card + result ("you rode the Eagles and they paid").
- Positioning: premium add-on (pricing TBD); the emotional hook is "a weekly football friend
  with perfect memory."

## Copy invariants (keep the site honest)

- Never say "48 picks" or imply the full schedule is required.
- One tour-duration claim sitewide: "the 40-second tour" (walkthrough). The hero ad carries
  no duration claim (it runs 35s).
- Season naming: single-year, NFL style ("2026", "Founding Season 2026").
- Every modality showcase ends with the pick echo — "nothing counts until you've seen your
  picks echoed back" is the cross-modality promise.
