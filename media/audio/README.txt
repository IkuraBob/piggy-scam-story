Video dialogue normally comes from the video's own soundtrack (Output sound ON
when generating the clip). Deliver one clip of at most 15 seconds per video node.
Image nodes and missing-media placeholders display subtitles without narration.

Optional local MP3 files:
- bgm-home.mp3, bgm-ch1.mp3, bgm-ch2.mp3, bgm-ch3.mp3: looping music.
- <nodeId>.mp3: optional narration override for a video, e.g. intro.mp3.
  If playable, narration takes priority and the video's soundtrack stays muted
  for that node. Keep the override aligned with the video and no longer than it.

Video duration controls subtitles and when choices/Continue appear. Subtitle
lines are evenly spaced across the video; optional t values override their start
positions in seconds. Skip stops both the video and any narration override.

Everything stays silent before the first user click. The HUD mute toggle controls
video, narration, BGM and effects; its preference is stored on this device only.
Music crossfades over 600 ms. While a video with audio plays, music drops to 25%
of its normal gain (30% with a narration override). It returns to normal on image
nodes and choice/Continue/ending overlays. Browsers that cannot report whether a
video has an audio track conservatively duck music for all playing videos.

Missing optional files are handled without stopping the story. The browser may
report expected 404 responses while probing them. Use seamless music loops and
keep dialogue consistent with story.js. No audio is downloaded from third-party
services by the site.
