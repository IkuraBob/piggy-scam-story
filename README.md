# Piggy's Last Semester 🐷

An interactive anti-scam story for GTSC2066 (Idea 2 · Fraud Prevention). Watch a short clip, make a choice, keep Piggy's HK$8,000 alive.

- Play: see the GitHub Pages link in the repo's About section
- Story & storyboard prompts: [planning/story.md](planning/story.md)
- Web plan / Codex task list: [planning/web-plan.md](planning/web-plan.md)
- Design guide (visual contract): [planning/design-guide.md](planning/design-guide.md) · live style board: `styleboard.html`
- Seedance reference images: `assets/seedance-ref/`
- Edit the story: `story.js` · Add clips: `media/<nodeId>.mp4`

Run locally: `python3 -m http.server 8765` then open http://localhost:8765

*Fictional, educational, non-commercial student project. Real help in Hong Kong: Anti-Scam Helpline 18222 · Scameter (cyberdefender.hk) · 999.*

## Media and sound

GitHub Pages serves `main` from the repository root. Add `media/<nodeId>.mp4`
for video nodes or `media/<nodeId>.jpg` for image nodes; the existing `media: null`
entries discover those names automatically. A custom local filename can still be
set in `story.js`. Missing files use placeholders. Next-node assets preload while
the current node plays.

Four approved background tracks are bundled in `media/audio/` (2026-11-09).
See [music credits](media/audio/CREDITS.md) for authorship, CC BY 4.0 licenses and processing.

Audio paths:

- `bgm-home.mp3`, `bgm-ch1.mp3`, `bgm-ch2.mp3`, `bgm-ch3.mp3`: looping music,
  decoded into Web Audio buffers and crossfaded over 600 ms. Only the current
  decoded track and its outgoing crossfade are retained.
- `<nodeId>.mp3`: narration. Its playback clock drives subtitles, and music drops
  to 30% of its usual gain while it plays.
- Gain, loss, red-flag and final-five-second fuse sounds are synthesized locally
  with Web Audio. Sound starts after a user click. The HUD toggle remembers mute.

Subtitle lines accept `t` in seconds. Without `t`, lines use equal time slots.
For exact narration alignment, add ascending `t` values to every line. With no
narration, timing follows the video or placeholder. Missing optional media/audio
can produce expected 404 entries in developer tools; playback falls back without
an uncaught application error. If a browser blocks video autoplay, use Play video.

## Language, quiz and sharing

Story text and the three quiz questions live in `story.js` as `{ en, zh }` values.
Language switching preserves the current balance and choices. Each ending shows
an A/B route code; rewinding also rewinds that code. Players can copy the code or
story link and download a PNG ending card. The quiz is separate from story choices.

There is no analytics service or outgoing data submission. Endings, language and
mute preferences are stored locally with failure-safe access. Fonts are served
locally; their SIL Open Font License notices are in `assets/fonts/`. The entry
pages use a CSP with no inline scripts or inline style attributes. Scripted
connections are limited to same-origin BGM downloads; external connections remain
blocked. Dynamic text is built with text nodes and `textContent`.

## Checks

Run the dependency-free logic checks with `node tests/check.cjs` if Node.js is
available. The website itself needs only `python3 -m http.server 8765`.

Local browser checks (2026-11-07):

| Route | Choices | Ending | Balance |
|---|---|---|---|
| All safe | B-A-B | Scam Slayer | HK$8,000 |
| Tax, roommate rescue, verify Mom | A-A-A-B-A-A-B | Comeback Kid | HK$5,050 |
| Leave without telling Jo | B-B-A-B | Gone Dark | HK$5,000 |
| Send to fake Mom and stay silent | B-A-A-B | Face Swapped | HK$4,000 |

All four routes were played at 1280px and 375px. Also checked: rewind and revised
route codes, timer timeout/pause, pressure toggle, Chinese quiz score, PNG export,
missing-media fallback and language switching. Logic checks cover all 40 complete
paths and the audio lifecycle. Local synthetic audio fixtures exercised browser
playback, music switching and narration; these fixtures are not shipped.

The above table is the original 2026-11-07 check record. Current music integration
and verification are documented in [BGM production](planning/bgm-production.md).
Physical iOS Safari / Android Chrome testing and a human review of the final
dialogue/music mix remain outstanding.


2026-11-09：c3 已采用组员确认的 v1 画面与 ElevenLabs 妈妈配音（1.28 倍速），字幕时间同步更新。详见 [c3 制作与验证记录](planning/c3-production.md)。

## AI contributors

- **OpenAI ChatGPT / Codex (coordinator)**: project coordination, writing and implementation support, verification, and deployment.
- **Claude (Anthropic)**: front-end design and implementation.
