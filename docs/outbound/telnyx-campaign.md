# Telnyx A2P 10DLC Campaign — field values (for reuse) — saved 2026-07-19

Paste-ready values for the Telnyx campaign, all consistent with the live `/sms-terms` page (TCR
reviewers check that the campaign matches published terms). Reuse for resubmission and for Wave-2
campaigns (Buffalo/Cleveland/Cincinnati). Status: **submitted 2026-07-19, awaiting approval.**

## Setup selections
- **Brand:** the verified Office Pick'em brand (VERIFIED 2026-07-19).
- **Use case:** **Low Volume Mixed** (cheapest, fastest, no external vetting; fits the ~50-league pilot).
- **Sub-use-cases (check exactly these two):** **Account Notification** + **Customer Care**.
  Do NOT check Marketing, 2FA, Delivery Notification, etc. — they don't match the traffic and cause
  rejection for inconsistency with samples.

## Field-length caps (the gotcha that cost two submissions)
- **Opt-in Message / Opt-out Message / Help Message: max 320 characters each.**
- The long opt-in *description* goes in the separate **"Message Flow"** field (~2048 chars) — NOT
  in "Opt-in Message". Crossing these two is what threw `Body/optinmessage: too long`.

## Campaign description
> Recurring transactional and conversational messaging for a free, no-money, employer-sponsored
> workplace NFL pick'em engagement game. Opted-in employees receive a welcome message, weekly
> game-line summaries, pick reminders, pick confirmations (including picks submitted by text or by
> photo of a paper sheet), and weekly results/standings. Recipients also text commands (LINES,
> MY PICKS, STANDINGS, SCORE, HELP) and receive replies.

## Message Flow (opt-in description — the LONG field)
> Employees join their employer's free league by entering their name and mobile number on the
> enrollment page at officepickemleague.com and checking a box agreeing to receive recurring
> automated texts, or by texting JOIN to the league number. Consent is not a condition of purchase.
> Message frequency is ~1–4 msgs/week during the NFL season plus command replies. Message and data
> rates may apply. Full terms: officepickemleague.com/sms-terms.

## Opt-in Message (the SHORT field — 242 chars, under the 320 cap)
```
Office Pick'em League: you're in! We'll text weekly game lines, pick reminders, confirmations & results (~1-4 msgs/wk during the season). Msg & data rates may apply. Reply STOP to cancel, HELP for help. Terms: officepickemleague.com/sms-terms
```

## Opt-out Message
```
You're unsubscribed from Office Pick'em League texts. No more messages will be sent. Reply START to opt back in.
```

## Help Message
```
Office Pick'em League: weekly lines, reminders & results for your league. Msg & data rates may apply. Reply STOP to cancel. Support: support@officepickemleague.com
```

## Keywords
- **Opt-in:** JOIN, START
- **Opt-out:** STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- **Help:** HELP

## Sample messages (all five)
1. `Office Pick'em League: You're in for the Acme Plant league! We'll text weekly lines, pick reminders & results (~1-4 msgs/wk). Msg & data rates may apply. Reply HELP for help, STOP to cancel.`
2. `Office Pick'em: Week 3 picks lock Sun 1:00pm ET. Make yours: officepickemleague.com/l/acme. Reply STOP to cancel, HELP for help.`
3. `Office Pick'em: got your Week 3 picks — you're locked in. Reply to change before kickoff. Reply STOP to cancel.`
4. `Office Pick'em: Week 2 results are in — you went 4-2, now 5th of 18. Standings: officepickemleague.com/l/acme. Reply STOP to cancel.`
5. `Office Pick'em standings: 1) Doris 41  2) Mike 38  3) You 35. Full board: officepickemleague.com/l/acme. Reply STOP to cancel.`

## Content flags
- Subscriber opt-in: **Yes** · opt-out: **Yes** · help: **Yes**
- Embedded link: **Yes** (pick links to officepickemleague.com)
- Embedded phone number: **No** · Age-gated: **No** · Direct lending: **No** · Affiliate marketing: **No**

## After approval
1. Attach a Telnyx number to the approved campaign (Campaign → Assign Numbers).
2. Render dashboard: set `TELNYX_API_KEY`, `TELNYX_MESSAGING_PROFILE_ID`, `TELNYX_FROM_NUMBER`,
   and `SMS_PROVIDER=telnyx` (see [[opl-render-neon-deploy]] / opl-telnyx memory).
3. Test-send; text JOIN and STOP to confirm routing. Unlocks kit-insert Variant A.
