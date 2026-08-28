# Realistic Semantic Study Hub Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the synthetic raymarched homepage with a realistic, lightweight 3D study room whose physical stations expose the real Study Hub functions and transition coherently into their routes.

**Architecture:** A pinned local Three.js module renders a small procedural scene made from real mesh geometry. Semantic station data remains independent from rendering and feeds both the accessible DOM interface and the 3D displays; separate controllers own camera, cumulative lighting, adaptive quality, interactions, and route transitions.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, WebGL2 with a complete DOM fallback for WebGL1-only or unavailable clients, CSS View Transitions with CSS fallback, Node `node:test`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-28-realistic-semantic-home-design.md`

## Global Constraints

- No backend, paid API, CDN, or required remote runtime dependency.
- Load the 3D engine only on the homepage; every route must remain functional without WebGL.
- Keep the room to approximately 15–20 convincing objects; do not add decorative planets, torus shapes, cylinders, floating UI, or unrelated sci-fi props.
- Use five or six semantic stations and keep direct access to Lesson, Paths, Search, Review, and Progress visible.
- The first frame must be dark but readable, with a front three-quarter camera and an unobstructed main monitor.
- Lights are cumulative; general room lighting is activated only in the final stage.
- Cinematic route transitions last 400–900 ms; reduced motion navigates almost immediately.
- Cap device pixel ratio, adapt quality, avoid large textures, and suspend rendering when hidden.
- Preserve lessons, notes, assessment, progress, Focus mode, Safari asset versioning, and all existing routes.
- All feature work happens in an isolated worktree created with `superpowers:using-git-worktrees`.

---

## File Map

### Existing files modified

- `src/views/home-view.js` — assemble the accessible homepage shell from semantic data and mount/unmount the 3D experience.
- `src/app.js` — expose a controlled route-navigation callback to cinematic transitions and guarantee teardown before replacing views.
- `src/router.js` — add one programmatic hash navigation helper without duplicating route parsing.
- `styles/home-immersive.css` — realistic stage, cinematic captions, quick navigation, fallback, responsive and reduced-motion rules.
- `index.html` — load the new homepage stylesheet and advance the shared Safari asset token once.
- `package.json` — pin Three.js 0.185.1 for reproducible vendoring and add the vendor verification script.

### New source files

- `src/home/home-stations.js` — convert real Study Hub state into six semantic station records.
- `src/home/home-experience.js` — lifecycle coordinator; lazy-load renderer, connect timeline, DOM, interactions and teardown.
- `src/home/scene/build-room.js` — construct room shell and believable physical objects.
- `src/home/scene/materials.js` — procedural PBR-like wood, metal, fabric, wall, floor and screen materials.
- `src/home/scene/screen-ui.js` — draw real lesson, notes, SMM, assessment and progress summaries into small canvas textures.
- `src/home/scene/camera-timeline.js` — declarative shot anchors and continuous interpolation.
- `src/home/scene/lighting-controller.js` — cumulative light state from journey progress.
- `src/home/scene/interaction-controller.js` — restrained hover, picking and pointer parallax.
- `src/home/scene/quality-controller.js` — DPR cap, adaptive quality and page visibility behavior.
- `src/home/scene/study-room-renderer.js` — Three.js renderer lifecycle and public scene API.
- `src/home/home-transition-manager.js` — shared visual transition into router destinations.
- `vendor/three/three.module.min.js` — exact Three.js 0.185.1 browser module copied from the installed package.
- `vendor/three/LICENSE` — upstream MIT license.
- `scripts/vendor-three.mjs` — reproducibly copy and verify the pinned browser module and license.

### New tests

- `tests/home-stations.test.js`
- `tests/home-view.test.js`
- `tests/home-camera-timeline.test.js`
- `tests/home-lighting.test.js`
- `tests/home-materials.test.js`
- `tests/home-screen-ui.test.js`
- `tests/home-quality.test.js`
- `tests/home-transition.test.js`
- `tests/home-scene-semantics.test.js`
- `tests/home-deployment.test.js`

---

### Task 1: Freeze the public homepage baseline and vendor the renderer

**Files:**
- Create: `docs/superpowers/evidence/2026-08-28-public-home-baseline.md`
- Create: `scripts/vendor-three.mjs`
- Create: `vendor/three/three.module.min.js`
- Create: `vendor/three/LICENSE`
- Modify: `package.json`
- Test: `tests/home-deployment.test.js`

**Interfaces:**
- Consumes: public assets `src/views/home-view.js?v=20260828-14`, `src/home/study-hub-webgl.js?v=20260828-14`, `styles/home-immersive.css?v=20260828-14`.
- Produces: `npm run vendor:three`; local import URL `../../vendor/three/three.module.min.js`; an evidence file recording SHA-256 hashes of the recovered public baseline.

- [ ] **Step 1: Create an isolated execution worktree**

Run from the repository root using the `superpowers:using-git-worktrees` skill. Base the branch `feature/realistic-semantic-home` on the newest trusted commit that contains both the SMM-01 deep-learning work and the recovered homepage baseline. Do not merge or overwrite remote `main` during this step.

- [ ] **Step 2: Recover and hash the three public homepage assets**

Run:

```bash
mkdir -p .recovery/home-20260828-14
curl -L --fail --silent --show-error 'https://matteo1234ay.github.io/study-hub-v3/src/views/home-view.js?v=20260828-14' > .recovery/home-20260828-14/home-view.js
curl -L --fail --silent --show-error 'https://matteo1234ay.github.io/study-hub-v3/src/home/study-hub-webgl.js?v=20260828-14' > .recovery/home-20260828-14/study-hub-webgl.js
curl -L --fail --silent --show-error 'https://matteo1234ay.github.io/study-hub-v3/styles/home-immersive.css?v=20260828-14' > .recovery/home-20260828-14/home-immersive.css
shasum -a 256 .recovery/home-20260828-14/*
```

Record the URLs, hashes, current public asset token, observed canvas CSS size/internal size, and horizontal overflow in `docs/superpowers/evidence/2026-08-28-public-home-baseline.md`. The recovery directory remains untracked evidence; the document is committed.

- [ ] **Step 3: Write the failing vendor test**

Add to `tests/home-deployment.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Three.js is pinned and vendored locally with its license", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  assert.equal(pkg.dependencies.three, "0.185.1");
  const moduleText = await readFile(new URL("../vendor/three/three.module.min.js", import.meta.url), "utf8");
  const license = await readFile(new URL("../vendor/three/LICENSE", import.meta.url), "utf8");
  assert.match(moduleText, /WebGLRenderer/);
  assert.match(license, /MIT License/);
});
```

- [ ] **Step 4: Run the test and verify RED**

Run: `node --test tests/home-deployment.test.js`
Expected: FAIL because `package.json` does not pin Three.js and the vendor files do not exist.

- [ ] **Step 5: Pin and vendor Three.js reproducibly**

Set in `package.json`:

```json
{
  "dependencies": { "three": "0.185.1" },
  "scripts": {
    "vendor:three": "node scripts/vendor-three.mjs"
  }
}
```

Implement `scripts/vendor-three.mjs` with `copyFile`, `mkdir`, and `readFile` from `node:fs/promises`. Copy `node_modules/three/build/three.module.min.js` and `node_modules/three/LICENSE` to `vendor/three/`, and throw unless `package.json` contains exactly `0.185.1`.

Run:

```bash
npm install
npm run vendor:three
node --test tests/home-deployment.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit the reproducible baseline**

```bash
git add package.json package-lock.json scripts/vendor-three.mjs vendor/three docs/superpowers/evidence/2026-08-28-public-home-baseline.md tests/home-deployment.test.js
git commit -m "build: freeze home baseline and vendor Three.js"
```

---

### Task 2: Model the six stations from real Study Hub state

**Files:**
- Create: `src/home/home-stations.js`
- Test: `tests/home-stations.test.js`

**Interfaces:**
- Consumes: `PATHS`, `findLesson`, and `{ lastPosition, reviewItems?, progress? }` from existing stores.
- Produces: `createHomeStations({ paths, lastPosition, findLessonById }) -> Station[]`; each `Station` has `{ id, label, title, description, href, objectId, status, screenKind, quickAction }`.

- [ ] **Step 1: Write failing semantic mapping tests**

Create fixtures with one active SMM path, three empty paths, and last position `SMM-01/misurare-cio-che-conta`. Assert exactly these IDs and routes:

```js
assert.deepEqual(stations.map(({ id }) => id), [
  "desk", "memory", "social", "assessment", "progress", "future-paths"
]);
assert.equal(stations[0].href, "#/lessons/SMM-01/misurare-cio-che-conta");
assert.equal(stations[1].href, "#/review");
assert.equal(stations[2].href, "#/paths/smm");
assert.equal(stations[3].href, "#/paths/smm/assessment");
assert.equal(stations[4].href, "#/progress");
assert.equal(stations[5].href, "#/paths");
assert.equal(stations[5].status, "standby");
```

Also assert that missing history falls back to `#/lessons/SMM-01` and unknown lessons never generate an invalid route.

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test tests/home-stations.test.js`
Expected: FAIL with module-not-found for `src/home/home-stations.js`.

- [ ] **Step 3: Implement the station factory**

Use a frozen record for stable visual identity and derive titles/details from supplied state. Do not import DOM or Three.js. Export:

```js
export function createHomeStations({ paths, lastPosition, findLessonById })
export const HOME_QUICK_ACTIONS = Object.freeze([
  { id: "lesson", label: "Continua", href: "dynamic" },
  { id: "paths", label: "Percorsi", href: "#/paths" },
  { id: "search", label: "Cerca", href: "#/search" },
  { id: "review", label: "Ripasso", href: "#/review" },
  { id: "progress", label: "Progressi", href: "#/progress" }
]);
```

Return new objects so renderers cannot mutate shared configuration.

- [ ] **Step 4: Run the focused and full tests**

Run:

```bash
node --test tests/home-stations.test.js
npm test
```

Expected: both commands PASS.

- [ ] **Step 5: Commit**

```bash
git add src/home/home-stations.js tests/home-stations.test.js
git commit -m "feat: model semantic home stations"
```

---

### Task 3: Build the accessible DOM homepage and no-WebGL fallback

**Files:**
- Modify: `src/views/home-view.js`
- Create: `src/home/home-experience.js`
- Create: `styles/home-immersive.css`
- Modify: `index.html`
- Test: `tests/home-view.test.js`

**Interfaces:**
- Consumes: `createHomeStations(...)`, `HOME_QUICK_ACTIONS`, existing `element()` helper, study-store state.
- Produces: `renderHomeView({ mountExperience? } = {}) -> HTMLElement`; `mountHomeExperience(root, { stations, navigate }) -> Promise<() => void>`.

- [ ] **Step 1: Write failing DOM structure tests**

Test source-level and lightweight fake-DOM invariants already used elsewhere in the suite. Assert:

```js
assert.match(source, /home-quick-actions/);
assert.match(source, /aria-label:\s*"Accesso rapido"/);
assert.match(source, /home-fallback/);
assert.match(source, /data-station-id/);
assert.match(source, /mountHomeExperience/);
```

Assert the five quick action routes and six station links are present through `createHomeStations`, not duplicated literals.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/home-view.test.js`
Expected: FAIL because the current view has neither fallback nor quick actions.

- [ ] **Step 3: Implement the progressive-enhancement shell**

Render in this order:

```html
<section class="home-journey" data-home-state="loading">
  <div class="home-stage">
    <canvas class="study-room-canvas" aria-hidden="true"></canvas>
    <div class="home-fallback">...</div>
    <nav class="home-quick-actions" aria-label="Accesso rapido">...</nav>
    <div class="home-captions">...</div>
    <div class="home-progress" aria-hidden="true">...</div>
  </div>
</section>
```

The fallback includes the continue action and all functional routes. Canvas stays `aria-hidden`; DOM carries meaning and keyboard focus. Call `mountHomeExperience` inside `queueMicrotask`, set `data-home-state="ready"` only after successful renderer initialization, and retain `data-home-state="fallback"` on rejection.

- [ ] **Step 4: Add stable, responsive layout CSS**

Define `overflow-x: clip` on `.home-journey`, never globally hide overflow. Use `100svh`, fixed stage, readable initial fallback, captions with minimum dwell, a visible quick-action rail, mobile reflow under `760px`, and reduced-motion rules that remove sticky scroll travel.

- [ ] **Step 5: Version the new stylesheet and run tests**

Add `styles/home-immersive.css?v=<shared-new-token>` to `index.html`; the exact token is assigned only once in Task 10 across the module graph.

Run:

```bash
node --test tests/home-view.test.js tests/home-stations.test.js
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/home-view.js src/home/home-experience.js styles/home-immersive.css index.html tests/home-view.test.js
git commit -m "feat: add accessible semantic home shell"
```

---

### Task 4: Create believable materials and physical room geometry

**Files:**
- Create: `src/home/scene/materials.js`
- Create: `src/home/scene/build-room.js`
- Test: `tests/home-materials.test.js`
- Test: `tests/home-scene-semantics.test.js`

**Interfaces:**
- Consumes: vendored Three.js module.
- Produces: `createRoomMaterials(THREE) -> RoomMaterials`; `buildStudyRoom({ THREE, materials }) -> { group, stations, occlusionAudit, dispose }`.
- `stations` maps `desk`, `memory`, `social`, `assessment`, `progress`, `future-paths` to `{ anchor, target, hitArea, screen?, lights[] }`.

- [ ] **Step 1: Write failing material and geometry contract tests**

Assert source exports, required material names, explicit roughness ranges, semantic station IDs, and prohibited primary prop names:

```js
assert.deepEqual(Object.keys(materials).sort(), [
  "fabric", "floor", "glassOff", "metal", "wall", "wood"
]);
assert.ok(materials.wood.roughness >= 0.45);
assert.ok(materials.fabric.roughness >= 0.8);
assert.deepEqual(Object.keys(room.stations).sort(), [
  "assessment", "desk", "future-paths", "memory", "progress", "social"
]);
assert.doesNotMatch(source, /planet|decorativeTorus|floatingSphere/i);
```

Use a minimal fake `THREE` factory in unit tests; do not require a browser WebGL context.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/home-materials.test.js tests/home-scene-semantics.test.js`
Expected: FAIL because both scene modules are missing.

- [ ] **Step 3: Implement procedural materials**

Use `MeshStandardMaterial`/`MeshPhysicalMaterial` with small generated `CanvasTexture` maps (maximum 256×256): wood grain, subtle wall noise, floor roughness and fabric weave. Use `colorSpace = SRGBColorSpace`, correct texture repeat, anisotropy capped at 4, and a shared disposal registry. Screen glass uses clearcoat/Fresnel-compatible physical settings and zero emissive intensity while off.

- [ ] **Step 4: Build the room with real mesh assemblies**

Create focused helpers inside `build-room.js`:

```js
buildDesk();
buildErgonomicChair();
buildArticulatedLamp();
buildMainMonitor();
buildMemoryWall();
buildSocialDisplay();
buildAssessmentConsole();
buildProgressDisplay();
buildFutureArchive();
```

Use beveled profiles or layered boxes so tabletop, monitor bezels, supports, shelves, books, binders, keyboard and mug have thickness and attachments. Keep the chair to camera-right and calculate `occlusionAudit.mainMonitorClear = true` from projected bounding boxes at the opening shot.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --test tests/home-materials.test.js tests/home-scene-semantics.test.js
npm test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/home/scene/materials.js src/home/scene/build-room.js tests/home-materials.test.js tests/home-scene-semantics.test.js
git commit -m "feat: build realistic semantic study room"
```

---

### Task 5: Render truthful interface content onto room displays

**Files:**
- Create: `src/home/scene/screen-ui.js`
- Modify: `src/home/scene/build-room.js`
- Test: `tests/home-screen-ui.test.js`

**Interfaces:**
- Consumes: `Station[]`, normalized lesson/progress/assessment summaries, a 2D canvas factory.
- Produces: `createStationScreen({ station, data, canvasFactory }) -> { canvas, update(nextData), dispose() }`.

- [ ] **Step 1: Write failing screen content tests**

Use a recording canvas context. Assert each screen draws its required semantic vocabulary:

```js
assert.match(record("desk"), /SMM-01|Continua|Capitolo|%/);
assert.match(record("memory"), /Note|Ripasso|Da consolidare/);
assert.match(record("social"), /Reach|Impression|Watch time|Retention/);
assert.match(record("assessment"), /Domanda|Risposta|Avanzamento/);
assert.match(record("progress"), /Competenze|Completamento|Consolidare/);
assert.match(record("future-paths"), /In preparazione|Standby/);
```

Also assert the generated canvas never exceeds 512×512.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/home-screen-ui.test.js`
Expected: FAIL because `screen-ui.js` does not exist.

- [ ] **Step 3: Implement small procedural screen layouts**

Draw high-contrast but subdued Study Hub interfaces with typography, spacing, charts and labels. Never draw generic unlabeled rectangles as the main content. The social screen includes a feed thumbnail grid, reach/impression comparison, watch-time timeline and retention curve. `update()` redraws only when normalized data changes.

- [ ] **Step 4: Connect textures to physical screens**

In `build-room.js`, assign each returned canvas to a `CanvasTexture`, enable emission only through lighting state, and expose screen update handles in each station record.

- [ ] **Step 5: Verify and commit**

Run:

```bash
node --test tests/home-screen-ui.test.js tests/home-scene-semantics.test.js
npm test
```

Expected: PASS.

```bash
git add src/home/scene/screen-ui.js src/home/scene/build-room.js tests/home-screen-ui.test.js tests/home-scene-semantics.test.js
git commit -m "feat: render truthful UI on study room displays"
```

---

### Task 6: Implement cinematic camera and cumulative lighting

**Files:**
- Create: `src/home/scene/camera-timeline.js`
- Create: `src/home/scene/lighting-controller.js`
- Test: `tests/home-camera-timeline.test.js`
- Test: `tests/home-lighting.test.js`

**Interfaces:**
- Produces: `createCameraTimeline({ shots }) -> { sample(progress), activeStation(progress) }`.
- `sample(progress)` returns `{ position:[x,y,z], target:[x,y,z], fov, stationId, settled }`.
- Produces: `createLightingController(lightRig) -> { sample(progress), apply(progress) }`.
- `sample(progress)` returns `{ ambient, desk, memory, social, assessment, progress, future, room }` intensities.

- [ ] **Step 1: Write failing opening and continuity tests**

Assert the opening shot is front-left three-quarter, the target is the main monitor, chair clearance exceeds the tested margin, all progress samples are finite, adjacent samples do not jump beyond thresholds, and every station has a settled interval.

```js
const opening = timeline.sample(0);
assert.ok(opening.position[0] < 0);
assert.ok(opening.position[2] > 0);
assert.equal(opening.stationId, "desk");
assert.ok(opening.monitorVisible);
```

- [ ] **Step 2: Write failing cumulative light tests**

For progress samples `[0, .22, .38, .54, .68, .80, .90, 1]`, assert no activated station intensity decreases, `ambient > 0` at zero, and `room === 0` before `.94`.

- [ ] **Step 3: Run tests and verify RED**

Run: `node --test tests/home-camera-timeline.test.js tests/home-lighting.test.js`
Expected: FAIL because both modules are missing.

- [ ] **Step 4: Implement declarative shots**

Define six shots with explicit `enter`, `settleStart`, `settleEnd`, `exit`, position, target and FOV. Use cubic Hermite or smoothstep interpolation for position and target; clamp progress and return exact settled anchors during dwell intervals.

- [ ] **Step 5: Implement cumulative lighting**

Use threshold activation with smoothstep ramps. `apply()` updates ambient/fill, warm desk lamp, cool screen spills and final room lights. Shadows stay enabled only on the desk key and current guided light; already activated lights remain visible without all casting shadows.

- [ ] **Step 6: Verify and commit**

Run:

```bash
node --test tests/home-camera-timeline.test.js tests/home-lighting.test.js
npm test
```

Expected: PASS.

```bash
git add src/home/scene/camera-timeline.js src/home/scene/lighting-controller.js tests/home-camera-timeline.test.js tests/home-lighting.test.js
git commit -m "feat: add cinematic camera and cumulative lighting"
```

---

### Task 7: Add adaptive rendering, restrained interaction and lifecycle cleanup

**Files:**
- Create: `src/home/scene/quality-controller.js`
- Create: `src/home/scene/interaction-controller.js`
- Create: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/home-experience.js`
- Test: `tests/home-quality.test.js`
- Modify: `tests/home-scene-semantics.test.js`

**Interfaces:**
- Produces: `createQualityController({ devicePixelRatio, reducedMotion }) -> { profile, recordFrame(ms), setVisible(value), getDprCap() }`.
- Produces: `createInteractionController({ canvas, camera, stations, onActivate }) -> { update(), dispose() }`.
- Produces: `createStudyRoomRenderer({ canvas, stations, reducedMotion, onActivate }) -> Promise<{ setJourney(value), resize(), dispose(), getAudit() }>`.

- [ ] **Step 1: Write failing quality behavior tests**

Assert DPR caps: high `1.5`, balanced `1.25`, low `1`; downgrade after 90 consecutive frames above 24 ms; never upgrade more often than once per 10 seconds; hidden state pauses rendering; reduced motion begins in balanced static mode.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/home-quality.test.js`
Expected: FAIL because the controller is missing.

- [ ] **Step 3: Implement quality and visibility control**

Use an injected clock in tests, a rolling frame average, `visibilitychange`, and `ResizeObserver`. Quality changes adjust DPR, shadow-map size, antialias use and optional micro-details; they never remove semantic objects or DOM functionality.

- [ ] **Step 4: Implement restrained interaction**

Use raycasting only against six explicit `hitArea` objects. Hover changes roughness/emissive intensity subtly and sets a CSS cursor class. Pointer motion contributes no more than `0.012` radians of parallax and never changes the camera target. Keyboard interaction remains on DOM links, not the canvas.

- [ ] **Step 5: Assemble and lazy-load the renderer**

`study-room-renderer.js` dynamically imports `../../../vendor/three/three.module.min.js`, creates renderer/scene/camera, builds the room, and owns one animation loop. `dispose()` cancels frames, removes observers/listeners, disposes geometries/materials/textures, and loses no global application state.

- [ ] **Step 6: Connect journey progress and teardown**

In `home-experience.js`, translate sticky-section scroll into `[0,1]`, update active DOM caption before moving the camera to that station, and expose cleanup when `root.isConnected` becomes false. Reduced motion renders one readable overview and removes extended scroll travel.

- [ ] **Step 7: Verify and commit**

Run:

```bash
node --test tests/home-quality.test.js tests/home-scene-semantics.test.js tests/home-view.test.js
npm test
```

Expected: PASS.

```bash
git add src/home/scene/quality-controller.js src/home/scene/interaction-controller.js src/home/scene/study-room-renderer.js src/home/home-experience.js tests/home-quality.test.js tests/home-scene-semantics.test.js tests/home-view.test.js
git commit -m "feat: add adaptive home renderer lifecycle"
```

---

### Task 8: Add shared visual route transitions without breaking routing

**Files:**
- Create: `src/home/home-transition-manager.js`
- Modify: `src/router.js`
- Modify: `src/app.js`
- Modify: `src/home/home-experience.js`
- Modify: `styles/home-immersive.css`
- Test: `tests/home-transition.test.js`
- Modify: `tests/router.test.js`

**Interfaces:**
- Produces: `navigateToHash(href) -> void` from `src/router.js`.
- Produces: `createHomeTransitionManager({ root, renderer, navigate, reducedMotion }) -> { activate(station), cancel(), dispose() }`.
- Consumes renderer optional method `focusStation(stationId, { duration }) -> Promise<void>`.

- [ ] **Step 1: Write failing router and transition tests**

Assert `navigateToHash("#/progress")` updates only the hash; reject non-`#/` destinations. With fake renderer and navigation, assert:

```js
await manager.activate({ id: "progress", href: "#/progress" });
assert.deepEqual(events, ["focus:progress", "overlay:progress", "navigate:#/progress"]);
```

Assert duration clamps to 400–900 ms, double activation is ignored, Escape/cancel navigates immediately, and reduced motion omits focus/overlay delay.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/home-transition.test.js tests/router.test.js`
Expected: FAIL because transition manager and programmatic navigation are missing.

- [ ] **Step 3: Implement safe programmatic navigation**

Add:

```js
export function navigateToHash(href) {
  if (typeof href !== "string" || !href.startsWith("#/")) return false;
  location.hash = href.slice(1);
  return true;
}
```

Keep `parseRoute` and `startRouter` unchanged apart from exporting this helper.

- [ ] **Step 4: Implement the transition manager**

On activation, focus the physical object, clone its DOM caption into a fixed overlay, use `document.startViewTransition` when available, and call `navigate` once. Use one `AbortController` per activation and a maximum 900 ms safety timeout. Navigation must still happen if rendering or View Transitions fail.

- [ ] **Step 5: Connect DOM links and 3D hit areas**

Intercept only unmodified primary activation on semantic station links. Preserve open-in-new-tab behavior and normal browser semantics. Canvas hit areas call the same station activation path. Quick-action navigation remains immediate unless it targets the currently focused station.

- [ ] **Step 6: Verify and commit**

Run:

```bash
node --test tests/home-transition.test.js tests/router.test.js tests/home-view.test.js
npm test
```

Expected: PASS.

```bash
git add src/home/home-transition-manager.js src/router.js src/app.js src/home/home-experience.js styles/home-immersive.css tests/home-transition.test.js tests/router.test.js tests/home-view.test.js
git commit -m "feat: add cinematic home route transitions"
```

---

### Task 9: Complete responsive, reduced-motion and failure fallbacks

**Files:**
- Modify: `styles/home-immersive.css`
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-view.test.js`
- Modify: `tests/home-quality.test.js`
- Test: `tests/motion-fallback.test.js`

**Interfaces:**
- Consumes: existing internal preference attribute and `prefers-reduced-motion`.
- Produces: `resolveHomeMotionMode({ preference, mediaReduced, width, webgl }) -> "cinematic" | "static-3d" | "dom"`.

- [ ] **Step 1: Write failing mode-resolution tests**

Cover:

```js
assert.equal(resolve({ preference:"reduced", mediaReduced:false, width:1440, webgl:true }), "static-3d");
assert.equal(resolve({ preference:"normal", mediaReduced:true, width:1440, webgl:true }), "static-3d");
assert.equal(resolve({ preference:"normal", mediaReduced:false, width:420, webgl:false }), "dom");
assert.equal(resolve({ preference:"normal", mediaReduced:false, width:1440, webgl:true }), "cinematic");
```

Assert all five quick actions and six station routes remain present in every mode.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/motion-fallback.test.js tests/home-view.test.js`
Expected: FAIL until mode resolution is exported and used.

- [ ] **Step 3: Implement modes and fallback states**

`static-3d` renders the final readable room composition with no scroll-linked camera or parallax. `dom` displays a photographic-style CSS composition built from semantic station content; it never leaves an empty canvas. Any import, shader, context-loss or renderer error switches to `dom` and records one non-sensitive console warning.

- [ ] **Step 4: Finish mobile and overflow CSS**

At widths under `760px`, reduce the stage to one viewport, render captions in normal flow, place quick actions in a horizontally scrollable labelled navigation, and avoid sticky 3D travel. Verify `.home-journey` has `max-width:100%`, `overflow-x:clip`, and no child uses `100vw` plus padding.

- [ ] **Step 5: Verify and commit**

Run:

```bash
node --test tests/motion-fallback.test.js tests/home-view.test.js tests/home-quality.test.js
npm test
```

Expected: PASS.

```bash
git add src/home/home-experience.js src/home/scene/study-room-renderer.js styles/home-immersive.css tests/motion-fallback.test.js tests/home-view.test.js tests/home-quality.test.js
git commit -m "feat: complete accessible home fallbacks"
```

---

### Task 10: Protect deployment, version the complete module graph and verify publicly

**Files:**
- Modify: `index.html`
- Modify: every changed local ES module import token in `src/app.js`, `src/views/home-view.js`, and `src/home/**/*.js`
- Modify: `.github/workflows/*` only if inspection proves a workflow can reset application code.
- Modify: `scripts/sync-published-doc.mjs` only if its scope is not restricted to approved lesson data.
- Modify: `tests/home-deployment.test.js`
- Modify: `tests/published-doc.test.js`

**Interfaces:**
- Produces: one shared asset token across the complete new home module graph; deployment automation that cannot replace homepage application files.

- [ ] **Step 1: Write failing deployment integrity tests**

Extend `tests/home-deployment.test.js` to parse `index.html` and recursively inspect local imports. Assert every changed home asset uses one exact new token and no import retains `20260828-14` or an older token. Assert workflow/sync scripts do not write `src/`, `styles/`, or `index.html`.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/home-deployment.test.js tests/published-doc.test.js`
Expected: FAIL because version tokens are mixed until this task.

- [ ] **Step 3: Apply one shared Safari-safe token**

Choose the release timestamp once, for example `20260828-15`, and update `index.html` plus every import in the changed module graph to that exact token. Do not mechanically alter unrelated stable modules unless they changed in this branch.

- [ ] **Step 4: Restrict automation writes if required**

Inspect every workflow and `scripts/sync-published-doc.mjs`. If any command can restore or overwrite application files, replace its broad copy/checkout behavior with an allowlist limited to approved `data/lessons/*.json` targets and retain editorial protection. Add a test fixture proving `src/views/home-view.js` cannot be selected as a sync target.

- [ ] **Step 5: Run complete static verification**

Run:

```bash
npm test
find src tests scripts -name '*.js' -o -name '*.mjs' | while read -r file; do node --check "$file"; done
git diff --check
```

Expected: all tests PASS, every syntax check exits 0, and `git diff --check` emits no output.

- [ ] **Step 6: Run local visual verification**

Start `npm run serve` and verify with the browser skill at desktop, mobile and reduced-motion sizes:

- first frame room and monitor readable;
- no horizontal overflow;
- five/six stations match captions;
- cumulative lights never regress;
- every quick action works;
- each object transition lands on its correct route;
- Home, Paths, Search, Review, Progress, lesson, assessment and Focus still work;
- console has no application errors;
- canvas internal dimensions match CSS dimensions times capped DPR.

Record results in `docs/superpowers/evidence/2026-08-28-realistic-home-verification.md`.

- [ ] **Step 7: Commit the release candidate**

```bash
git add index.html src styles scripts tests .github docs/superpowers/evidence/2026-08-28-realistic-home-verification.md
git commit -m "release: prepare realistic semantic home preview"
```

- [ ] **Step 8: Publish a preview branch only after explicit authorization**

Push `feature/realistic-semantic-home` without changing `main`. Verify the remote commit and its files through GitHub. Explain that GitHub Pages serves `main`, then obtain explicit permission before advancing `main`.

- [ ] **Step 9: Verify the public deployment after authorization**

After GitHub Pages finishes, repeat the route and visual checks against the public URL in Safari-compatible browser conditions. If public state differs from the verified commit, stop and diagnose deployment/cache automation before claiming completion.

---

## Final Self-Review Checklist

- [ ] Every room object maps to an existing Study Hub route or state.
- [ ] No decorative abstract primitive is used as primary content.
- [ ] The opening camera and monitor-visibility audit are tested.
- [ ] Lighting monotonicity and final-room-light threshold are tested.
- [ ] Real lesson, SMM, assessment and progress content drives displays.
- [ ] No-WebGL, mobile and reduced-motion modes preserve all navigation.
- [ ] Three.js is pinned, local, licensed and loaded only by the homepage.
- [ ] Renderer lifecycle disposes all resources when leaving Home.
- [ ] Shared transitions fail open to normal navigation.
- [ ] Complete asset graph uses one Safari-safe version token.
- [ ] Automation cannot reset application code.
- [ ] Full automated and public visual verification are recorded before completion.
