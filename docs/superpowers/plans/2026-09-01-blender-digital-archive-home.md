# Blender Digital Archive Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the procedural-looking hero mass of the Study Hub homepage with local 3D assets and add a scroll-reversible transformation into a semantic digital archive, while keeping GitHub Pages, privacy, fallback behavior and existing routes intact.

**Architecture:** Keep `home-experience.js` as the scroll/router owner. Add a pure phase resolver plus an `archive-field` visual subsystem; extend the local asset registry to load a compact `studio-core.glb`; mount it over the existing procedural scene so the latter remains fallback and interaction scaffolding. `study-room-renderer.js` forwards the existing `journey` value to the new transformation subsystem and preserves the current shared `#/paths` handoff.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, GLTFLoader, GLSL via Three materials, Node 22 `node:test`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-01-blender-digital-archive-home-design.md`

## Global Constraints

- Zero paid services, backend or runtime API calls.
- No runtime CDN or remote model/texture requests.
- Existing notes, lessons, assessment, progress and route stores are untouched.
- Main scene asset additions stay under 8 MiB and contain no 4K textures.
- WebGL and model load failures retain the current procedural/DOM fallbacks.
- Mobile preserves the narrative with a lower particle/fragment budget.
- `prefers-reduced-motion` preserves navigation and disables aggressive motion.

---

### Task 1: Lock the new architecture with failing tests

**Files:**
- Create: `tests/home-digital-archive-v27.test.js`
- Read only: `src/home/scene/asset-registry.js`
- Read only: `src/home/scene/study-room-renderer.js`

**Interfaces:**
- Consumes: existing repository source files.
- Produces: acceptance tests for `resolveArchivePhase`, `resolveArchiveBudget`, `studio-core.glb`, local-only loading, archive renderer integration and preserved paths handoff.

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolveArchivePhase, resolveArchiveBudget } from "../src/home/scene/archive-state.js";

test("archive phases are deterministic and reversible", () => {
  assert.equal(resolveArchivePhase(.05).phase, "studio");
  assert.equal(resolveArchivePhase(.55).phase, "destabilize");
  assert.equal(resolveArchivePhase(.72).phase, "fragment");
  assert.equal(resolveArchivePhase(.9).phase, "archive");
  assert.equal(resolveArchivePhase(.99).phase, "handoff");
  assert.deepEqual(resolveArchivePhase(.72), resolveArchivePhase(.72));
});

test("archive budget adapts to profile and mobile", () => {
  assert.ok(resolveArchiveBudget({ profile: "high", mobile: false }).particles > resolveArchiveBudget({ profile: "low", mobile: true }).particles);
});

test("studio core is local and bounded", () => {
  const path = "assets/3d/studio-core/studio-core.glb";
  assert.ok(existsSync(path));
  assert.ok(statSync(path).size < 8 * 1024 * 1024);
});

test("runtime mounts the local studio core and archive field", () => {
  const registry = readFileSync("src/home/scene/asset-registry.js", "utf8");
  const renderer = readFileSync("src/home/scene/study-room-renderer.js", "utf8");
  assert.match(registry, /studio-core\/studio-core\.glb/);
  assert.doesNotMatch(registry, /https?:\/\//i);
  assert.match(renderer, /archiveField\.update/);
  assert.match(renderer, /room\.setJourney/);
  assert.match(renderer, /future-paths/);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/home-digital-archive-v27.test.js`  
Expected: FAIL because `archive-state.js` and `studio-core.glb` do not exist.

- [ ] **Step 3: Commit only spec, plan and failing test**

Commit message: `test: define digital archive home contract`.

---

### Task 2: Add pure transformation state and quality budgets

**Files:**
- Create: `src/home/scene/archive-state.js`
- Test: `tests/home-digital-archive-v27.test.js`

**Interfaces:**
- Produces: `resolveArchivePhase(progress) -> { phase, studio, knowledge, destabilize, fragment, archive, handoff }`
- Produces: `resolveArchiveBudget({ profile, mobile }) -> { particles, fragments, connections }`

- [ ] **Step 1: Implement clamped smooth ranges and phase thresholds**

Use thresholds matching the approved spec: studio 0–.18, knowledge .18–.48, destabilize .48–.64, fragment .64–.82, archive .82–.96, handoff .96–1. Intensities are smoothstep 0–1 values and are derived only from the input progress.

- [ ] **Step 2: Implement quality budgets**

Desktop budgets: high `particles=420, fragments=96, connections=10`; balanced `260, 64, 8`; low `140, 36, 6`. Mobile applies a 0.58 multiplier to particles/fragments and caps connections at 6.

- [ ] **Step 3: Verify focused tests**

Run: `node --test tests/home-digital-archive-v27.test.js`  
Expected: phase/budget assertions pass; asset/runtime assertions still fail.

- [ ] **Step 4: Commit**

Commit message: `feat: add reversible archive phase model`.

---

### Task 3: Add a compact local studio-core GLB and Blender-compatible source

**Files:**
- Create: `assets/3d/studio-core/studio-core.glb`
- Create: `scripts/blender/build-studio-core.py`
- Modify: `assets/3d/ATTRIBUTION.md`
- Modify: `src/home/scene/asset-registry.js`
- Modify: `src/home/scene/renderer-setup.js`

**Interfaces:**
- `assetRegistry.loadStudioCore() -> Promise<Object3D|null>` with the existing finite timeout policy.
- `renderer-setup` mounts the loaded object, scales/positions it to the procedural room and keeps fallback geometry visible until successful load.

- [ ] **Step 1: Produce the local model**

The model contains named objects for `studio-desk`, `studio-monitor`, `studio-chair`, `studio-books`, `studio-keyboard`, `studio-mug`. Geometry uses bevelled silhouettes and physically meaningful material slots. Keep file below 8 MiB.

- [ ] **Step 2: Add reproducible Blender source script**

`scripts/blender/build-studio-core.py` creates equivalent named meshes/materials and exports `assets/3d/studio-core/studio-core.glb` when run from Blender with:

```bash
blender --background --python scripts/blender/build-studio-core.py
```

- [ ] **Step 3: Extend local asset registry**

Add `STUDIO_CORE_MODEL = new URL("../../../assets/3d/studio-core/studio-core.glb", import.meta.url).href` and a shared timeout loader used by both `loadStudioCore()` and `loadDeskLamp()`.

- [ ] **Step 4: Mount as hero geometry with fallback**

In `renderer-setup.js`, load the studio core asynchronously, tune shadows/material color-space, position it over the main desk area, and hide only the corresponding procedural hero group after successful load. A failed model leaves the current room unchanged.

- [ ] **Step 5: Verify focused tests**

Run: `node --test tests/home-assets-v25.test.js tests/home-realism-pipeline.test.js tests/home-digital-archive-v27.test.js`.

- [ ] **Step 6: Commit**

Commit message: `feat: add local studio core asset pipeline`.

---

### Task 4: Build and integrate the semantic digital archive

**Files:**
- Create: `src/home/scene/archive-field.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/renderer-setup.js`
- Modify: `src/home/scene/lighting-controller.js`

**Interfaces:**
- `createArchiveField({ THREE, stations, quality, mobile }) -> { group, update(progress, state), setBudget(budget), dispose() }`
- `archiveField.update(journey, resolveArchivePhase(journey))` runs every rendered frame.

- [ ] **Step 1: Create nuclei from real station IDs**

Create five nuclei for `future-paths`, `memory`, `progress`, `assessment`, and the available search station/route metadata. Each nucleus stores its station id in `userData.stationId`. `future-paths` is the largest and final camera target.

- [ ] **Step 2: Create deterministic particles and connections**

Use a seeded pseudo-random function so the same session/progress yields stable geometry. Use one `THREE.Points` object and one `THREE.LineSegments` object; avoid one mesh per particle.

- [ ] **Step 3: Animate physical-to-digital visibility**

During destabilize/fragment, move hero objects outward according to mass categories and fade archive elements in. During archive, room opacity/visibility is reduced while semantic nuclei become dominant. Reverse scroll applies the exact inverse state because all transforms are derived from `journey`.

- [ ] **Step 4: Integrate adaptive budgets**

On quality profile changes or layout changes, apply `resolveArchiveBudget({ profile: quality.profile, mobile: cameraLayout === "mobile" })`.

- [ ] **Step 5: Integrate lighting**

Keep existing cumulative physical lighting through knowledge, transition toward cool archive light during destabilize, and do not black out the room before archive elements are readable.

- [ ] **Step 6: Verify focused tests**

Run: `node --test tests/home-digital-archive-v27.test.js tests/home-lighting.test.js tests/home-quality.test.js tests/home-mobile-cinematic.test.js tests/home-exit-journey.test.js`.

- [ ] **Step 7: Commit**

Commit message: `feat: transform studio into semantic archive`.

---

### Task 5: Deployment-safe cache bust and full verification

**Files:**
- Modify: touched home module import query strings from `20260901-26` to a single new version.
- Modify: `index.html` only if required by deployment tests.
- Test: entire `tests/` directory.

**Interfaces:**
- Existing `mountHomeExperience`, router and shared paths transition signatures remain unchanged.

- [ ] **Step 1: Update cache version consistently**

Use one version token for all touched home imports so GitHub Pages/Safari cannot retain the previous scene modules.

- [ ] **Step 2: Run the complete suite**

Run: `node --test`  
Expected: all tests pass, zero failures.

- [ ] **Step 3: Run secret scan**

Run: `node scripts/check-secrets.mjs`  
Expected: exit 0.

- [ ] **Step 4: Open PR and verify GitHub Actions**

Create a PR from `feat/blender-digital-archive-home` to `main`; confirm the Test workflow succeeds.

- [ ] **Step 5: Merge only after green verification**

Merge into `main` after tests are green; GitHub Pages then serves the new home from the normal deployment path.
