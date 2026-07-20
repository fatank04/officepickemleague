#!/usr/bin/env python3
"""Horizontal WHITE 1-color lockup fitted to the mini foam football imprint area
(1"H x 2.5"W). Text outlined (Avenir Next Bold/Demi) -> vendor-safe, no font dep.
Emits opl-imprint-mini-white.svg."""
from fontTools.ttLib import TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

TTC = "/System/Library/Fonts/Avenir Next.ttc"
def pick(coll, want):
    for f in coll.fonts:
        if (f["name"].getDebugName(4) or "") == want: return f
    raise SystemExit("missing " + want)
coll = TTCollection(TTC)
BOLD = pick(coll, "Avenir Next Bold"); DEMI = pick(coll, "Avenir Next Demi Bold")

def line_paths(font, text, font_size, letter_spacing, center_x, baseline_y):
    upem = font["head"].unitsPerEm; scale = font_size/upem
    cmap = font.getBestCmap(); glyf = font.getGlyphSet(); hmtx = font["hmtx"]
    names = [cmap[ord(c)] for c in text]
    adv = [hmtx[n][0]*scale for n in names]
    total = sum(adv) + letter_spacing*(len(names)-1)
    x = center_x - total/2; out=[]
    for n,a in zip(names,adv):
        pen = SVGPathPen(glyf)
        glyf[n].draw(TransformPen(pen, Transform(scale,0,0,-scale,x,baseline_y)))
        d = pen.getCommands()
        if d: out.append(f'<path d="{d}"/>')
        x += a + letter_spacing
    return out, total

# text block centered at x=505; mark sits left around x=150
lines = [
    (BOLD, "OFFICE PICK’EM", 52, 0.5, 505, 128),
    (BOLD, "LEAGUE",         40, 14,  505, 182),
    (DEMI, "officepickemleague.com", 30, 2, 505, 234),
]
paths=[]
for font,text,size,ls,cx,by in lines:
    p,w = line_paths(font,text,size,ls,cx,by); paths+=p
    print(f"{text!r} width={w:.0f}")

MARK = '''  <g fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
    <g transform="rotate(-20 150 150)">
      <ellipse cx="150" cy="150" rx="112" ry="68"/>
      <path d="M72 150 H228" stroke-width="10"/>
      <path d="M118 132 V168 M134 130 V170 M150 129 V171 M166 130 V170 M182 132 V168" stroke-width="9"/>
      <path d="M95 138 V162 M205 138 V162" stroke-width="8"/>
    </g>
  </g>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 300" width="750" height="300">
  <!-- Office Pick'em League — mini foam football imprint (1"H x 2.5"W).
       WHITE 1-color ink on a Reflex Blue (or Brown) ball. Text outlined, no font dep. -->
{MARK}
  <g fill="#ffffff">
    {chr(10).join("    "+p for p in paths)}
  </g>
</svg>
'''
open("opl-imprint-mini-white.svg","w").write(svg)
print("wrote opl-imprint-mini-white.svg")
