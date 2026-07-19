#!/bin/zsh
# SHIFT CHANGE hero ad v5 — script A, strengthened packshot (2026-07-19).
# Same as v4 EXCEPT the packshot: hero-5a-packshot-v2.mp4 (clean football plate + Ken Burns +
# REAL logo-512.png composited with radial-gaussian brand-blue glow reveal — replaces the
# AI-rendered logo). Title/tag/url lockup moved to the RIGHT under the logo (football is
# lower-left in the new plate) so text and football don't clash. All VO/timing/music identical.
set -e
FF=${FFMPEG:-ffmpeg}
PA=$HOME/dev/officepickemleague/promo-assets
SD=$PA/seedance
FONT=/System/Library/Fonts/HelveticaNeue.ttc
WORK=${WORKDIR:-$PA}
cd "$WORK"

printf 'Office Pick’em League' > h_title.txt
printf 'Give them a season.' > h_tag.txt
printf 'officepickemleague.com/pricing' > h_url.txt
"$FF" -y -v error -ss 5.65 -t 0.8 -i "$PA/epic-sport-trailer-music.mp3" -af "afade=t=out:st=0.5:d=0.3,volume=0.9" sting.wav

FC="[0:v]fps=25,scale=1280:720,setsar=1,trim=0:2.0[v1a];
    [1:v]fps=25,scale=1280:720,setsar=1,trim=0:3.9,setpts=PTS-STARTPTS[v1b];
    [2:v]fps=25,scale=1280:720,setsar=1,setpts=1.2*PTS,trim=0:6.0,setpts=PTS-STARTPTS[v2a];
    [3:v]fps=25,scale=1280:720,setsar=1,trim=0:3.0,setpts=PTS-STARTPTS[v3a];
    [4:v]fps=25,scale=1280:720,setsar=1,trim=0.5:3.4,setpts=PTS-STARTPTS[v3b];
    [5:v]fps=25,scale=1280:720,setsar=1,trim=0:3.0,setpts=PTS-STARTPTS[v3c];
    [6:v]fps=25,scale=1280:720,setsar=1,trim=0:2.7,setpts=PTS-STARTPTS[v4a];
    [7:v]fps=25,scale=1280:720,setsar=1,trim=0.5:4.95,setpts=PTS-STARTPTS[v4b];
    [8:v]fps=25,scale=1280:720,setsar=1,tpad=stop_mode=clone:stop_duration=2.0,trim=0:6.9,setpts=PTS-STARTPTS,drawtext=fontfile=${FONT}:textfile=h_title.txt:fontsize=50:fontcolor=0xf2f6fc:x=(890-text_w/2):y=442:alpha='if(lt(t,1.4),0,min(1,(t-1.4)/0.8))',drawtext=fontfile=${FONT}:textfile=h_tag.txt:fontsize=28:fontcolor=0x4f8cff:x=(890-text_w/2):y=506:alpha='if(lt(t,1.8),0,min(1,(t-1.8)/0.8))',drawtext=fontfile=${FONT}:textfile=h_url.txt:fontsize=22:fontcolor=0x9aa8bf:x=(890-text_w/2):y=556:alpha='if(lt(t,2.2),0,min(1,(t-2.2)/0.8))'[v5a];
    [v1a][v1b][v2a][v3a][v3b][v3c][v4a][v4b][v5a]concat=n=9:v=1:a=0,format=yuv420p[vout];
    [9:a]atrim=0:27.9,afade=t=out:st=27.65:d=0.25,volume=0.42,apad=whole_dur=35[mus];
    [10:a]adelay=200|200[st1];
    [11:a]adelay=27950|27950[st2];
    [12:a]adelay=2000|2000[voA];
    [13:a]adelay=11900|11900[voB];
    [14:a]adelay=20950|20950[voC];
    [15:a]adelay=28900|28900[voD];
    [mus][st1][st2][voA][voB][voC][voD]amix=inputs=7:duration=first:normalize=0[aout]"
FC=$(printf '%s' "$FC" | tr -d ' \n\t')

"$FF" -y -v error \
  -i "$PA/hero-1a-phone.mp4" \
  -i "$SD/sd-1b-shopfloor.mp4" \
  -i "$SD/sd-2a-football.mp4" \
  -i "$PA/hero-3a-picks.mp4" \
  -i "$SD/sd-3b-texting.mp4" \
  -i "$PA/hero-3c-paper.mp4" \
  -i "$PA/hero-4a-standings.mp4" \
  -i "$SD/sd-4b-huddle.mp4" \
  -i "$PA/hero-5a-packshot-v2.mp4" \
  -i "$PA/epic-sport-trailer-music.mp3" \
  -i sting.wav -i sting.wav \
  -i "$PA/narration-v4-open.mp3" \
  -i "$PA/narration-v4-body.mp3" \
  -i "$PA/narration-v4-proof.mp3" \
  -i "$PA/narration-v3-cutB-button.mp3" \
  -filter_complex "$FC" \
  -map "[vout]" -map "[aout]" -t 35 -c:v libx264 -preset medium -crf 19 -c:a aac -b:a 192k \
  "$PA/promo-hero-shift-change-v5.mp4"
echo "--- done ---"; ls -la "$PA/promo-hero-shift-change-v5.mp4"
