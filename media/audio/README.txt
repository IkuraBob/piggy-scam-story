Optional local audio (MP3):
- bgm-home.mp3, bgm-ch1.mp3, bgm-ch2.mp3, bgm-ch3.mp3: looping music.
- <nodeId>.mp3: narration, e.g. intro.mp3 or c1.mp3.

Missing files stay silent. The browser may report expected 404 responses
while probing optional files; these are handled and do not stop the story.
Music crossfades over 600 ms and drops to 30% of its normal gain during
narration. Narration drives subtitle timing when playback is allowed.
Use short, seamless music loops. Keep narration consistent with story.js.
The HUD mute preference is stored on this device only.
