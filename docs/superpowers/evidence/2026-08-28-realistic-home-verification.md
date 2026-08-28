# Realistic semantic home verification — 2026-08-28

## Verified automatically

- `node --test`: 182 tests passed, 0 failed.
- Every JavaScript and MJS file under `src`, `tests`, and `scripts` passed `node --check`.
- `git diff --check` completed without whitespace errors.
- The full changed homepage graph uses the single Safari-safe token `20260828-15`.
- The lesson sync workflow stages only `data/lessons`; its source allowlist has no application or stylesheet target.
- A local HTTP smoke test returned status 200 for `/`, the homepage stylesheet, application entry module, room renderer, and vendored Three.js module.

## Browser verification status

Interactive browser control was unavailable in this execution environment. No claim is made for visual appearance, canvas dimensions, runtime console state, or pointer/scroll behavior. Those checks remain required before merging into `main` or publishing to GitHub Pages.

## Required preview checks

- Desktop first frame: realistic room and readable main monitor, front three-quarter camera, chair does not occlude the screen.
- Scroll journey: all six captions and physical stations match; camera movement is continuous; station lights remain cumulative.
- Interactions: five quick actions work; six captions work; six 3D hit areas open the matching real route.
- Mobile: one-viewport static room, horizontally scrollable quick actions, no horizontal page overflow.
- Reduced motion: static readable room and immediate navigation.
- Failure path: DOM home remains complete when WebGL is unavailable.
- Regression routes: Home, Paths, Search, Review, Progress, SMM-01, assessment, notes and Focus exit.
- Runtime: no application console errors; canvas backing dimensions match CSS size times capped DPR.

## Publication gate

Do not advance `main` until the preview checks above are performed on an accessible preview and the user explicitly authorizes publication.
