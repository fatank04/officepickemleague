#!/bin/zsh
# Office Pick'em promo v2 — 30s beat-synced cuts A (B2C) + B (B2B).
# Beat grid (track accents): 5.9 / 11.9 / 17.8 / 23.5 / 27.1 (music hard-cut) / end 34.0
# Requires VO chunks: narration-v3-cut{A,B}-{open,body,button}.mp3 in promo-assets.
set -e
SP=/private/tmp/claude-501/-Users-ankurdoshi-Claude-Code/5b978572-82cf-46dc-84b3-69f232c2c7d8/scratchpad
PA=$HOME/dev/officepickemleague/promo-assets
WT=$HOME/dev/officepickemleague/public/walkthrough.mp4
FONT=/System/Library/Fonts/HelveticaNeue.ttc
cd "$SP"

printf 'Office Pick’em League' > title.txt
printf 'Settle it this season.' > tagA.txt
printf 'Give them a season.' > tagB.txt
printf 'officepickemleague.com' > urlA.txt
printf 'officepickemleague.com/pricing' > urlB.txt

# slots: s1 0-5.9 | s4 5.9-11.9 | s3 11.9-17.8 | picks 17.8-23.5 | standings 23.5-27.1 | card 27.1-34
build () { # $1 letter  $2 tagfile  $3 urlfile  $4 vo-open  $5 vo-body  $6 vo-button
  FC="[0:v]fps=25,scale=1280:720,setsar=1,setpts=1.18*PTS,trim=0:5.9[v1];
      [1:v]fps=25,scale=1280:720,setsar=1,setpts=1.20*PTS,trim=0:6.0[v4];
      [2:v]fps=25,scale=1280:720,setsar=1,setpts=1.18*PTS,trim=0:5.9[v3];
      [3:v]trim=15.5:21.2,setpts=PTS-STARTPTS,crop=1440:810:0:60,scale=1280:720,fps=25,setsar=1[picks];
      [3:v]trim=7.4:11.0,setpts=PTS-STARTPTS,crop=1440:810:0:60,scale=1280:720,fps=25,setsar=1[stand];
      color=c=0x0d131d:s=1280x720:d=6.9:r=25,drawtext=fontfile=${FONT}:textfile=title.txt:fontsize=58:fontcolor=0xf2f6fc:x=(w-text_w)/2:y=352,drawtext=fontfile=${FONT}:textfile=$2:fontsize=32:fontcolor=0x4f8cff:x=(w-text_w)/2:y=436,drawtext=fontfile=${FONT}:textfile=$3:fontsize=24:fontcolor=0x9aa8bf:x=(w-text_w)/2:y=500[cardbase];
      [4:v]scale=150:150[logo];
      [cardbase][logo]overlay=x=(W-150)/2:y=170[card];
      [v1][v4][v3][picks][stand][card]concat=n=6:v=1:a=0,format=yuv420p[vout];
      [5:a]atrim=0:27.15,afade=t=out:st=26.95:d=0.2,volume=0.45,apad=whole_dur=34[mus];
      [6:a]adelay=1000|1000[voA];
      [7:a]adelay=6200|6200[voB];
      [8:a]adelay=27600|27600[voC];
      [mus][voA][voB][voC]amix=inputs=4:duration=first:normalize=0[aout]"
  FC=$(printf '%s' "$FC" | tr -d ' \n\t')
  ./ffmpeg -y -v error \
    -i "$PA/shot1-football-desk-dawn.mp4" \
    -i "$PA/shot4-worker-texting.mp4" \
    -i "$PA/shot3-warehouse-huddle.mp4" \
    -i "$WT" \
    -i "$PA/logo-512.png" \
    -i "$PA/epic-sport-trailer-music.mp3" \
    -i "$PA/$4" -i "$PA/$5" -i "$PA/$6" \
    -filter_complex "$FC" \
    -map "[vout]" -map "[aout]" -t 34 -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k "$PA/promo-v2-cut$1.mp4"
}

build A tagA.txt urlA.txt narration-v3-cutA-open.mp3 narration-v3-cutA-body.mp3 narration-v3-cutA-button.mp3
build B tagB.txt urlB.txt narration-v3-cutB-open.mp3 narration-v3-cutB-body.mp3 narration-v3-cutB-button.mp3
echo "--- done ---"; ls -la "$PA"/promo-v2-cut*.mp4
