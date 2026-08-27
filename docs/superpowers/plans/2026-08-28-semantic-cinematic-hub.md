# Semantic Cinematic Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Study Hub homepage feel fluid, cinematic and semantically coherent: each camera shot focuses on a meaningful object tied to the accompanying copy, with visible-but-dim ambience at the start and staged lighting through the scroll.

**Architecture:** Keep the existing native WebGL2 raymarch scene and long sticky scroll, but simplify expensive lighting work, define explicit semantic scene targets, and synchronize camera targets, light targets and station copy from one journey timeline. Replace arbitrary geometry with recognizable study objects and screen visuals that encode the current concept.

**Tech Stack:** Vanilla JavaScript, native WebGL2 / GLSL ES 3.00, CSS, Node test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-28-semantic-cinematic-hub-design.md`

## Global Constraints
- No external runtime dependency or CDN.
- Preserve current routes, Study Hub data stores and CSP.
- Preserve reduced-motion support.
- Homepage remains one continuous cinematic scene.
- Every featured object must have a semantic relationship with its station copy.
- Initial frame must reveal the room silhouette and key furniture without full illumination.
- Full room lighting appears only during the final reveal.

---

### Task 1: Performance and semantic scene contract

**Files:**
- Modify: `tests/home-experience.test.js`
- Modify: `src/home/study-hub-webgl.js`

**Interfaces:**
- Produces: GLSL helpers `semanticTarget(float q)`, `lightingJourney(float q, ...)`, and a lower-cost shadow/occlusion path.

- [ ] **Step 1: Write the failing test**

Add assertions requiring `semanticTarget`, `screenLessonVisual`, `screenNotesVisual`, `screenQuizVisual`, `screenProgressVisual`, `initialAmbient`, and a reduced raymarch/shadow budget marker such as `PERF_BUDGET`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/home-experience.test.js`
Expected: FAIL because the new semantic/performance helpers are absent.

- [ ] **Step 3: Implement the minimal renderer changes**

In `study-hub-webgl.js`:
- define `const PERF_BUDGET = "balanced"` in JS source for test visibility;
- reduce primary raymarch iterations from 136 to <= 104;
- reduce shadow loop iterations from 20 to <= 10;
- reduce ambient occlusion samples from 4 to 3;
- add a small nonzero `initialAmbient` term independent of final room power;
- define `semanticTarget(q)` returning the exact focal object for each station;
- make `lightingJourney` use that semantic target instead of unrelated coordinates.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/home-experience.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `perf: simplify semantic hub renderer`

---

### Task 2: Camera choreography with proper framing

**Files:**
- Modify: `tests/home-experience.test.js`
- Modify: `src/home/study-hub-webgl.js`

**Interfaces:**
- Produces: `cameraPose(float q, out vec3 ro, out vec3 target)` with continuous interpolation between shot anchors.

- [ ] **Step 1: Write the failing test**

Require source patterns `cameraPose`, `shotAnchors`, `smoothCamera`, and semantic labels `DESK`, `NOTES`, `SMM`, `QUIZ`, `PROGRESS`, `FUTURE`.

- [ ] **Step 2: Verify red**

Run: `node --test tests/home-experience.test.js`
Expected: FAIL on the new camera contract.

- [ ] **Step 3: Implement camera anchors**

Replace abrupt branch target changes with a sequence of named shot anchors. For each segment use entry/dwell/exit timing and smooth interpolation of both camera position and target. Frame the object with enough surrounding room context so the user understands where it sits in the environment.

- [ ] **Step 4: Verify green**

Run: `node --test tests/home-experience.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: choreograph semantic camera shots`

---

### Task 3: Meaningful objects and monitor visuals

**Files:**
- Modify: `tests/home-experience.test.js`
- Modify: `src/home/study-hub-webgl.js`
- Modify: `src/views/home-view.js`

**Interfaces:**
- Produces GLSL screen visual helpers and scene objects corresponding one-to-one with station copy.

- [ ] **Step 1: Write the failing test**

Require `screenLessonVisual`, `screenNotesVisual`, `screenSocialVisual`, `screenQuizVisual`, `screenProgressVisual`, plus copy references in `home-view.js` that describe the same object being framed.

- [ ] **Step 2: Verify red**

Run: `node --test tests/home-experience.test.js`
Expected: FAIL because screen visual functions do not exist.

- [ ] **Step 3: Implement semantic visuals**

Use procedural graphics on the monitor/display surfaces rather than external images:
- desk monitor: lesson layout with title bars, chapter blocks and reading progress;
- notes wall/display: note cards and review markers;
- Social Media station: feed/post grid and reach/engagement graph motif;
- assessment console: question/options/progress motif;
- progress display: bars/line progression motif;
- future modules: recognizable but dim inactive panels, not arbitrary cylinders or planets.

Remove decorative geometry that has no explanatory purpose.

- [ ] **Step 4: Update copy to match framed objects**

Adjust station detail text so it explicitly names what the camera is showing (monitor, notes wall, assessment console, progress display, dormant modules).

- [ ] **Step 5: Verify green**

Run: `node --test tests/home-experience.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: connect hub objects to learning concepts`

---

### Task 4: Lighting sequence and readable opening

**Files:**
- Modify: `tests/home-experience.test.js`
- Modify: `src/home/study-hub-webgl.js`

**Interfaces:**
- `lightingJourney` outputs monitor, lamp, guided light and room power with final reveal only after 94%.

- [ ] **Step 1: Write the failing test**

Require `initialAmbient`, `guidedLight`, `monitorPower`, `lampPower`, `roomPower`, and `smoothstep(.94,1.,j)`.

- [ ] **Step 2: Verify red**

Run: `node --test tests/home-experience.test.js`
Expected: FAIL for any missing staged-lighting requirement.

- [ ] **Step 3: Implement staged lighting**

Set a dim neutral initial ambient sufficient to reveal silhouettes and material edges. During each station, guided light follows the semantic target and local device emissions turn on when relevant. Keep room-wide key lighting near zero until the final reveal, then interpolate it smoothly from 94% to 100%.

- [ ] **Step 4: Verify green**

Run: `node --test tests/home-experience.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: stage hub lighting around semantic objects`

---

### Task 5: Publish, cache-bust and full verification

**Files:**
- Modify: `src/views/home-view.js`
- Modify: `src/app.js`
- Modify: `index.html`

**Interfaces:**
- Publishes version `20260828-13`.

- [ ] **Step 1: Update asset versions**

Change the renderer import and top-level app/index cache-bust values to `20260828-13`.

- [ ] **Step 2: Run the full test suite**

Run: `node --test`
Expected: 0 failures.

- [ ] **Step 3: Commit**

Commit message: `chore: publish semantic cinematic hub v13`

- [ ] **Step 4: Verify GitHub Actions**

Check the Test workflow for the final SHA until `status=completed` and `conclusion=success`.

- [ ] **Step 5: Verify GitHub Pages**

Check the Pages workflow for the final SHA until `status=completed` and `conclusion=success` before claiming deployment is live.
