# Design Guide · Piggy's Last Semester

> Codex: this is the visual contract. Before writing any UI, open `styleboard.html` in the browser. Every colour, font, radius, and animation duration comes from `tokens.css`. **Don't invent new colours.**

## 1. Concept: "Mia's Sticker Diary"

The site looks like a first-year student's scrapbook: thick ink outlines, hard offset shadows, chunky stickers, washi tape, rounded type. **Scams invade the diary.** When danger rises, the warm cream and pink give way to cold night-indigo and alert red. **The colour itself tells you whether you're safe.**

Three words for every decision: **cosy · cheeky · clear**.

## 2. Core principle: two layers with different jobs

| Layer | Carries | Why |
|---|---|---|
| **Video** (Seedance 2.0, 480P) | The shared story: scenes, acting, mood lighting | Pre-rendered, so it's the same for everyone |
| **UI** (HTML) | Everything personal or textual: Piggy's mood and money, choices, timer, red flags, phone texts, documents | Reacts live to *this* viewer's choices; text stays crisp at any resolution |

> "The video tells the story. Piggy tells YOUR story."

## 3. Tokens (`tokens.css`)

**Colour**
| Token | Hex | Use (meaning first, decoration never) |
|---|---|---|
| `--paper` | #FFF8EF | Page background |
| `--pig` | #FF9EC4 | Brand, primary buttons, choice keys, progress |
| `--ink` | #2B2340 | Text, **all outlines and shadows** |
| `--safe` | #3CCB8B | Right choice, red-flag-spotted stamp |
| `--alert` | #FF4D5E | Danger, timer fuse, money-loss toast |
| `--amber` | #FFB547 | Warnings |
| `--lavender` | #B9A6F5 | Washi tape, small accents only |
| `--night` | #1E1B3A | Scam-scene stage |

**Chapter moods.** The page background and the video prompt lighting share one colour script:
`home` warm cream→pink · `ch1` indigo→violet (phone glow) · `ch2` steel blue (cold authority) · `ch3` near-black + sickly screen glow (uncanny). `app.js` sets `body[data-mood]` automatically.

**Type:** Fredoka 600/700 (headings, buttons, numbers) · Nunito 400/800 (body, subtitles) · JetBrains Mono (fake official documents only). Chinese fallback: PingFang SC / Noto Sans SC.

**Shape:** outline `2.5px solid ink` · radius 8 / 14 / 20 · shadow `4px 4px 0 ink` (hover 6px, press 1px).

**Motion:** UI uses `--ease-spring` (overshoot = playful); media uses slow push-ins (12–14s Ken Burns). Durations are 160 / 320 / 600 ms. Respect `prefers-reduced-motion`.

## 4. Piggy, the live status meter

| State | When | File |
|---|---|---|
| happy | Money ≥ 80% | `assets/piggy-happy.svg` |
| worried | A choice is on screen, or money 50–80% | `piggy-worried.svg` |
| fainted | 2s right after losing money | `piggy-fainted.svg` |
| broke | Money < 50%, bad endings | `piggy-broke.svg` |
| cool | 2.5s after spotting a red flag; Scam Slayer ending | `piggy-cool.svg` |

- To add a state, copy the existing SVG structure: 120×110 viewBox, 3px ink stroke, same body. Change only eyes, mouth, and extras.
- `assets/seedance-ref/*.png` (1024×1024, white background) are **reference images for ModelArk Ref-to-video**, so the Piggy in the video matches the Piggy in the UI. Add this to every prompt that shows Piggy: `small glossy pink ceramic piggy bank with big cartoon eyes, thick dark outline, coin slot on top`.

## 5. Components (see `styleboard.html`)

- **Choice button:** white sticker, letter keycap in `--pig`. On hover it lifts and tilts −0.6°. Maximum 2 per node.
- **Fuse timer:** red striped bar with a 💥 spark riding its end. Pausing turns it grey and removes the spark.
- **Phone overlay:** white card, slides in with a small rotation. Variants: `sms` (grey bubble), `chat` (green bubble), `call` (centred 📞), `doc` (dashed amber paper, mono font), `scan` (Scameter result, red).
- **Red-flag stamp:** mint pill, rotated −2°, stamps in with scale 1.6→1.
- **Washi tape:** lavender strip (`::before`) on top of modal cards.
- **Ending card:** Piggy state image + title + stat pills + hotline box. Bad endings use dark night colours and always offer ⏪ Rewind.

## 6. Do / Don't

✅ Ink outline + hard shadow on every card · colour = meaning · Piggy reacts to everything · all readable text in HTML · 44px minimum tap targets · test at 375px width

🚫 Real logos (bank, police, WhatsApp, HKBU) or real faces (course ethics rule) · glassmorphism or generic "AI startup" gradients on UI chrome · more than 2 choices · preachy bad endings · sound before the first user tap · new colours outside tokens

## 7. References (learn the idea, don't copy the look)

- **Spent** (playspent.org): the money meter falls with each choice, and you feel the budget. Same core loop as ours.
- **Google "Interland" / Be Internet Awesome**: online-safety education that's playful, not preachy.
- **1in8b.life** (from the course slides): a choice-driven life simulation; good pacing reference.
- **Duolingo**: chunky buttons, a mascot that has emotions, celebration moments.
- Interactive-film UX in general: choices appear *after* the clip, the timer is visible, and the default choice happens on timeout.

## 8. Sound (optional, add after the videos)

Coin clink (gain), sad slide-whistle (loss), fuse hiss (timer, last 5s only), stamp thunk (red flag). Use CC0 sources only (for example Pixabay sound effects or freesound CC0), and record the credits in the README. Everything stays muted until the first click.
