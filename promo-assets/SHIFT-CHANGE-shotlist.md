# SHIFT CHANGE — 30s hero ad · script + shotlist

## v5 (2026-07-19) — CURRENT: strengthened packshot (real logo composite)

Same script/timeline as v4 below; only the ending changed. The AI-rendered app icon in the
packshot was replaced with the **real brand mark** (`logo-512.png`) composited over a clean
logo-free football plate (`packshot-plate.png`, soul_2 — NFL-shield candidate rejected for
trademark; chosen plate has a generic embossed panel). Build = `build-packshot-v2.sh`:
deterministic ffmpeg Ken Burns push-in + logo fade-in + a **radial-gaussian brand-blue glow**
(geq, not a blurred square — a blurred square reads as a box). Title/tag/url lockup moved to
the RIGHT under the logo (football is lower-left in the new plate). Assembly =
`assemble-hero-v5.sh` → promo-hero-shift-change-v5.mp4 → web encode public/promo-hero.mp4.
Spend: 4 keyframes total (~4 credits); all motion/composite is $0 ffmpeg. Rationale: Seedance
restyles brand marks (flat icon → neon sign) so it's the wrong tool to "strengthen a logo" —
composite the real vector mark in post instead (ad-creator skill: strict mark fidelity → post).

## v4 (2026-07-19) — script A "The Play-by-Play" (research-backed rewrite)

Rewrite rationale: prior VO was trailer-voice cheese ("Every fall... something's missing...").
Research (ESPN This-is-SportsCenter / NFL Films / Workday craft rules): epic PICTURES + flat
WORDS, gravitas from nouns, no ellipses, ≤65 words, rule-of-three modalities, one dry
undercut, packshot line ≤6 words. Also: **voice/call is now a premium add-on — it must NOT
appear as a base modality; the third base modality is PAPER.**

- OPEN  @2.0s  (narration-v4-open.mp3): "Week One comes to the loading dock the same morning
  it comes to the stadium."
- BODY  @11.9s (narration-v4-body.mp3): "Pick on the site. Pick by text. Or pick like Doris —
  on paper."
- PROOF @20.95s (narration-v4-proof.mp3): "No money. Nothing to install. Two minutes a week.
  And receiving still hasn't lost."
- BUTTON @28.9s (reuse narration-v3-cutB-button.mp3): "Office Pick'em League. Give them a season."

Shot change: 3c call (sd-3c-call.mp4) → **hero-3c-paper.mp4** (Kling i2v from
keyframe: pick sheet + pen + phone on break-room table, hi-vis bokeh; slow push-in).
Back half retimed +0.85s (huddle 4.45s, packshot 27.95–34.85, total 35s) so the proof line
clears before the button plays in silence. Assembly: `assemble-hero-v4.sh` →
promo-hero-shift-change-v4.mp4 → web-encoded to public/promo-hero.mp4.

---

## v3 and earlier (historical — superseded script below)

Structure: Problem (0-8) → Turn (8-14) → Solution ×3 (14-22) → Proof (22-27) → Packshot (27-30).
All video = Kling 3.0 image-to-video from approved keyframes, 16:9, silent, 5s (stretched to slot).
Cuts land on the music accent grid (re-measured for this track section at assembly).

## Style prefix (glued to EVERY keyframe + video prompt)
> Cinematic commercial photography, anamorphic look, shallow depth of field with background
> softly blurred, soft diffused industrial light with dust in the air, muted cool palette with
> warm highlights, NFL Films documentary gravitas, epic sports commercial style.

## VO (Sterling, speech_rate -15 / pitch -3 / loudness +10)
- OPEN  @2.0s: "Every fall... something's missing on the floor. Then... it returns."
- BODY  @11.9s (v2, 2026-07-17): "Pick on the web. Text 'em in. Or just call — say your picks,
  hear your final card read back, done. No money, no app, two minutes a week — and everybody's in."
  (v1 "our AI answers… loading dock to the front office" superseded per tone rules: the call is a
  two-way conversational agent with confirmation, never "talk to an AI"; merism varied. v1 audio
  kept as narration-hero-body-v1-superseded.mp3. The v2 B2C cut's "even Doris is in" line also
  violates the Doris-always-wins rule — cutA/cutB v2 audio is superseded for any future use.)
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
