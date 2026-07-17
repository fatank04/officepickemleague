#!/usr/bin/env python3
"""Regenerate the SHIFT CHANGE hero-ad shots on Seedance 2.0 via OpenRouter,
for A/B comparison with the Kling 3.0 (Higgsfield) originals.

Same keyframes (first_frame URLs), same prompts, same 5s duration, 720p 16:9,
no audio (the edit supplies music/VO). Reads the API key from
~/.config/openrouter/key — the key is never printed.

Usage: python3 seedance-generate.py [--dry-run]
Outputs: promo-assets/seedance/sd-<name>.mp4
"""
import json, os, sys, time, urllib.request, pathlib

BASE = "https://openrouter.ai/api/v1"
MODEL = "bytedance/seedance-2.0"
OUT = pathlib.Path(__file__).parent / "seedance"
KEY_FILE = pathlib.Path.home() / ".config/openrouter/key"

STYLE = ("Cinematic commercial photography, anamorphic look, shallow depth of field, "
         "soft diffused industrial light with dust in the air, muted cool palette with "
         "warm highlights, NFL Films documentary gravitas, epic sports commercial style. ")

CDN1 = "https://d8j0ntlcm91z4.cloudfront.net/user_3EaD0OqRIbC845lOl1Hk4Dj4ELG"
CDN2 = "https://d2ol7oe51mr4n9.cloudfront.net/user_3EaD0OqRIbC845lOl1Hk4Dj4ELG"

SHOTS = [
    # (name, first_frame_url or None, prompt)
    ("1a-phone", f"{CDN1}/hf_20260716_220318_3a57609f-178d-49c6-b861-b4117d127c25.png",
     "Slow cinematic push-in toward the smartphone on the workbench, the notification glow subtly pulsing brighter, dust particles drifting through the light, everything else perfectly still, shallow depth of field"),
    ("1b-shopfloor", f"{CDN1}/hf_20260716_220337_34cb262b-9fd0-4a94-a290-16dd54e3eca6.png",
     "Slow cinematic dolly forward down the warehouse aisle, the two workers trudging slowly with heads down, flickering fluorescent light, dust hanging in the still air, heavy tired atmosphere"),
    ("2a-football", f"{CDN1}/hf_20260716_220103_90fb235c-5ef0-4e92-84ea-800c467f0746.png",
     "The football sits perfectly still in the golden light as the three workers in the blurred background slowly turn their heads toward it in unison, subtle camera drift closer, reverent slow-motion feel, dust in the light shaft"),
    ("3a-picks", f"{CDN2}/f69166e4-b6af-4cb5-9909-521b11e7fbb1.png",
     "Slow smooth cinematic arc left around the interface, gentle parallax, the screen content stays perfectly sharp and unchanged, subtle glow from the accent-blue buttons"),
    # Retry validating the planar-move rule: arc hallucinated the UI; push-in should preserve it.
    ("3a-picks-pushin", f"{CDN2}/f69166e4-b6af-4cb5-9909-521b11e7fbb1.png",
     "Very slow cinematic push-in on the interface, gentle drift, the screen content stays perfectly sharp and unchanged, subtle glow from the accent-blue buttons"),
    ("3b-texting", None,
     STYLE + "A warehouse worker in hi-vis safety vest leaning against a forklift, casually texting on his phone with a slight grin, dramatic warm light rays through high warehouse windows, slow push-in"),
    # NOTE: originally i2v, but ByteDance rejects keyframes with realistic frontal faces
    # (InputImageSensitiveContentDetected.PrivacyInformation) — so t2v like 3b/4b.
    ("3c-call", None,
     STYLE + "Tracking shot moving alongside a warehouse worker in hi-vis vest and hard hat walking down a warehouse aisle mid-phone-call, laughing with a big grin, gesturing like he's calling a play, golden light rays through high windows behind him, confident energetic stride, forklift softly blurred in background"),
    ("4a-standings", f"{CDN2}/7a68a63a-4d44-41bd-9229-7be469adcc49.png",
     "Very slow cinematic push-in on the leaderboard interface, gentle parallax drift, the screen content stays perfectly sharp and unchanged, subtle glow"),
    ("4b-huddle", None,
     STYLE + "Six warehouse workers in hi-vis safety vests huddled around a break room table, hands stacked in the center like a championship football team, dramatic overhead lighting, whiteboard with football play diagrams, deadly serious expressions, slow orbit camera"),
    ("5a-packshot", f"{CDN1}/hf_20260716_220137_e78b84c8-00ba-4a21-9986-e8beb4441f1d.png",
     "Very slow cinematic push-in, the glowing blue app logo pulsing gently like a heartbeat, the football perfectly still, dust particles drifting through the key light, premium product commercial energy"),
]


def api(path, key, payload=None, raw=False):
    req = urllib.request.Request(
        path if path.startswith("http") else BASE + path,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST" if payload else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.read() if raw else json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")[:500]
        raise RuntimeError(f"HTTP {e.code}: {body}") from None


def load_state():
    f = OUT / "jobs.json"
    return json.loads(f.read_text()) if f.exists() else {}


def save_state(jobs):
    (OUT / "jobs.json").write_text(json.dumps(jobs, indent=1))


def main():
    dry = "--dry-run" in sys.argv
    if not dry and not KEY_FILE.exists():
        sys.exit(f"No API key. Create it: mkdir -p ~/.config/openrouter && (paste key into) {KEY_FILE} && chmod 600 {KEY_FILE}")
    key = KEY_FILE.read_text().strip() if KEY_FILE.exists() else ""
    OUT.mkdir(exist_ok=True)

    jobs = load_state()
    for name, frame, prompt in SHOTS:
        dest = OUT / f"sd-{name}.mp4"
        if dest.exists():
            jobs.pop(name, None); print(f"skip {name} (exists)"); continue
        if name in jobs:
            print(f"resume {name}: job {jobs[name]['id']}"); continue
        body = {"model": MODEL, "prompt": prompt, "duration": 5,
                "aspect_ratio": "16:9", "resolution": "720p", "generate_audio": False}
        if frame:
            body["frame_images"] = [{"type": "image_url", "image_url": {"url": frame},
                                     "frame_type": "first_frame"}]
        if dry:
            print(f"DRY {name}: i2v={bool(frame)} prompt={prompt[:60]}..."); continue
        try:
            r = api("/videos", key, body)
        except RuntimeError as e:
            print(f"SUBMIT FAILED {name}: {e}"); continue
        jobs[name] = {"id": r["id"], "poll": r.get("polling_url") or f"{BASE}/videos/{r['id']}"}
        save_state(jobs)
        print(f"submitted {name}: job {r['id']}")
        time.sleep(5)

    while jobs and not dry:
        time.sleep(30)
        for name in list(jobs):
            try:
                j = api(jobs[name]["poll"], key)
            except RuntimeError as e:
                print(f"  poll error {name}: {e}"); continue
            st = j.get("status")
            if st in ("completed", "succeeded"):
                data = api(f"/videos/{jobs[name]['id']}/content?index=0", key, raw=True)
                (OUT / f"sd-{name}.mp4").write_bytes(data)
                print(f"done {name} ({len(data)//1024} KB)"); del jobs[name]; save_state(jobs)
            elif st in ("failed", "cancelled", "error"):
                print(f"FAILED {name}: {json.dumps(j)[:300]}"); del jobs[name]; save_state(jobs)
            else:
                print(f"  {name}: {st}")
    print("all done" if not dry else "dry run complete")


if __name__ == "__main__":
    main()
