# Concierge voice line — Telnyx AI Assistant setup

The concierge is a premium add-on: a caller phones in and an AI voice agent takes
their weekly picks in conversation. The **brain** (pick tools + prompt) is built
in the app; the **phone** is a Telnyx AI Assistant you configure. Lean v1:
converse → take picks game-by-game → read the card back → submit on confirm.

Decided 2026-07-22. Platform = **Telnyx AI Assistant** (same vendor as the number
+ SMS; cheapest per-minute; lowest latency; native webhook tools).

## What the app already provides

- **Endpoint:** `POST https://officepickemleague.com/api/voice/agent`
  Auth: header `Authorization: Bearer <CONCIERGE_TOOL_SECRET>`.
  Body: `{ "action": <tool>, "from": <caller number>, ... }`.
- **Tools (actions):** `get_context`, `set_pick` (`game_number`, `spoken`),
  `set_lock` (`game_number`), `read_card`, `submit_card`. See `src/lib/concierge.ts`.
- **System prompt:** `CONCIERGE_PROMPT` in `src/lib/concierge.ts` — paste it into
  the assistant.
- Pick mechanics reuse the SMS PLAY engine (slate, parser, save, lock, submit),
  so voice, text, web, and paper all write the same card.

## One-time setup (your steps, in the Telnyx portal)

1. **Secret.** Generate a random string. Set `CONCIERGE_TOOL_SECRET` to it in
   Render (Environment) *and* use it as the bearer token in every tool below.
2. **Create an AI Assistant** (Telnyx → AI Assistants → Create).
   - Instructions: paste `CONCIERGE_PROMPT`.
   - Model: a strong conversational LLM (Telnyx lets you pick; a top-tier model
     keeps the banter natural).
   - Voice: a warm, natural TTS voice. Turn on a filler phrase for sync tools
     ("one sec…") so pauses feel human.
3. **Add 5 webhook tools** (Telnyx → tool type **Webhook**). Every tool shares:
   - **Method** `POST`
   - **Headers:** `Authorization: Bearer <secret>` and `X-Caller-Number: {{telnyx_end_user_target}}`
     (the built-in caller-number variable — this is how the tool tells the app who's on the line).
   - **URL** carries the action as the last path segment; **Body Parameters** hold only the
     model-filled args. Leave Path/Query/Dynamic-Variable-Assignment tabs empty.

   | Tool | URL | Body Parameters |
   |---|---|---|
   | get_context | `…/api/voice/agent/get_context` | none |
   | set_pick | `…/api/voice/agent/set_pick` | `game_number` (integer), `spoken` (string) |
   | set_lock | `…/api/voice/agent/set_lock` | `game_number` (integer) |
   | read_card | `…/api/voice/agent/read_card` | none |
   | submit_card | `…/api/voice/agent/submit_card` | none |

   (Base URL `https://officepickemleague.com`.) The endpoint also accepts the flat shape
   `POST /api/voice/agent` with `{action, from}` in the body, if you prefer that.

4. **Attach a number.** Point the 412 number's *voice* to this assistant (SMS
   still goes to the messaging profile — the two don't conflict). Or use a
   separate voice number if you'd rather keep them apart.
5. **Test:** call from a joined player's phone. The assistant should greet you by
   name, walk the slate, read your card back, and submit only when you say so.

## Notes

- Caller identity = the phone number (same as SMS). Only players whose number is
  on a roster are recognized; others get a polite "sign up first."
- Cost is per-minute (premium add-on) — bill it through to the employer buying it.
- v1 memory is light (rank + last week's points). Richer adaptation ("you rode
  the Eagles and they paid") is the next iteration once calls are working.
