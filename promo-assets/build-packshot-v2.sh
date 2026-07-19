#!/bin/zsh
# Strengthened packshot (2026-07-19): clean logo-free football plate (plate-b, soul_2) +
# deterministic Ken Burns push-in + the REAL brand mark (logo-512.png) composited on the
# right with a fade + soft brand-blue glow reveal. No AI-rendered logo, pixel-perfect mark.
# Output has NO title text — assemble-hero-v5.sh adds the title/tag/url drawtext on top.
set -e
FF=${FFMPEG:-ffmpeg}
PA=$HOME/dev/officepickemleague/promo-assets
PLATE=${PLATE:-$PA/packshot-plate.png}
LOGO=$PA/logo-512.png

"$FF" -y -v error \
  -loop 1 -framerate 25 -t 5 -i "$PLATE" \
  -loop 1 -framerate 25 -t 5 -i "$LOGO" \
  -filter_complex "
    [0:v]scale=1920:1080,setsar=1,zoompan=z='min(zoom+0.00045,1.06)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=25,setsar=1[bg];
    [1:v]scale=236:236,format=rgba,fade=in:st=0.55:d=0.5:alpha=1[lg];
    color=c=black:s=520x520:d=5:r=25,format=rgba,geq=r=79:g=140:b=255:a='108*exp(-((X-260)^2+(Y-260)^2)/(2*112^2))',fade=in:st=0.4:d=0.7:alpha=1[gl];
    [bg][gl]overlay=x=630:y=40[b1];
    [b1][lg]overlay=x=772:y=182,format=yuv420p[vout]
  " -map "[vout]" -t 5 -c:v libx264 -preset medium -crf 18 "$PA/hero-5a-packshot-v2.mp4"
echo "--- packshot built ---"; ls -la "$PA/hero-5a-packshot-v2.mp4"
