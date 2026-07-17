---
name: ad-creator
description: Create a polished 30-second product/service video ad end-to-end with Higgsfield (stills-first keyframes → image-to-video shots + AI voiceover), licensed music, real app footage, and local ffmpeg assembly. Use when asked to make a commercial, promo video, video ad, or ad variant. Gated spend, beat-synced editing, brand-consistent output.
---

# ad-creator — 30-second commercial production line

Research-backed playbook (verified 2026-07: Higgsfield guides, fal.ai Kling docs, System1×TikTok
branding study, CTV craft sources) + hard-won session experience. Core doctrine: **assets first,
stills first, one gate per dollar.**

## The five laws (from verified research)

1. **Stills-first.** Never go straight text-to-video. Generate keyframe IMAGES (cheap), iterate
   composition/lighting at image cost, then animate the approved frame via image-to-video
   (`start_image`). i2v preserves the identity, layout, and TEXT/logos of the source frame —
   it is the only reliable way to get brand marks and UI screens into AI shots.
2. **Assets locked before scenes.** Recurring character → reference sheet (front/side/back) via
   Cast/reference elements; product/logo → product sheet; location → one base still, re-angled
   per shot (never re-prompted from scratch). Consistency comes from references, not luck.
   Caveat: >3 bound reference subjects degrades output; reference images need angular diversity.
3. **One camera move per clip.** Name it: dolly-in, arc, tracking, orbital, pan, freeze.
   Combining moves ("push in then pan") fails; fast moves/full orbits warp. Add lens+lighting
   language: "anamorphic look, shallow depth of field, background softly blurred, soft diffused
   light — no harsh shadows."
4. **Brand in the first 2 seconds.** Sonic brand cue (+191% awareness lift) and logo-in-context
   (+182%) in the opening beats; then PULSE brand assets briefly throughout (pulsing beats one
   long hold — prolonged early logo increases skipping). Brand memory = colors, tagline, VO
   voice, jingle — distinctive assets, not logo placement alone. (System1×TikTok n=92k;
   short-form-derived — treat as directional for other channels.)
5. **Structure: Problem → Solution → Packshot.** For 30s ≈ hook/problem 0-8s, solution+proof
   8-22s, packshot+CTA 22-30s (a 5/20/5 variant is equally supported). Hook must be VISUAL and
   land inside 3 seconds — viewers who survive 3s mostly stay. Script budget: **65-80 words
   total**, CTA spoken AND shown in the final 5-8s. End on a dedicated cinematic packshot shot
   (product/logo reveal), not just a text card.

## Phase 0 — Brief (always first)
Audience (one segment per ad), single core message, ONE value driver to dramatize, tone words,
CTA + URL, credit budget, aspect ratio(s), where it will run.
**Office Pick'em League:** blue-collar imagery, "fall" never "autumn", cheeky epic-mundane tone
(NFL Films gravitas on ordinary workplaces), Sterling VO, colors `#4f8cff`/`#0d131d`/`#f2f6fc`,
logo `promo-assets/logo-512.png`, value drivers = 3 pick modalities (sleek web / guided SMS /
conversational AI voice), no-money/no-app/2-min.

## Phase 1 — Script + shotlist (approval gate 1)
- 65-80 words, 3 VO chunks (open / body / button) rendered separately for beat placement.
- Write the shotlist as named shots (1a, 1b, 2a…) with a **shared style prefix** glued to every
  prompt (same film stock/lens/light words) so shots read as one film.
- Timed to the music grid (see Phase 3) — every cut on a measured accent.

## Phase 2 — Voice (cheap; before any video)
`generate_audio` model `seed_audio`, Sterling (`dc382508-c8bd-443c-8cb2-46e57b8d2e6f`, preset),
`speech_rate:-15, pitch_rate:-3, loudness_rate:10, mp3, 44100`. Reads ~2.0 words/sec at this
rate. Cost ~0.9/line to ~2.4/paragraph. TTS rate-limits: space calls 15-20s. Test → approve →
render final chunks.

## Phase 3 — Music (free — Higgsfield CANNOT generate standalone music)
- Pixabay royalty-free ("epic sports trailer", "cinematic drums"): commercial OK, no attribution.
  Pixabay 403s curl on pages; pull the `cdn.pixabay.com/download/audio/...` URL from the page DOM
  via the in-app browser, then curl that.
- Measure before editing: RMS per 15s window (`volumedetect`) for intro/build/swell map; then
  per-100ms RMS peak-picking for the accent grid → cut points and the music hard-cut moment.
- Consider a 1-2 note **sonic logo** at open + packshot (same sting both ends) — cheap brand glue.

## Phase 4 — Keyframes (images; approval gate 2)
- Generate stills for every shot: character/location/product frames + the packshot frame.
  Use an image model (e.g. nano banana / soul); iterate here — it's 10-20x cheaper than video.
- Real UI: screenshot the actual app (crop to 16:9) and use AS the start frame for i2v — the
  model animates camera drift over the true pixels; UI text survives.
- Approve every keyframe before Phase 5. This is where composition is decided.

## Phase 5 — Shots (video; approval gate 3 — one at a time)
- `kling3_0` i2v with `start_image` (+ `end_image` for controlled transitions), 5s, silent
  (`sound:"off"` — music covers it), 16:9. std = 7.5 cr; reserve `mode:"pro"` for the packshot.
- Multi-shot: one generation can hold 2-6 explicitly-timed scenes (≤15s total; 3-4 beats is the
  reliable practitioner limit) — label each scene's framing/subject/motion separately. Good for
  rapid montage beats; bad for shots needing individual retries.
- Preset interception: if Higgsfield suggests a preset and the user approved the literal prompt,
  retry with `declined_preset_id`.
- A 5s shot stretches to ~5.9s with `setpts=1.18*PTS` without visible judder on slow footage.
- Review each shot before generating the next. Kill-criteria: warped anatomy, drifting text,
  broken physics; retry with simplified single-subject prompt.

## Phase 6 — Assembly (ffmpeg, local, deterministic)
- ffmpeg/ffprobe: static binaries from evermeet.cx. Logo: `qlmanage -t -s 512 -o . icon.svg`
  rasterizes SVG natively (no browser).
- Every scene cut ON a measured accent; music hard-cut (0.2s afade) on the accent starting the
  packshot; button VO in the silence. VO chunks via `adelay=<ms>|<ms>`;
  `amix=inputs=N:duration=first:normalize=0`, music `volume=0.45` under VO.
- Match hybrid footage: app-screen segments get the same subtle grade as AI shots if they clash
  (`eq=`/`colorbalance=`); keep app segments FEW and LONG (held ≥4s), not many and fast.
- **ZSH TRAP:** `$VAR:t` in a filtergraph is a zsh modifier (basename!) — always `${VAR}` before
  `:`. Collapse whitespace out of filter_complex (`tr -d ' \n\t'`).
- Verify: ffprobe duration/streams + extract frames at key timestamps and LOOK at them.

## Budget discipline
- Preflight with `get_cost:true`; check `balance` before committing a plan; re-check after each
  spend (longer TTS bills higher than the short-line rate; estimates drift).
- Free-plan workspaces cannot buy credit packs (topups list empty) — only subscriptions add
  credits. Check `show_plans_and_credits` before telling the user what to buy.
- Report spend + remaining at every gate. Leave ≥20% budget as retry margin.

## Deliverables
`promo-assets/` in the repo: final mp4(s), every narration/music/shot/keyframe source,
`EDIT-PLAN.md` (timeline, scripts, beat grid, shotlist), and the assembly script (re-render =
one command). Vertical 9:16 derivative = re-crop, zero generation cost.

## Alternate video provider: Seedance 2.0 via OpenRouter (verified 2026-07)
- `POST https://openrouter.ai/api/v1/videos` (Bearer key), model `bytedance/seedance-2.0`,
  ~$0.067/sec (5s 720p ≈ $0.34). i2v via `frame_images:[{type:"image_url",image_url:{url},
  frame_type:"first_frame"}]`. Async: poll `polling_url`, download `/videos/{id}/content?index=0`.
  Persist submitted job ids to a state file — a crashed poller loses billed jobs otherwise.
  Working generator: `promo-assets/seedance-generate.py` (resumable, key from
  ~/.config/openrouter/key, never in the repo).
- **Face filter:** ByteDance REJECTS i2v keyframes containing realistic frontal faces
  (`InputImageSensitiveContentDetected.PrivacyInformation`). Distant/turned faces pass.
  Plan people close-ups as t2v on Seedance, or keep faces small in keyframes.
- **UI screens on Seedance:** arc/orbit moves force a 3D re-render that hallucinates the UI
  outright (invented logos, garbled layout). A planar slow push-in preserves LARGE text
  (headlines/banners) but dense small UI text still mutates over 5s ("week"→"weak",
  "Winners"→"Wniers") — verified with a matched-keyframe retry. Kling 3.0 held the same
  frames pixel-true under both moves. Rule: real UI/dense text → Kling; Seedance only for
  big-type frames, and check the LAST second of the clip, not just the middle (drift
  accumulates over duration).
- **Brand marks:** Seedance restyles logos toward the scene's aesthetic (e.g. flat app icon
  → neon sign); Kling reproduces them flatly. If strict mark fidelity matters, prefer Kling
  for the packshot or composite the logo in post.
- **Kling drifts on dense UI too (verified 2026-07-17):** a leaderboard screenshot's large
  heading mutated from frame one across two Kling i2v attempts. When a UI shot's text must be
  pixel-true, skip AI generation entirely: ffmpeg Ken Burns (`-loop 1` + `zoompan`) on the
  hi-res screenshot gives a deterministic push-in, $0, always legible. Reserve i2v for UI
  shots where an organic arc/parallax matters more than every glyph.
- **Recapture pipeline:** app footage comes from Playwright recordings against a seeded local
  DB (see capture script pattern) — segments retimed with setpts to match chapter maps.
- Seedance output is 24fps ~5.04s for a "5s" request; normalize with fps=25 in assembly.

## Refuted claims — do NOT use
- "Brand lift happens in <1 second" (Facebook/Nielsen figure — failed verification).
- "Start/end-frame control is new in Kling 3.0" (existed earlier).
