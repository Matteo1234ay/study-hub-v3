# Cinematic Study Hub Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a recognizable WebGL study room/pod whose camera and focus are choreographed by a long scroll journey.

**Architecture:** Keep the existing single sticky homepage and native WebGL2 renderer. Replace the primitive hub SDF with composed architectural geometry and add a piecewise scroll camera path. DOM station labels mirror the same journey stages and remain actionable/accessibility-friendly.

**Tech Stack:** Vanilla JS ES modules, WebGL2/GLSL ES 3.00, CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-27-study-hub-cinematic-room-design.md`

## Global Constraints
- No CDN or external runtime dependency.
- Keep current CSP and routes intact.
- Preserve reduced motion, focus mode and cache-busting/versioned assets.
- Homepage remains one continuous scene, never a card grid.

---

### Task 1: Lock the cinematic-room contract in tests

**Files:**
- Modify: `tests/home-experience.test.js`

**Interfaces:**
- Consumes: `src/views/home-view.js`, `src/home/study-hub-webgl.js`, `styles/home-immersive.css`
- Produces: assertions requiring long-scroll scene, station overlays, architectural SDF primitives, and camera choreography.

- [ ] **Step 1: Write the failing test**

Assert that the home contains `hub-station`, `900vh`, and that the renderer source contains `sdRoundBox`, `lookAt`, `cameraJourney`, `desk`, `screen`, and `journey`.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/home-experience.test.js`
Expected: FAIL because the current renderer is still a single box abstraction and the scroll scene is shorter.

- [ ] **Step 3: Commit**

Commit message: `test: define cinematic study room journey`

### Task 2: Replace abstract WebGL object with a study room/pod

**Files:**
- Modify: `src/home/study-hub-webgl.js`

**Interfaces:**
- Consumes: `mountStudyHubWebGL(canvas,{getJourney})`
- Produces: same public function signature so `home-view.js` does not need a renderer API change.

- [ ] **Step 1: Implement architectural SDFs**

Add rounded-box and capsule/plane helpers and compose shell, floor, desk, screens, shelving, path modules, central light and doorway.

- [ ] **Step 2: Add material IDs**

Return material information alongside distance so floor/glass/screens/modules receive distinct lighting responses.

- [ ] **Step 3: Add camera choreography**

Implement `cameraJourney(journey, out ro, out target)` using piecewise interpolation across the nine approved timeline stages. Build the view ray with a `lookAt` basis instead of a fixed forward ray.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/home-experience.test.js`
Expected: renderer assertions pass.

- [ ] **Step 5: Commit**

Commit message: `feat: model cinematic WebGL study hub room`

### Task 3: Make scroll guide attention through functional stations

**Files:**
- Modify: `src/views/home-view.js`
- Modify: `styles/home-immersive.css`

**Interfaces:**
- Consumes: existing PATHS, last-position study state, `mountStudyHubWebGL`
- Produces: `.hub-station` overlays mapped to journey centers; 900vh sticky scene.

- [ ] **Step 1: Replace generic nodes with stations**

Render compact overlays for current lesson, notes/review, Social Media path, assessment, progress, future paths and final overview. Keep copy factual and short.

- [ ] **Step 2: Extend journey and synchronize station focus**

Set the home journey to about `900vh`. In `bindJourney`, compute station focus from each station's `data-center`/`data-span` values and toggle `.is-active` only near its intended camera stop.

- [ ] **Step 3: Style overlays as integrated HUD labels**

Use restrained translucent labels, fine leader lines, focus blur/opacity and no large marketing headings. Keep WebGL canvas dominant.

- [ ] **Step 4: Preserve reduced-motion fallback**

Static fallback shows hub description and all actionable stations in readable flow.

- [ ] **Step 5: Verify full tests**

Run: `node --test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

Commit message: `feat: choreograph study hub station reveals`

### Task 4: Publish and verify

**Files:**
- Modify: `src/app.js`
- Modify: `index.html`

**Interfaces:**
- Produces: cache-busted `v=20260827-7` imports/assets.

- [ ] **Step 1: Bump homepage module and asset versions**

Keep readable formatting required by existing focus-mode tests.

- [ ] **Step 2: Verify GitHub Actions**

Confirm the `Test` workflow for the final commit concludes `success`.

- [ ] **Step 3: Verify Pages deployment**

Confirm the Pages workflow for the final commit completes before handing the URL back to the user.
