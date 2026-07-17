#!/bin/zsh
# Assemble Office Pick'em promo cuts A (B2C) and B (B2B).
# Timeline (45s): shots 0-15 | app montage 15-36 | CTA card 36-45 (music hard-cuts at card)
set -e
SP=/private/tmp/claude-501/-Users-ankurdoshi-Claude-Code/5b978572-82cf-46dc-84b3-69f232c2c7d8/scratchpad
PA=~/dev/officepickemleague/promo-assets
WT=~/dev/officepickemleague/public/walkthrough.mp4
FONT=/System/Library/Fonts/HelveticaNeue.ttc
cd "$SP"

printf 'Office Pick’em League' > title.txt
printf "Settle it this season." > tagA.txt
printf "Give them a season." > tagB.txt
printf "officepickemleague.com" > urlA.txt
printf "officepickemleague.com/pricing" > urlB.txt

build () { # $1 cut letter  $2 admin_or_lock  $3 tagfile $4 urlfile $5 audio_filter
  FC="[0:v]fps=25,scale=1280:720,setsar=1[v0];
      [1:v]fps=25,scale=1280:720,setsar=1[v1];
      [2:v]fps=25,scale=1280:720,setsar=1[v2];
      [3:v]trim=15.5:21.5,setpts=PTS-STARTPTS,crop=1440:810:0:60,scale=1280:720,fps=25,setsar=1[picks];
      [3:v]trim=$2,setpts=PTS-STARTPTS,crop=1440:810:0:60,scale=1280:720,fps=25,setsar=1[seg2];
      [3:v]trim=7:12.5,setpts=PTS-STARTPTS,crop=1440:810:0:60,scale=1280:720,fps=25,setsar=1[stand];
      [3:v]trim=31:36.5,setpts=PTS-STARTPTS,crop=1440:810:0:60,scale=1280:720,fps=25,setsar=1[insight];
      color=c=0x0d131d:s=1280x720:d=9:r=25,drawtext=fontfile=${FONT}:textfile=title.txt:fontsize=64:fontcolor=0xf2f6fc:x=(w-text_w)/2:y=270,drawtext=fontfile=${FONT}:textfile=$3:fontsize=34:fontcolor=0x4f8cff:x=(w-text_w)/2:y=360,drawtext=fontfile=${FONT}:textfile=$4:fontsize=26:fontcolor=0x9aa8bf:x=(w-text_w)/2:y=430[card];
      [v0][v1][v2][picks][seg2][stand][insight][card]concat=n=8:v=1:a=0,format=yuv420p[vout];
      $5"
  FC=$(printf '%s' "$FC" | tr -d ' \n\t')
  ./ffmpeg -y -v error \
    -i "$PA/shot1-football-desk-dawn.mp4" \
    -i "$PA/shot2-corridor-tunnel-walk.mp4" \
    -i "$PA/shot3-warehouse-huddle.mp4" \
    -i "$WT" \
    -i "$PA/epic-sport-trailer-music.mp3" \
    -i "$PA/narration-v2-cutA-open.mp3" \
    -i "$PA/narration-v2-cutA-back.mp3" \
    -i "$PA/narration-v2-cutB-full.mp3" \
    -filter_complex "$FC" \
    -map "[vout]" -map "[aout]" -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k "$PA/promo-cut$1.mp4"
}

AUD_A='[4:a]atrim=0:36.6,afade=t=out:st=36.2:d=0.4,volume=0.45,apad=whole_dur=45[mus];
      [5:a]adelay=800|800[voA1];[6:a]adelay=19000|19000[voA2];
      [mus][voA1][voA2]amix=inputs=3:duration=first:normalize=0[aout]'
AUD_B='[4:a]atrim=0:36.6,afade=t=out:st=36.2:d=0.4,volume=0.45,apad=whole_dur=45[mus];
      [7:a]adelay=800|800[voB];
      [mus][voB]amix=inputs=2:duration=first:normalize=0[aout]'

build A "23:27.5" tagA.txt urlA.txt "$AUD_A"
build B "37.6:41.6" tagB.txt urlB.txt "$AUD_B"
echo "--- done ---"; ls -la "$PA"/promo-cut*.mp4
