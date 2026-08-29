# Study Hub Immersive Home V23 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the V22 immersive room with a reliable mobile/reduced-motion journey, a reversible cinematic Paths transition, layered pointer depth and more plausible local PBR rendering.

**Architecture:** Keep the existing semantic room and add two focused modules: one for journey/route state and one for layered parallax state. Existing renderer, room and views consume those modules through small explicit interfaces; no backend or external asset host is introduced.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, CSS, Node test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-immersive-home-v23-design.md`

## Global Constraints

- Preserve the six semantic stations and every existing Study Hub route.
- Keep the scroll-driven cinematic journey on desktop and mobile, including reduced-motion devices.
- Disable autonomous/parallax movement under reduced motion.
- Use no paid API, backend, external runtime asset or service.
- Preserve Safari-safe coherent asset versioning.
- Every behavior change follows red-green TDD.

---

### Task 1: Explicit journey budgets and reduced-motion consistency

**Files:**
- Modify: `src/home/home-experience.js`
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-exit-journey.test.js`
- Modify: `tests/motion-fallback.test.js`

**Interfaces:**
- Produces: `resolveJourneyLayout(width)` and `resolveJourneyPhases(progress, width)`.

- [ ] Write failing tests for 600+140 desktop and 1100+180 mobile budgets and scroll-driven reduced motion.
- [ ] Run the focused tests and confirm the expected failures.
- [ ] Implement layout-aware phase mapping and remove CSS rules that collapse journey height.
- [ ] Run focused tests and commit.

### Task 2: Cinematic route-state contract

**Files:**
- Create: `src/home/home-route-state.js`
- Create: `tests/home-route-state.test.js`
- Modify: `src/home/home-experience.js`

**Interfaces:**
- Produces: `createCinematicRouteState(storage, now)`, with `markExit()`, `consumePathsEntry()`, `markReturn()` and `consumeHomeResume()`.

- [ ] Write failing tests for origin distinction, expiry, one-time consumption and anti-loop resume state.
- [ ] Run tests and confirm failure because the module is absent.
- [ ] Implement the storage adapter with validated JSON and a five-minute TTL.
- [ ] Mark automatic exit before navigating and consume resume state during home mount.
- [ ] Run focused tests and commit.

### Task 3: Wheel and touch return from Paths

**Files:**
- Create: `src/home/paths-return-controller.js`
- Create: `tests/paths-return-controller.test.js`
- Modify: `src/views/paths-view.js`
- Modify: `src/app.js`

**Interfaces:**
- Consumes: cinematic route-state adapter.
- Produces: `createPathsReturnController({ root, routeState, navigate, windowTarget })` returning `dispose()`.

- [ ] Write failing tests for upward wheel threshold, upward touch gesture, top-of-page guard, ordinary-entry guard and single navigation.
- [ ] Implement event accumulation and cleanup without preventing normal downward page use.
- [ ] Mount only on the general Paths view and restore Home through the internal router.
- [ ] Run focused tests and commit.

### Task 4: Resume the final runway without loops

**Files:**
- Modify: `src/home/home-experience.js`
- Modify: `tests/home-exit-journey.test.js`
- Modify: `tests/home-route-state.test.js`

**Interfaces:**
- Consumes: `consumeHomeResume()`.
- Produces: a restored raw progress below the exit trigger plus an armed/disarmed re-entry lock.

- [ ] Write failing tests for resume progress, delayed exit re-arming and backward travel.
- [ ] Restore scroll after the sticky stage exists and suppress automatic exit until the hysteresis boundary is crossed.
- [ ] Verify reverse scrolling and deliberate forward re-entry.
- [ ] Run focused tests and commit.

### Task 5: Inertial layered parallax

**Files:**
- Modify: `src/home/scene/interaction-controller.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Create: `tests/home-parallax.test.js`

**Interfaces:**
- Produces: interaction `update(delta)` with smoothed `{ x, y }`; room `setParallax(offset)` and `parallaxAudit`.

- [ ] Write failing tests for bounded smoothing, depth differentiation, reset and layer cap.
- [ ] Implement inertial targets without per-frame allocation.
- [ ] Register semantic layer objects with immutable base transforms.
- [ ] Apply smaller camera motion and disable everything for mobile, exit and reduced motion.
- [ ] Run focused tests and commit.

### Task 6: PBR detail and calibrated light

**Files:**
- Modify: `src/home/scene/materials.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/lighting-controller.js`
- Modify: `tests/home-materials.test.js`
- Modify: `tests/home-lighting.test.js`

**Interfaces:**
- Produces: deterministic local color/roughness/normal maps and renderer exposure/shadow audit fields.

- [ ] Write failing tests for normal maps, physically plausible material ranges, tone mapping and bounded light intensities.
- [ ] Add deterministic paired maps and retain the texture budget.
- [ ] Calibrate tone mapping, exposure, shadow bias and neutral fill/screen spill.
- [ ] Improve only silhouette-critical geometry and contact shadows.
- [ ] Run focused tests and commit.

### Task 7: Release coherence and full verification

**Files:**
- Modify: `index.html`
- Modify: changed `src/**/*.js` import tokens
- Modify: `tests/home-deployment.test.js`

**Interfaces:**
- Produces: one V23 release token across the changed module graph.

- [ ] Advance the release token consistently and run the deployment graph test.
- [ ] Run syntax checks and the complete `npm test` suite.
- [ ] Verify desktop and 390×844 behavior, WebGL fallback and public asset equality.
- [ ] Commit the release and publish only after all verification passes.
