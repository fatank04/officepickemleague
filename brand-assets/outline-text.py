#!/usr/bin/env python3
"""Convert the lockup's <text> lines to true vector outlines (Avenir Next Bold/Demi).
Emits opl-imprint-lockup-outlined.svg — no font dependency, vendor-safe."""
from fontTools.ttLib import TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

TTC = "/System/Library/Fonts/Avenir Next.ttc"

def pick(coll, want):
    for f in coll.fonts:
        name = f["name"].getDebugName(4) or ""
        if name == want:
            return f
    raise SystemExit(f"font {want!r} not in ttc: " +
                     ", ".join(f["name"].getDebugName(4) for f in coll.fonts))

coll = TTCollection(TTC)
BOLD = pick(coll, "Avenir Next Bold")
DEMI = pick(coll, "Avenir Next Demi Bold")

def line_paths(font, text, font_size, letter_spacing, center_x, baseline_y):
    upem = font["head"].unitsPerEm
    scale = font_size / upem
    cmap = font.getBestCmap()
    glyf = font.getGlyphSet()
    hmtx = font["hmtx"]
    names = [cmap[ord(ch)] for ch in text]
    advances = [hmtx[n][0] * scale for n in names]
    # letter_spacing applied between glyphs (not after last)
    total = sum(advances) + letter_spacing * (len(names) - 1)
    x = center_x - total / 2
    paths = []
    for name, adv in zip(names, advances):
        pen = SVGPathPen(glyf)
        # y-flip (font y-up -> svg y-down), translate to (x, baseline)
        tpen = TransformPen(pen, Transform(scale, 0, 0, -scale, x, baseline_y))
        glyf[name].draw(tpen)
        d = pen.getCommands()
        if d:
            paths.append(f'<path d="{d}"/>')
        x += adv + letter_spacing
    return paths, total

lines = [
    (BOLD, "OFFICE PICK’EM", 58, 0.5, 280, 376),
    (BOLD, "LEAGUE", 46, 16, 280, 440),
    (DEMI, "officepickemleague.com", 26, 2, 280, 496),
]

out = []
for font, text, size, ls, cx, by in lines:
    paths, width = line_paths(font, text, size, ls, cx, by)
    out.extend(paths)
    print(f"outlined: {text!r} width={width:.1f}")

MARK = '''  <g fill="none" stroke="#4f8cff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <g transform="rotate(-20 280 158)">
      <ellipse cx="280" cy="158" rx="122" ry="74"/>
      <path d="M182 158 H378" stroke-width="9"/>
      <path d="M246 142 V174 M263 140 V176 M280 139 V177 M297 140 V176 M314 142 V174" stroke-width="8"/>
      <path d="M206 146 V170 M354 146 V170" stroke-width="7"/>
    </g>
  </g>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 640" width="560" height="640">
  <!-- Office Pick'em League — 1-color imprint lockup, TEXT OUTLINED (no font dependency).
       Brand blue #4f8cff on white ball. Transparent background = the ball; blue = imprint ink.
       PMS match target: 2727 C (alt 279 C). -->
{MARK}
  <g fill="#4f8cff">
    {chr(10).join("    " + p for p in out)}
  </g>
</svg>
'''
with open("opl-imprint-lockup-outlined.svg", "w") as f:
    f.write(svg)
print("wrote opl-imprint-lockup-outlined.svg")
