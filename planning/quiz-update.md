# Ending quiz update · 2026-11-11

Status: locally implemented and tested; awaiting user approval before pushing.

## Behaviour

Every ending clip now opens the three-question quiz automatically, with the ending title and balance above it. “View ending first” opens the full ending card; “Continue quiz” resumes the current answer and question. Completing the quiz shows the score at the top of the ending card. Retrying resets quiz progress only. There is no timer, network submission or effect on story money, flags, routes or endings.

The bilingual questions test independent verification (scholarship email and its hotline), limits of apparently reassuring evidence (ticket seller), and sunk-cost reasoning (a roommate continuing to pay). Each uses the existing two-choice component. Questions and explanations remain in story.js; no CSS, dependencies or audio code changed.

## Local verification

- `node tests/check.cjs`: passed; all 40 story paths, four ending balance sets, bilingual content, subtitle clocks, CSP/security and audio lifecycle checks.
- Served with `python3 -m http.server 8765`.
- Browser walkthroughs at 1280px and 375px: all four endings automatically open question 1. Balances: Comeback 5,050; Face Swapped 1,050; Gone Dark 2,050; Slayer 8,000 (desktop) / 8,050 (mobile).
- Correct and incorrect feedback, disabled answered options, scores 0/3, 2/3 and 3/3, retry reset, language switch retaining an answer, skip/resume and bad-ending rewind checked.
- 375px English long-question layout: no horizontal overflow. Chinese mobile and English desktop layouts visually inspected. No browser warnings/errors observed.
- This is viewport testing, not a new physical-phone test. The production site has not been updated by this change.
