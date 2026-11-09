# Background music · 2026-11-09

Status: approved tracks integrated; local validation passed.

| Mood | Track | Source |
|---|---|---|
| Home | Carefree | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037 |
| Ch1 | Sneaky Snitch | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100772 |
| Ch2 | Crypto | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600013 |
| Ch3 | Dreams Become Real | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500027 |

## Decision and processing

The user approved Carefree for Home, Sneaky Snitch for Chapter 1, Crypto for
Chapter 2 and Dreams Become Real for Chapter 3. Measured Paces was rejected as
too frightening. Suno candidates were not used because downloads required payment.
Music is existing Kevin MacLeod work, not AI-generated project output.

See [credits](../media/audio/CREDITS.md) and [manifest](../media/audio/credits.json).
Four local MP3 files use the existing automatic mood paths; no external streaming,
analytics, new dependency or story change. Full-length tracks are loudness-normalized
and have short boundary fades. Existing 600 ms mood crossfades, 25% video ducking,
30% optional narration ducking and persistent mute are retained.

## Validation

- `tests/check.cjs`: passed all 40 paths, all four ending balance sets, subtitles,
  audio lifecycle (crossfade, mute, missing-file fallback and ducking), video
  soundtrack and security checks.
- All four processed MP3 files fully decoded without errors; about 15.3 MB total.
- Local Python server: all four BGM paths requested successfully (HTTP 200).
- Browser at 1280px and 375px: all four endings reached through actual controls;
  BAB → Slayer 8000; AAAAB → Comeback 5050; AAAAAB → Face Swapped 1050;
  AAABAB → Gone Dark 2050. Additional ABBBB → Slayer 8050 passed at both widths.
- Screenshot review: four endings and footer fit at 375px. English/Chinese music
  credits remain visible, no horizontal overflow. Mute survives reload; unmute
  restores the button state. Final browser error/warning log was empty.
- Evidence: project `tests-suno/bgm-*.png`. Route checks use Skip to advance clips;
  this validates navigation/layout, not an uninterrupted listening session.
- Public deployment verification is recorded separately after pushing.
Human listening approved the source tracks; final mixed playback and physical
mobile devices have not been independently auditioned/tested by Codex.

## Refresh / mute recovery · 2026-11-09

User report: when the saved state is sound-on, refresh can leave BGM silent;
when saved as muted, switching sound on after refresh makes it audible.
The distinction between before and after the first click is still awaiting
user clarification. A fresh page intentionally produces no audio before a gesture.

A deterministic regression reproduced a recovery defect: when the browser rejects
the first BGM play request, unmute retries play but leaves the track gain at zero.
All play retries now restore the current ducked/normal gain. Regular clicks resume
an interrupted AudioContext and retry paused BGM; revisiting the same mood can also
retry. BGM muting uses master gain without toggling HTMLMediaElement.muted, avoiding
an extra media-unmute transition. Video/narration mute behavior is unchanged.

Validation: new blocked-play, retry, same-mood and stored-preference regressions
pass with `tests/check.cjs` (40 paths / all balances). Browser diagnostics confirmed
running context, advancing BGM time, master gain 0/1, and video duck gain 0.05
for both saved-mute states after refresh. All four endings passed at 1280px and
375px. Production layout has no horizontal overflow. Temporary diagnostic pages
were removed and are not deployed. These checks are desktop browser evidence,
not iOS/Android hardware confirmation; the user's phone symptom is not yet
confirmed resolved.
