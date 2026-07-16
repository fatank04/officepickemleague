# Telnyx SMS — A2P 10DLC Registration Reference

Paste-ready values for registering the Office Pick'em League messaging program on Telnyx.
Everything here is derived from the actual app traffic (`src/app/api/sms/route.ts`,
`src/lib/sms.ts`, `src/lib/brand.ts`) — keep it in sync if that code changes.

> **Reality check.** 10DLC brand + campaign vetting goes through The Campaign Registry (TCR),
> the same registry that gates every US carrier. The EIN / legal-name / address checks that
> blocked the Twilio attempt recur **identically** here — switching to Telnyx does not skip them.
> If TCR vetting stays painful, the fast path is **Toll-Free Verification** (a lighter form, no
> TCR brand/campaign); our `SMS_PROVIDER=telnyx` build works with a toll-free number too.

---

## 0. Code is already wired

The SMS layer is provider-agnostic (`src/lib/messaging.ts`). To go live on Telnyx, set these in
the Render dashboard (do **not** commit real secrets):

```
SMS_PROVIDER=telnyx
TELNYX_API_KEY=<from Telnyx → API Keys>
TELNYX_MESSAGING_PROFILE_ID=<from Telnyx → Messaging → your profile>   # preferred
# or, instead of a profile:
TELNYX_FROM_NUMBER=<E.164 number>
# Two-way (inbound) — required for picks-by-text, STOP/HELP, JOIN:
TELNYX_WEBHOOK_PUBLIC_KEY=<from Telnyx portal → the messaging Ed25519 public key>
```

Default (`SMS_PROVIDER` unset) stays on Twilio 10DLC, so setting the var is the only cutover step
for **outbound**. **Inbound** two-way also needs the webhook wired (below).

---

## 1. Account + number + messaging profile

1. Sign up at telnyx.com using a **business-domain email** (`you@officepickemleague.com`), not gmail.
2. Buy a number (Numbers → Search). Local for 10DLC; toll-free for the toll-free path.
3. Messaging → create a **Messaging Profile**, attach the number → this is `TELNYX_MESSAGING_PROFILE_ID`.
4. API Keys → create a key → set `TELNYX_API_KEY` in Render (you enter it, not this repo).
5. On the Messaging Profile, set the **inbound webhook URL** to
   `https://officepickemleague.com/api/sms/telnyx` (this is the Telnyx-specific route — not the
   Twilio `/api/sms` one). Leave the **failover URL** blank for now (optional; delivery-retry only).
6. Copy the portal's messaging **Ed25519 public key** into `TELNYX_WEBHOOK_PUBLIC_KEY` so inbound
   webhooks are signature-verified. Without it, inbound is rejected in production.

---

## 2. Brand registration (TCR)

| Field | Value |
|---|---|
| Entity type | Private for-profit (per EIN letter) |
| Legal company name | **Exactly as printed on the EIN / CP575 letter** — character-for-character |
| Address | Exactly as on the EIN letter |
| EIN | From the EIN letter (enter it yourself; not stored in this repo) |
| **Vertical** | **Technology** (you're a SaaS company; *not* Gambling) |
| Support email | `help@officepickemleague.com` (business domain — gmail is rejected) |
| Website | https://officepickemleague.com |

⚠️ **Do not select the Gambling vertical.** A sports pick'em app is easily misfiled as
sports-betting, a restricted category. Lead the campaign description with the "no money, players
never pay" framing so a reviewer doesn't assume wagering.

---

## 3. Campaign registration

### Use case
- **Campaign type: `Low Volume Mixed`**
- Sub-use-cases: **Account Notifications** + **Customer Care**
  - *(optional 3rd:* Polling & Voting — the weekly pick submissions are arguably a poll/vote)*
- **Do NOT select:** Marketing (no promotional SMS), 2FA/OTP (the PIN rides in the welcome text,
  it's not a standalone auth flow).

### Campaign description
> Opt-in members of a workplace NFL pick'em league receive weekly game notifications, score and
> standings updates, and can text back their picks and commands (LINES, MY PICKS, STANDINGS, SCORE,
> HELP). Two-way and transactional. It is a free game — players never pay and there is no wagering;
> no promotional content is sent.

### Opt-in workflow
> Consumers opt in through one of two explicit, self-initiated actions:
>
> 1. **Web:** On the league's public enroll page (officepickemleague.com/l/{league}), the user
>    enters their name and mobile number and must tick a consent checkbox — "I agree to receive
>    Office Pick'em text messages (game reminders, picks & scores). Msg & data rates may apply.
>    Reply STOP to opt out." — before the form will submit.
> 2. **SMS:** The user texts `JOIN {league-code} {name}` to our number.
>
> Immediately after opt-in the user receives a welcome/confirmation text identifying the program.
> Phone numbers are never purchased, rented, shared, or sold; consent is per-user and per-league,
> and the opt-in timestamp is stored. Privacy Policy and SMS Terms are linked in the site footer
> on every page, including the opt-in page.

### Sample messages
1. `Welcome to Acme Pick'em, Alex! You're set to play by text. Reply LINES to see this week's games, HELP for commands. (Web login PIN: 4821) Msg&data rates may apply. Reply STOP to opt out, HELP for help.`
2. `Week 3 is live in Acme Pick'em! Reply LINES to see the games, then text your picks (e.g. "1 SEA u"). Each game locks at kickoff. Msg&data rates may apply. Reply STOP to opt out, HELP for help.`
3. `Week 3 Acme Pick'em: +6 pts. You're 3rd of 12 (18 total). Msg&data rates may apply. Reply STOP to opt out, HELP for help.`
4. `Office Pick'em: LINES = this week's games. "1 SEA u  2 LAR o  LOCK 1" = make picks. MY PICKS · STANDINGS · SCORE. Support: help@officepickemleague.com. Msg&data rates may apply. Reply STOP to opt out, HELP for help.`

### Keywords & responses (must match what the number actually replies)

| Keyword(s) | Response |
|---|---|
| **Opt-out:** STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT | `You're opted out of Office Pick'em texts. Reply START to rejoin.` |
| **Opt-in:** START, UNSTOP | Confirms re-subscription (`You're back in. Reply LINES…`). |
| **Help:** HELP, INFO, COMMANDS, ? | See HELP message below. |

### HELP message (exact — `src/app/api/sms/route.ts`)
```
Office Pick'em:
LINES = this week's games
"1 SEA u  2 LAR o  LOCK 1" = make picks
MY PICKS · STANDINGS · SCORE
Support: help@officepickemleague.com
Msg&data rates may apply. Reply STOP to opt out, HELP for help.
```

### Content flags

| Flag | Answer | Note |
|---|---|---|
| Embedded links | **No** | `welcomeSuffix()` strips URLs/bare domains, so no outbound text can emit a link. |
| Embedded phone numbers | No | |
| Age-gated content | No | |
| Direct lending / loans | No | |
| Affiliate marketing | No | |

### Policy URLs

| Field | URL |
|---|---|
| Privacy Policy | https://officepickemleague.com/privacy |
| Terms & Conditions | https://officepickemleague.com/sms-terms |

Both pages already contain the required language: `/privacy` states mobile numbers and SMS consent
are not shared/sold with third parties for marketing (the #1 rejection trigger); `/sms-terms` covers
opt-in, message frequency, msg & data rates, STOP/HELP, supported carriers, and the carrier-liability
disclaimer.

---

## 4. Timing & gotchas (carried from the Twilio playbook)

- Business-domain contact email — gmail is rejected.
- Legal name + address must match the EIN letter character-for-character.
- A too-new EIN not yet propagated to IRS-linked vetting DBs can cause a FAILED brand; remedy is
  free self-service resubmission or a manual appeal with the CP575/147C letter.
- Campaign review typically ~1–4 weeks. The web-join fallback covers enrollment while review is pending.
