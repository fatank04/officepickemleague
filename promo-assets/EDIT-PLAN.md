# Promo video edit plan — B2C (cut A) + B2B (cut B)

Shared spine, two narrations. Target: ~50–55s each, 16:9, 1280x720.

**Creative direction (2026-07-16):** blue-collar imagery (warehouse/break room/shop floor, hi-vis — not
conference rooms), say "fall" never "autumn", cheeky tone (Doris from dispatch, the new guy is winning).

## Final narration scripts (v2 — cheeky/blue-collar)
- **Cut A open:** "Every fall... it returns. The picks. The locks. The upsets. Where legends aren't born on Sundays... they're born in the break room."
- **Cut A back:** "No money. No app to download. Just you... the crew... and the cold, eternal question: who actually knows football? Spoiler: it's Doris from dispatch. It's always Doris. Pick by text. Talk trash by Tuesday. Glory by December. Office Pick'em League. Settle it this season."
- **Cut B full:** "Every fall... something takes over the shop floor. The picks. The rivalries. The break-room trash talk. For eighteen weeks, the new guy and the boss play the same game. And the new guy... is winning. No money. Nothing to install. One commissioner. Two minutes a week. From the loading dock to the front office. Office Pick'em League. Give them a season."

## Assets
- `shot1-football-desk-dawn.mp4` — 5s Kling
- `shot2-corridor-tunnel-walk.mp4` — 5s Kling (pending)
- `shot3-conference-huddle.mp4` — 5s Kling (pending)
- `../public/walkthrough.mp4` — app footage source (cut 3–4 short segments: text-picks, picks saved, standings)
- `epic-sport-trailer-music.mp3` — 166s bed; use the section with a quiet intro → build → swell; cut dead at the button
- `narration-sterling-test-openingA.mp3` — approved opening read (cut A, beats 1–2)
- narration cut A remainder + cut B full — to render after shots lock

## Timeline (both cuts)
| Time  | Video                                  | Audio |
|-------|----------------------------------------|-------|
| 0–5s  | Shot 1 (football, dawn)                | music: low drone · VO line 1 |
| 5–13s | Shot 2 (tunnel walk, slow-mo)          | drums enter · VO build lines |
| 13–20s| Shot 2 tail slowed 1.5x + push-in on Shot 1 alt frames if needed | build continues |
| 20–30s| Shot 3 (huddle)                        | swell · VO "the turn" |
| 30–48s| App footage: text picks → saved → standings climb (2–3 cuts on music hits) | full swell · VO product beats |
| 48–52s| Freeze/logo card (brand blue #4f8cff, logo/wordmark, URL) | music cuts dead · VO button line |
| 52–55s| CTA card hold                          | silence/sting |

- Cut A CTA: **officepickemleague.com** · "Settle it this season."
- Cut B CTA: **officepickemleague.com/pricing** · "Give them a season."

## Assembly tool decision (pending)
- Option A: static ffmpeg binary (evermeet.cx) — full control, needs download approval
- Option B: Descript (connected) — import assets, agent-assembled, no install
