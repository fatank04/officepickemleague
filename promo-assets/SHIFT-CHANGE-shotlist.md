# SHIFT CHANGE — 30s hero ad · script + shotlist (Gate 1)

Structure: Problem (0-8) → Turn (8-14) → Solution ×3 (14-22) → Proof (22-27) → Packshot (27-30).
All video = Kling 3.0 image-to-video from approved keyframes, 16:9, silent, 5s (stretched to slot).
Cuts land on the music accent grid (re-measured for this track section at assembly).

## Style prefix (glued to EVERY keyframe + video prompt)
> Cinematic commercial photography, anamorphic look, shallow depth of field with background
> softly blurred, soft diffused industrial light with dust in the air, muted cool palette with
> warm highlights, NFL Films documentary gravitas, epic sports commercial style.

## VO (Sterling, speech_rate -15 / pitch -3 / loudness +10)
- OPEN  @2.0s: "Every fall... something's missing on the floor. Then... it returns."
- BODY  @14.2s: "Pick on the web. Text 'em in. Or just call — our AI answers. Everyone locks in,
  from the loading dock to the front office. No money. No app. Two minutes a week."
- BUTTON @27.5s: "Office Pick'em League. Give them a season."  ← reuse narration-v3-cutB-button.mp3

## Shotlist

| # | Slot | Shot | Keyframe source | Camera move (ONE) |
|---|------|------|-----------------|-------------------|
| 1a | 0-2 | Phone face-up on scarred workbench lights up: OPL notification "Week 1 is live" | COMPOSITE: real UI notification mock + logo, placed via image gen w/ logo reference | slow push-in |
| 1b | 2-8 | Grey silent shop floor, workers passing like ghosts, long empty aisle | image gen | slow dolly forward |
| 2a | 8-14 | Worn football lands/rolls to rest on breakroom table, heads turn in bg | image gen (football + breakroom) | freeze then subtle drift |
| 3a | 14-16.5 | Laptop on standing desk, OPL picks page glowing (real UI) | REAL SCREENSHOT (walkthrough frame, cropped) | slow arc left |
| 3b | 16.5-19 | Worker in hi-vis by forklift texting a pick, slight grin | REUSE shot4-worker-texting.mp4 (already paid) | (existing) |
| 3c | 19-22 | Worker on phone call walking a warehouse aisle, laughing "yeah — Bears" energy | image gen (same character sheet as 3b worker if feasible) | tracking alongside |
| 4a | 22-27 | Standings podium UI (real screenshot) → match-dissolve to crew huddle, hands stacked | REAL SCREENSHOT + REUSE shot3-warehouse-huddle.mp4 | i2v drift / (existing) |
| 5a | 27-30 | PACKSHOT: football rolls to rest beside glowing OPL logo mark on dark surface, tagline + URL fade | image gen w/ logo-512.png reference | slow push-in, pro mode |

Reused paid assets: shot4 (texting), shot3 (huddle), button VO, music bed, logo PNG.
New generation: 5 keyframes+iterations (~15-20 cr), 5 i2v shots (4 std = 30 cr, 1 pro packshot ~15 cr),
2 VO chunks (~3 cr). Planned ~65-70 cr + ~40 retry margin ≈ 105-110 total worst case. Balance ~255.

## Audio design
- 0s: sonic sting (2-note brass/drum hit cut from track's first accent) + phone buzz foley (from track? else omit)
- Music: quiet intro under 0-8, drums at the 8s turn, swell 14-27, HARD CUT at 27 → sting reprise + button VO in silence.
- Brand pulse: logo @0-2 (notification), accent-colored UI @14-16.5 and 22-24, packshot @27-30.
