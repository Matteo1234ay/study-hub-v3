# Study Hub Immersive Home V24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining synthetic/loading-page feel of V23 with a zero-cost, locally hosted, physically plausible Study Hub whose hero props, pointer depth and Home → Paths handoff read as one continuous experience on desktop and mobile.

**Architecture:** Keep the existing six-station semantic Three.js room, camera timelines, route-state contract and adaptive quality controller. Add a first-frame readiness contract, a local asset registry for a very small CC0 glTF/HDRI set with procedural fallbacks, a dedicated multi-layer parallax rig, and a persistent DOM portal that visually bridges the projected 3D Paths display to the HTML `#/paths` page. No backend, remote runtime fetch, paid service or CDN is introduced.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, Three.js example loaders vendored locally, CSS, Node 22 test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-immersive-home-v24-design.md`

## Global Constraints

- Zero recurring cost.
- No paid API, CDN dependency, backend or metered runtime service.
- GitHub Pages remains the deployment target.
- Runtime 3D, texture and environment assets are served only from this repository.
- External assets must be redistribution-compatible; prefer CC0/public-domain and record source/license in `assets/home/ATTRIBUTION.md`.
- Import at most 7 new 3D assets. Target total new Home asset payload: <= 8 MiB; hard cap: <= 12 MiB.
- Initial concrete imported set is intentionally small: one articulated desk lamp model, one stationery/desk-prop model, and one 1K studio HDR environment. Do not import an office chair unless a clearly more realistic lightweight CC0 model fits the existing composition and stays inside the hard budget; otherwise improve the chair procedurally.
- Preserve all six semantic Study Hub stations and all routes.
- Preserve desktop and portrait camera choreography except for small local composition fixes proven by projection tests.
- Preserve user-controlled scroll motion when reduced motion is enabled. Disable pointer/autonomous parallax under reduced motion.
- Pointer parallax is desktop-only, has at least 4 distinct depth responses, and controls no more than 12 scene layers/objects.
- Critical asset preparation must fail open to procedural fallbacks within 6 seconds; one failed imported prop must never break the Home route.
- The automatic route change to `#/paths` may only happen after at least 90% of the final exit choreography has completed.
- Preserve Safari-safe coherent asset versioning. V24 release token is `20260829-24`.
- Preserve the exact source substrings `event.key === "Escape"` and `preferences.update({ focus: false })` in `src/app.js`.
- Every behavior change follows red-green TDD and every task ends with focused tests before commit.

---

### Task 1: Make successful WebGL startup visually atomic

**Files:**
- Modify: `src/views/home-view.js`
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-view.test.js`
- Create: `tests/home-startup.test.js`

**Interfaces:**
- Produces: renderer property `ready: Promise<void>` that resolves after the first successful `renderer.render(scene, camera)`.
- Produces: Home states `loading` → `preparing` → `ready`; `dom` is reserved for unsupported/failed WebGL.
- Consumes: existing `mountHomeExperience(root, { stations, navigate })` and renderer failure callback.

- [ ] **Step 1: Write failing startup-state tests**

Add `tests/home-startup.test.js` with source/behavior contracts that make the current V23 bug explicit:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("successful WebGL startup never exposes the legacy fallback state", async () => {
  const source = await read("src/home/home-experience.js");
  assert.doesNotMatch(source, /root\.dataset\.homeState\s*=\s*["']fallback["'];\s*root\.dataset\.journeyStarted/);
  assert.match(source, /root\.dataset\.homeState\s*=\s*["']preparing["']/);
  assert.match(source, /await\s+renderer\.ready/);
  assert.match(source, /root\.dataset\.homeState\s*=\s*["']ready["']/);
});

test("the renderer exposes first-frame readiness", async () => {
  const source = await read("src/home/scene/study-room-renderer.js");
  assert.match(source, /readyPromise/);
  assert.match(source, /resolveReady/);
  assert.match(source, /renderer\.render\(scene, camera\);[\s\S]*resolveReady/);
});

test("loading and preparing hide fallback copy but DOM failure reveals it", async () => {
  const css = await read("styles/home-immersive.css");
  assert.match(css, /data-home-state="loading"[\s\S]*\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /data-home-state="preparing"[\s\S]*\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /data-home-state="dom"[\s\S]*\.home-fallback/);
});
```

Also change the existing `home-view.test.js` wording/contract from “shell before 3D loads” to “fallback is present in DOM for accessibility but hidden during normal loading”.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
node --test tests/home-startup.test.js tests/home-view.test.js
```

Expected: FAIL because `mountHomeExperience()` still switches immediately to `fallback`, `renderer.ready` does not exist, and loading/preparing CSS does not hide the fallback.

- [ ] **Step 3: Add a cinematic preload shell without duplicating Home content**

In `src/views/home-view.js`, keep `.home-fallback` in the DOM for genuine failure, but add a separate loading element inside `.home-stage`:

```js
const preload = element("div", {
  className: "home-preload",
  attrs: { "aria-live": "polite", "aria-label": "Preparazione Study Hub" }
}, [
  element("span", { className: "home-preload-mark", text: "STUDY HUB" }),
  element("span", { className: "home-preload-line", attrs: { "aria-hidden": "true" } })
]);
```

Place it after the canvas and before `.home-stage-shade`. Keep the root initial state `loading`.

- [ ] **Step 4: Separate loading from failure in the Home mount**

At the beginning of `mountHomeExperience()`:

```js
root.dataset.homeState = "preparing";
root.dataset.journeyStarted = "false";
root.dataset.homeExit = "false";
```

Do not assign `fallback` on the successful WebGL path. Keep the existing unsupported-WebGL branch as `dom`. In `useDomFallback(error)`, continue setting `dom` and preserve all fallback links.

- [ ] **Step 5: Resolve renderer readiness only after a valid render**

Inside `createStudyRoomRenderer()` create a one-shot deferred promise:

```js
let resolveReady;
let rejectReady;
let readySettled = false;
const readyPromise = new Promise((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});
```

Immediately after the first successful `renderer.render(scene, camera)` in `draw()`:

```js
if (!readySettled) {
  readySettled = true;
  resolveReady();
}
```

If initialization throws before return, rethrow as today. If a context-loss occurs before readiness, reject once. Return `ready: readyPromise` from the renderer API.

- [ ] **Step 6: Make Home ready only after first frame**

After renderer construction in `mountHomeExperience()`:

```js
await renderer.ready;
if (disposed || !root.isConnected) return cleanup;
root.dataset.homeState = "ready";
```

Create the transition manager before or after the await as long as click handling is not exposed before `ready`. Remove the old unconditional early `root.dataset.homeState = "ready"`.

- [ ] **Step 7: Style loading/preparing as the same visual world**

Add CSS that keeps the stage dark and stable, hides `.home-fallback`, quick actions, captions and progress during `loading`/`preparing`, and fades `.home-preload` away only in `ready`:

```css
.home-journey[data-home-state="loading"] .home-fallback,
.home-journey[data-home-state="preparing"] .home-fallback {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.home-preload {
  position: absolute;
  inset: 0;
  z-index: 6;
  display: grid;
  place-content: center;
  gap: .8rem;
  background: radial-gradient(circle at 50% 42%, rgba(64, 75, 90, .18), transparent 28%), #090d12;
  transition: opacity 260ms ease, visibility 260ms;
}

.home-journey[data-home-state="ready"] .home-preload,
.home-journey[data-home-state="dom"] .home-preload {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
```

In the mobile media query hide site header/footer for `loading` and `preparing` too, so they do not flash before `homeImmersive` is synchronized.

- [ ] **Step 8: Run focused tests and commit**

Run:

```bash
node --test tests/home-startup.test.js tests/home-view.test.js tests/motion-fallback.test.js
```

Expected: PASS.

Commit:

```bash
git add src/views/home-view.js src/home/home-experience.js src/home/scene/study-room-renderer.js styles/home-immersive.css tests/home-startup.test.js tests/home-view.test.js
git commit -m "fix: make immersive home startup atomic"
```

---

### Task 2: Vendor zero-cost Three loaders and establish the local asset registry

**Files:**
- Modify: `scripts/vendor-three.mjs`
- Create: `src/home/scene/asset-registry.js`
- Create: `scripts/check-home-assets.mjs`
- Create: `assets/home/ATTRIBUTION.md`
- Add: `assets/home/models/desk-lamp.glb`
- Add: `assets/home/models/stationery.glb`
- Add: `assets/home/environment/studio-1k.hdr`
- Add: `vendor/three/examples/jsm/loaders/GLTFLoader.js`
- Add: `vendor/three/examples/jsm/loaders/RGBELoader.js`
- Add: `vendor/three/examples/jsm/utils/BufferGeometryUtils.js`
- Add: `vendor/three/examples/jsm/utils/SkeletonUtils.js`
- Add: `vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js`
- Create: `tests/home-assets.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `HOME_ASSET_MANIFEST` containing local-only descriptors `{ id, type, src, critical, license, fallbackName }`.
- Produces: `createHomeAssetRegistry({ THREE, GLTFLoader, RGBELoader, timeoutMs = 6000 })`.
- Registry methods: `preloadCritical(): Promise<void>`, `getModel(id): Object3D|null`, `getEnvironment(): Texture|null`, `audit(): { importedCount, loadedIds, failedIds }`, `dispose(): void`.
- Produces: `npm run check:home-assets` hard-failing if count, payload, local-path or attribution contracts are violated.

- [ ] **Step 1: Write failing asset-policy tests**

Create `tests/home-assets.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}

test("Home assets are local, attributed and inside the hard payload budget", async () => {
  const root = new URL("../assets/home/", import.meta.url);
  const paths = await walk(root.pathname);
  const models = paths.filter(path => /\.(?:glb|gltf)$/i.test(path));
  const bytes = (await Promise.all(paths.map(path => stat(path)))).reduce((sum, item) => sum + item.size, 0);
  const attribution = await readFile(new URL("../assets/home/ATTRIBUTION.md", import.meta.url), "utf8");

  assert.ok(models.length <= 7, `too many imported 3D assets: ${models.length}`);
  assert.ok(bytes <= 12 * 1024 * 1024, `Home assets exceed 12 MiB: ${bytes}`);
  assert.match(attribution, /CC0|Public Domain/i);
  assert.match(attribution, /desk lamp/i);
  assert.match(attribution, /stationery/i);
  assert.match(attribution, /studio/i);
});

test("runtime manifest never references a remote URL", async () => {
  const source = await readFile(new URL("../src/home/scene/asset-registry.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /src:\s*["']https?:\/\//);
  assert.match(source, /timeoutMs\s*=\s*6000/);
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run:

```bash
node --test tests/home-assets.test.js
```

Expected: FAIL because the asset folder/registry do not exist.

- [ ] **Step 3: Vendor the exact Three.js addons needed by V24**

Extend `scripts/vendor-three.mjs` so `npm run vendor:three` copies these files from `node_modules/three/examples/jsm`:

```text
loaders/GLTFLoader.js
loaders/RGBELoader.js
utils/BufferGeometryUtils.js
utils/SkeletonUtils.js
geometries/RoundedBoxGeometry.js
```

For every copied example module replace bare imports from `"three"` or `'three'` with the correct relative path to `vendor/three/three.module.min.js`. Keep Three pinned to exactly `0.185.1`. Do not introduce another package dependency.

- [ ] **Step 4: Add the three concrete free assets and attribution**

Use redistribution-compatible CC0 assets and commit optimized local copies:

```text
assets/home/models/desk-lamp.glb
assets/home/models/stationery.glb
assets/home/environment/studio-1k.hdr
```

The intended source class is Poly Haven CC0. Record the exact source page, original asset name, author/source, license (`CC0 1.0`), downloaded resolution/variant and local filename in `assets/home/ATTRIBUTION.md`. If an exact candidate fails the <=12 MiB hard budget after optimization, keep the higher-salience lamp + 1K HDR environment and omit the lower-priority stationery asset; do not violate the budget.

- [ ] **Step 5: Implement a fail-open local asset registry**

Create `src/home/scene/asset-registry.js` with a local manifest:

```js
export const HOME_ASSET_MANIFEST = Object.freeze([
  { id: "desk-lamp", type: "gltf", src: "assets/home/models/desk-lamp.glb", critical: true, license: "CC0-1.0", fallbackName: "articulated-desk-lamp" },
  { id: "stationery", type: "gltf", src: "assets/home/models/stationery.glb", critical: false, license: "CC0-1.0", fallbackName: "desk-props" },
  { id: "studio-env", type: "hdr", src: "assets/home/environment/studio-1k.hdr", critical: true, license: "CC0-1.0", fallbackName: null }
]);
```

Resolve URLs with `new URL(`../../../${descriptor.src}`, import.meta.url)` so GitHub Pages subpath deployment remains correct. `preloadCritical()` should use `Promise.allSettled()` plus a 6-second timeout, record failures instead of throwing the whole Home, and return after every critical descriptor either loads or fails. `getModel()` returns a cloned scene when loaded; `getEnvironment()` returns the HDR texture. `dispose()` disposes cached source geometries/materials/textures once.

- [ ] **Step 6: Add an asset-budget checker used locally and in CI**

Create `scripts/check-home-assets.mjs` to:

1. recursively sum bytes under `assets/home`;
2. count `.glb/.gltf` files;
3. fail above 7 models or 12 MiB;
4. print a warning (not failure) above the 8 MiB target;
5. require `ATTRIBUTION.md` entries for every imported model/HDR filename;
6. inspect text `.gltf` files and reject `http://`/`https://` runtime URIs.

Add to `package.json`:

```json
"check:home-assets": "node scripts/check-home-assets.mjs"
```

- [ ] **Step 7: Regenerate vendored files and run focused policy tests**

Run:

```bash
npm run vendor:three
npm run check:home-assets
node --test tests/home-assets.test.js tests/home-deployment.test.js
```

Expected: asset tests PASS; deployment may still expect V23 token until Task 8 and that is acceptable only if its failure is exclusively the release-token contract.

- [ ] **Step 8: Commit**

```bash
git add scripts/vendor-three.mjs scripts/check-home-assets.mjs package.json vendor/three/examples assets/home src/home/scene/asset-registry.js tests/home-assets.test.js
git commit -m "feat: add local realistic home asset pipeline"
```

---

### Task 3: Replace high-salience primitives with hybrid realistic geometry and calibrated environment shading

**Files:**
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/materials.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/lighting-controller.js`
- Modify: `tests/home-materials.test.js`
- Modify: `tests/home-scene-semantics.test.js`
- Modify: `tests/home-renderer-profile.test.js`
- Modify: `tests/home-lighting.test.js`

**Interfaces:**
- Consumes: `createHomeAssetRegistry(...)` from Task 2.
- Changes room constructor to `buildStudyRoom({ THREE, materials, assets = null, RoundedBoxGeometry = null })` while preserving existing station IDs/screens/hit areas.
- Produces room audit fields `realismAudit: { importedProps, roundedProps, environmentReady }`.
- Renderer owns one PMREM environment generated from the local HDR texture and disposes it on teardown.

- [ ] **Step 1: Strengthen realism tests before geometry changes**

Update `tests/home-materials.test.js` so procedural architectural maps may be up to 512 px instead of enforcing <=256, and add distinct ceramic/painted-metal families:

```js
assert.ok(materials.ceramic.roughness >= .3 && materials.ceramic.roughness <= .7);
assert.equal(materials.ceramic.metalness, 0);
assert.ok(materials.paintedMetal.roughness > materials.metal.roughness);
```

Update `tests/home-scene-semantics.test.js`:

```js
assert.ok(room.realismAudit.roundedProps >= 4);
assert.ok(room.group.getObjectByName("ergonomic-chair").userData.silhouetteRefined);
assert.ok(room.group.getObjectByName("main-monitor").userData.silhouetteRefined);
```

Add renderer-source/audit tests that require local environment mapping and imported asset integration but do not require WebGL in Node:

```js
assert.match(rendererSource, /PMREMGenerator/);
assert.match(rendererSource, /scene\.environment/);
assert.match(rendererSource, /createHomeAssetRegistry/);
```

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
node --test tests/home-materials.test.js tests/home-scene-semantics.test.js tests/home-renderer-profile.test.js tests/home-lighting.test.js
```

Expected: FAIL on new material/geometry/environment contracts.

- [ ] **Step 3: Add physically distinct material families**

In `materials.js`, preserve `wood`, `metal`, `fabric`, `glassOff`, `wall`, `floor` and add:

```js
ceramic: new THREE.MeshPhysicalMaterial({
  name: "matte-ceramic",
  color: 0xd8d3c9,
  roughness: .46,
  metalness: 0,
  clearcoat: .12,
  clearcoatRoughness: .55
}),
paintedMetal: new THREE.MeshPhysicalMaterial({
  name: "powder-coated-metal",
  color: 0x25292f,
  roughness: .48,
  metalness: .42,
  clearcoat: .05,
  clearcoatRoughness: .6
})
```

Raise only the architectural maps that visibly benefit to 256–512 px and break obvious mathematical repetition by mixing at least two differently scaled deterministic noise components. Keep normal strength subtle.

- [ ] **Step 4: Integrate imported lamp and desk props behind stable semantic groups**

Do not replace station anchors. In `buildStudyRoom()` create the existing procedural lamp first, then replace its visible children when `assets.getModel("desk-lamp")` succeeds. Keep group name `articulated-desk-lamp` and the existing semantic lamp transform. Normalize imported bounds to the existing lamp’s approximate dimensions before insertion.

For stationery, place the imported group on the desk at the current prop zone. Name its wrapper `desk-props` and mark individual child meshes to cast/receive shadows according to the quality profile supplied by renderer/room configuration.

If either asset is unavailable, keep the procedural fallback with no route failure.

- [ ] **Step 5: Replace obvious box silhouettes without importing more assets**

Use vendored `RoundedBoxGeometry` or small custom curved geometry for the highest-salience procedural objects:

- desk top: rounded/beveled edge radius around 0.035–0.05 room units;
- monitor body/bezel: rounded corners, thinner bezel, separate back shell;
- chair seat/back: rounded geometry with a subtle back curvature/taper; set `chair.userData.silhouetteRefined = true`;
- mug: open-top cylinder/cup silhouette with a torus-like handle; use `materials.ceramic`;
- keyboard/mouse: low rounded bodies instead of sharp boxes.

Set `monitor.userData.silhouetteRefined = true`. Keep hit areas and station target positions unchanged.

- [ ] **Step 6: Add the local HDR environment as reflection/fill, not a visible background**

In renderer initialization:

```js
const pmrem = new THREE.PMREMGenerator(renderer);
const hdr = assets.getEnvironment();
if (hdr) {
  const envTarget = pmrem.fromEquirectangular(hdr);
  scene.environment = envTarget.texture;
}
```

Keep `scene.background` as the designed room background. Use low environment intensity/material response rather than turning the scene into a bright HDR panorama. Store/dispose the PMREM render target and generator.

- [ ] **Step 7: Tighten contact light and shadow behavior without changing composition**

Keep current key/fill directions. Preserve cumulative station lighting. On high profile, hero imported meshes cast shadows; balanced profile receives shadows but uses the existing cheaper setup. Maintain ACES and exposure around the current 1.04 range. Do not add another shadow-casting light.

- [ ] **Step 8: Run realism + composition regression tests**

```bash
node --test tests/home-materials.test.js tests/home-scene-semantics.test.js tests/home-renderer-profile.test.js tests/home-lighting.test.js tests/home-camera-timeline.test.js tests/home-mobile-cinematic-v19.test.js
```

Expected: PASS, including existing 390×844 screen/context bounds and chair occlusion checks.

- [ ] **Step 9: Commit**

```bash
git add src/home/scene/build-room.js src/home/scene/materials.js src/home/scene/study-room-renderer.js src/home/scene/lighting-controller.js tests/home-materials.test.js tests/home-scene-semantics.test.js tests/home-renderer-profile.test.js tests/home-lighting.test.js
git commit -m "feat: make study room props physically plausible"
```

---

### Task 4: Increase screen legibility without sacrificing mobile room context

**Files:**
- Modify: `src/home/scene/screen-ui.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-screen-ui.test.js`
- Modify: `tests/home-mobile-cinematic-v19.test.js`
- Modify: `tests/home-scene-semantics.test.js`

**Interfaces:**
- Produces: `screenSize(screenKind, { active = false } = {})` or equivalent exported resolution policy.
- Produces: screen handle method `setActive(active: boolean): boolean` that redraws only when the effective resolution tier changes.
- Renderer informs exactly one station screen that it is active; inactive screens fall back to base resolution.

- [ ] **Step 1: Write failing readability-tier tests**

Extend `tests/home-screen-ui.test.js`:

```js
test("active screens can use a denser texture without exceeding the memory ceiling", () => {
  const handle = createStationScreen({ station: lessonStation, data, canvasFactory: recordingCanvas });
  const base = [handle.canvas.width, handle.canvas.height];
  assert.equal(handle.setActive(true), true);
  const active = [handle.canvas.width, handle.canvas.height];
  assert.ok(active[0] >= base[0]);
  assert.ok(active[1] >= base[1]);
  assert.ok(active[0] <= 1280);
  assert.ok(active[1] <= 1792);
});
```

Add source/draw assertions that each screen has one dominant primary title and no body font under 15 logical px; Social primary remains >=52 logical px and secondary facts >=28 logical px.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-screen-ui.test.js tests/home-mobile-cinematic-v19.test.js
```

Expected: FAIL because screen handles have no active-resolution tier.

- [ ] **Step 3: Implement two resolution tiers with the same logical layout**

Keep current base canvases (`768×480`, Social `960×1344`). For the active screen use at most:

```text
default active: 1024×640
social active: 1280×1792
```

Keep logical coordinate systems unchanged so typography/layout does not shift. `setActive()` resizes/redraws only when active state changes; do not redraw every animation frame.

- [ ] **Step 4: Simplify any remaining microcopy**

Each screen may show:

1. one primary title/state;
2. one primary metric/progress line;
3. at most 2–3 secondary facts;
4. one short action cue.

Remove decorative labels that become unreadable at the 390×844 projected sizes. Do not make the physical screens larger and do not move the mobile camera closer solely for text.

- [ ] **Step 5: Let renderer switch active texture tier**

During `draw()` after determining `shot.stationId`, compare it with the previous active screen ID and call `physical.screenHandle.setActive(true/false)` only when the active station changes. Mark the corresponding `CanvasTexture.needsUpdate = true` after a redraw.

- [ ] **Step 6: Re-run projection and texture tests**

```bash
node --test tests/home-screen-ui.test.js tests/home-mobile-cinematic-v19.test.js tests/home-scene-semantics.test.js
```

Expected: PASS; existing screen projection maxima remain unchanged because physical geometry/camera remain unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/home/scene/screen-ui.js src/home/scene/build-room.js src/home/scene/study-room-renderer.js tests/home-screen-ui.test.js tests/home-mobile-cinematic-v19.test.js tests/home-scene-semantics.test.js
git commit -m "feat: sharpen active study screens"
```

---

### Task 5: Replace the weak shared offset with Igloo-like independent depth layers

**Files:**
- Create: `src/home/scene/parallax-rig.js`
- Modify: `src/home/scene/interaction-controller.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-parallax.test.js`
- Modify: `tests/motion-fallback.test.js`

**Interfaces:**
- Produces: `createParallaxRig({ layers, maxLayers = 12 })`.
- Layer input shape: `{ object, depth, translation, rotation, damping }` where translation/rotation are `{ x, y }` scalar coefficients.
- Rig methods: `setTarget({ x, y })`, `update(deltaSeconds)`, `reset()`, `restoreImmediately()`, `audit()`.
- `audit()` returns `{ count, depths, damping, maxTranslation, maxRotation }`.
- `createInteractionController()` continues handling hit-testing but now exposes normalized pointer method `getPointerDepth()` and `resetPointerDepth()`; it no longer owns final scene-layer transforms.

- [ ] **Step 1: Replace V23 parallax tests with stronger RED contracts**

Rewrite/extend `tests/home-parallax.test.js` so it requires independent layers:

```js
assert.ok(room.parallaxAudit.count >= 8);
assert.ok(room.parallaxAudit.count <= 12);
assert.ok(new Set(room.parallaxAudit.depths).size >= 4);
assert.ok(new Set(room.parallaxAudit.damping).size >= 3);
```

Create two test objects at different depth/damping values and assert after the same pointer target + several updates that both translation and rotation differ. Assert the strongest layer still stays under approximately 0.08 room units translation and under 0.04 radians rotation. Assert reset eases rather than snaps; `restoreImmediately()` returns exact base transforms.

- [ ] **Step 2: Run parallax tests and confirm RED**

```bash
node --test tests/home-parallax.test.js tests/motion-fallback.test.js
```

Expected: FAIL because V23 has one shared easing state, no per-layer rotations and only base X/Y storage.

- [ ] **Step 3: Implement `parallax-rig.js` with immutable base transforms**

For each layer capture base position and rotation once:

```js
const state = {
  basePosition: object.position.clone(),
  baseRotation: object.rotation.clone(),
  x: 0,
  y: 0
};
```

Clamp normalized target to `[-1, 1]`. In `update(deltaSeconds)` use frame-rate-independent damping:

```js
const alpha = 1 - Math.exp(-layer.damping * Math.max(0, deltaSeconds));
state.x += (targetX - state.x) * alpha;
state.y += (targetY - state.y) * alpha;
```

Apply tiny additive offsets from the immutable bases. Allocate no vectors/Eulers in the per-frame update.

- [ ] **Step 4: Register 8–12 semantic layers with visibly different depth**

Use the current room objects, plus children of imported stationery where available. Recommended groups:

```text
Depth 1.00 / damping 10: review-card-1, loose stationery foreground
Depth 0.78 / damping 8: review-card-3, review-card-5
Depth 0.58 / damping 7: ceramic mug / stationery cup
Depth 0.42 / damping 6: future binder 1/2
Depth 0.28 / damping 5: keyboard, mouse, future binder 3
Depth 0.12 / damping 4: lamp shade / monitor shell (very small rotation only)
```

Keep total registered layers <=12. Shelves, room shell and major furniture remain effectively stationary.

- [ ] **Step 5: Make pointer input stronger but keep object amplitudes physically small**

Change interaction input from the V23 `MAX_PARALLAX=.012` scene-space abstraction to normalized `[-1,1]` pointer depth. The rig owns physical coefficients. Example strongest layer:

```js
translation: { x: .055, y: .035 },
rotation: { x: .018, y: .028 }
```

The camera gets a separate maximum of roughly 0.006–0.01 radians, smaller than any foreground layer.

- [ ] **Step 6: Enforce enable/disable policy in renderer**

Parallax is enabled only when all are true:

```js
!reducedMotion && cameraLayout === "desktop" && exitProgress === 0
```

When false, call `rig.reset()` and continue rendering only while the rig is returning to zero; on reduced-motion mode use `restoreImmediately()` and do not create an autonomous animation loop. Mobile never maps touch/device orientation to parallax.

- [ ] **Step 7: Run focused + regression tests**

```bash
node --test tests/home-parallax.test.js tests/motion-fallback.test.js tests/home-camera-timeline.test.js tests/home-mobile-cinematic-v19.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/home/scene/parallax-rig.js src/home/scene/interaction-controller.js src/home/scene/build-room.js src/home/scene/study-room-renderer.js tests/home-parallax.test.js tests/motion-fallback.test.js
git commit -m "feat: add layered inertial room depth"
```

---

### Task 6: Turn the final runway into a slow three-phase cinematic approach

**Files:**
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/camera-timeline.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/lighting-controller.js`
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-exit-journey.test.js`
- Modify: `tests/home-camera-timeline.test.js`
- Modify: `tests/home-lighting.test.js`

**Interfaces:**
- Produces: `resolveExitChoreography(exitProgress)` returning `{ establish, dolly, handoff }` in `[0,1]`.
- Renderer method `setExitProgress(value)` consumes this choreography and disables pointer parallax immediately when exit begins.
- Renderer method `getPathsProjection(): { left, top, width, height } | null` returns the current projected Paths screen bounds in CSS pixels.

- [ ] **Step 1: Define the final choreography in failing tests**

Extend `tests/home-exit-journey.test.js`:

```js
const start = resolveExitChoreography(0);
const context = resolveExitChoreography(.16);
const approach = resolveExitChoreography(.55);
const handoff = resolveExitChoreography(.92);
assert.equal(start.establish, 0);
assert.ok(context.establish > .5);
assert.equal(context.handoff, 0);
assert.ok(approach.dolly > .25 && approach.dolly < .9);
assert.ok(handoff.handoff > .5);
assert.equal(resolveJourneyPhases(.995, 1440).exitProgress >= .9, true);
```

Also assert `shouldExit` can never become true while `exitProgress < .9`.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-exit-journey.test.js tests/home-camera-timeline.test.js
```

Expected: FAIL because there is no three-phase choreography/projection contract.

- [ ] **Step 3: Implement explicit phase mapping**

In `home-experience.js` export:

```js
export function resolveExitChoreography(value) {
  const p = clamp01(value);
  const smoothRange = (start, end) => {
    const t = clamp01((p - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  return {
    establish: smoothRange(0, .2),
    dolly: smoothRange(.18, .88),
    handoff: smoothRange(.82, 1)
  };
}
```

Keep the physical 140vh desktop / 180vh mobile runway.

- [ ] **Step 4: Make camera exit piecewise rather than one direct interpolation**

Add a context/establish shot between the final station and the existing close Paths shot. Use these starting values and adjust only if projection tests demand a small correction:

```js
const HOME_EXIT_ESTABLISH = {
  position: [0.15, 3.65, 4.6],
  target: [0.45, 2.35, -2.25],
  fov: 41
};
const MOBILE_EXIT_ESTABLISH = {
  position: [-0.45, 3.55, 4.25],
  target: [0.55, 2.55, -2.3],
  fov: 52
};
```

`timeline.exit(progress)` should interpolate final station → establish shot during roughly `0–.22`, then establish → current close exit during `~.18–1`. Maintain continuity at the phase boundary and existing mobile context/occlusion tests.

- [ ] **Step 5: Add final-zone light convergence**

During exit, do not turn previous zone lights off abruptly. Gradually reduce guide-light emphasis elsewhere and raise the Future/Paths practical/screen spill toward a bounded peak. Keep ambient above the existing readable floor. No new blue wash.

- [ ] **Step 6: Expose projected Paths screen bounds**

In renderer, after camera matrices are current, project `room.stations["future-paths"].screen` world bounds to NDC and convert to the canvas CSS rect. Return a clamped rect via `getPathsProjection()`. If the screen is behind the camera or invalid, return `null`.

- [ ] **Step 7: Run final-runway tests**

```bash
node --test tests/home-exit-journey.test.js tests/home-camera-timeline.test.js tests/home-lighting.test.js tests/home-mobile-cinematic-v19.test.js
```

Expected: PASS; camera continuity remains under the existing jump thresholds.

- [ ] **Step 8: Commit**

```bash
git add src/home/home-experience.js src/home/scene/camera-timeline.js src/home/scene/study-room-renderer.js src/home/scene/lighting-controller.js styles/home-immersive.css tests/home-exit-journey.test.js tests/home-camera-timeline.test.js tests/home-lighting.test.js
git commit -m "feat: choreograph slow cinematic paths approach"
```

---

### Task 7: Bridge the 3D Paths screen to the HTML Paths page and preserve reverse travel

**Files:**
- Create: `src/home/home-shared-transition.js`
- Modify: `src/home/home-experience.js`
- Modify: `src/home/home-transition-manager.js`
- Modify: `src/views/paths-view.js`
- Modify: `src/home/paths-return-controller.js`
- Modify: `src/app.js`
- Modify: `styles/home-immersive.css`
- Create: `tests/home-shared-transition.test.js`
- Modify: `tests/home-transition.test.js`
- Modify: `tests/paths-return-controller.test.js`
- Modify: `tests/home-route-state.test.js`

**Interfaces:**
- Produces: `createSharedPathsTransition({ documentTarget = document, reducedMotion = false })`.
- Methods: `begin(rect)`, `update(progress, rect)`, `handoff()`, `receive(root)`, `reverse()`, `dispose()`.
- `begin(rect)` appends a fixed body-level `.paths-shared-portal` so it survives `app.replaceChildren()`.
- `update(progress, rect)` morphs the portal from the projected 3D screen rect to full viewport only during final `handoff` phase.
- `receive(root)` attaches/animates the portal into `.paths-cinematic-receiver` on cinematic entry, then removes the body portal.
- Reduced motion skips autonomous morph duration but preserves route continuity and reverse behavior.

- [ ] **Step 1: Write failing shared-handoff tests**

Create `tests/home-shared-transition.test.js` using a minimal fake document/body. Require:

```js
test("portal starts at the projected 3D screen and survives route replacement", () => {
  const transition = createSharedPathsTransition({ documentTarget: fakeDocument });
  transition.begin({ left: 120, top: 80, width: 420, height: 240 });
  assert.equal(fakeDocument.body.children[0].className, "paths-shared-portal");
  assert.match(fakeDocument.body.children[0].style.transform, /translate/);
});

test("handoff only reaches full viewport near the end", () => {
  transition.update(.5, rect);
  assert.notEqual(portal.dataset.phase, "full");
  transition.update(.95, rect);
  assert.equal(portal.dataset.phase, "full");
});
```

Extend `home-transition.test.js` so automatic exit uses the shared handoff and generic click transitions still use the existing focus/overlay behavior.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-shared-transition.test.js tests/home-transition.test.js tests/paths-return-controller.test.js tests/home-route-state.test.js
```

Expected: FAIL because the shared portal module does not exist.

- [ ] **Step 3: Implement a persistent body-level transition portal**

The portal should contain only a visual surface, not duplicate functional navigation. Style it from the Paths screen palette and content state. Set:

```css
.paths-shared-portal {
  position: fixed;
  z-index: 999;
  pointer-events: none;
  transform-origin: 0 0;
  will-change: transform, border-radius, opacity;
  view-transition-name: paths-portal;
}
```

Use CSS custom properties for start rect and a transform from rect → viewport. Do not animate `left/top/width/height` per frame when transform can do it.

- [ ] **Step 4: Drive the portal from scroll, not a timer**

In `updateJourney()`, when `phases.exitProgress > .82`, ask renderer for `getPathsProjection()`, call `sharedTransition.begin(rect)` once and `sharedTransition.update(choreography.handoff, rect)` each scroll frame. The portal growth therefore reverses naturally when the user scrolls backward before route navigation.

Do not start the route navigation until both are true:

```js
phases.shouldExit && choreography.handoff >= .9
```

- [ ] **Step 5: Render a receiving surface on general Paths**

In `paths-view.js`, prepend:

```js
const receiver = element("div", {
  className: "paths-cinematic-receiver",
  attrs: { "aria-hidden": "true" }
});
```

Only cinematic entries (`createPathsReturnController().active === true`) mark `data-cinematic-entry="true"`. On that path call `sharedTransition.receive(root)`. Normal menu/direct entries do not show or animate the receiver.

- [ ] **Step 6: Keep the existing route-state anti-loop behavior**

Do not replace `markExit`, `consumePathsEntry`, `markReturn`, `consumeHomeResume` or the 5-minute TTL. When returning from top-of-Paths wheel/touch, call `sharedTransition.reverse()` before/while navigating Home. Home still restores around `.95–.97` and keeps `reentryLocked` until the user deliberately moves away.

- [ ] **Step 7: Prevent `app.js` smooth-scroll from fighting a cinematic entry**

Preserve the exact `Escape`/focus preference strings. After `app.replaceChildren(view)`, determine whether `route.name === "paths" && view.dataset.cinematicEntry === "true"`. For cinematic entry use `scrollTo({ top: 0, behavior: "auto" })`; normal routes keep the existing reduced-motion/smooth behavior. Do not change ordinary navigation semantics.

- [ ] **Step 8: Add CSS fallback when View Transitions API is unavailable**

The body-level portal itself is the fallback. If `document.startViewTransition` exists, use `view-transition-name: paths-portal`; otherwise keep the same transform/fade choreography and remove the portal after the receiver is stable. Reduced motion uses immediate/small-opacity handoff, not an autonomous zoom.

- [ ] **Step 9: Run route/handoff/reverse tests**

```bash
node --test tests/home-shared-transition.test.js tests/home-transition.test.js tests/paths-return-controller.test.js tests/home-route-state.test.js tests/home-exit-journey.test.js
```

Expected: PASS, including ordinary Paths entry not installing return behavior and cinematic entry returning Home exactly once.

- [ ] **Step 10: Commit**

```bash
git add src/home/home-shared-transition.js src/home/home-experience.js src/home/home-transition-manager.js src/views/paths-view.js src/home/paths-return-controller.js src/app.js styles/home-immersive.css tests/home-shared-transition.test.js tests/home-transition.test.js tests/paths-return-controller.test.js tests/home-route-state.test.js
git commit -m "feat: bridge cinematic home into paths"
```

---

### Task 8: Publish V24 coherently and verify the exact release commit

**Files:**
- Modify: `tests/home-deployment.test.js`
- Modify: `index.html`
- Modify: all changed Home/Paths ES-module import query tokens
- Modify: `.github/workflows/test.yml`
- Modify: `package.json`
- Modify: `README.md` only if needed to record the local zero-cost asset policy

**Interfaces:**
- Produces: one Safari-safe release token, exactly `20260829-24`, across the changed browser module graph.
- CI runs `node --test`, `npm run check:home-assets`, and `node scripts/check-secrets.mjs`.

- [ ] **Step 1: Turn the release graph test RED first**

Change only:

```js
const RELEASE_TOKEN = "20260829-24";
```

in `tests/home-deployment.test.js`, and extend the graph list to include every new browser module:

```text
src/home/scene/asset-registry.js
src/home/scene/parallax-rig.js
src/home/home-shared-transition.js
src/views/paths-view.js
```

Also assert the vendored Three example modules are local and import the vendored `three.module.min.js` rather than a bare package/runtime CDN.

Run:

```bash
node --test tests/home-deployment.test.js
```

Expected: FAIL because production imports are still V23.

- [ ] **Step 2: Advance every changed browser import to V24 atomically**

Replace `?v=20260829-23` with `?v=20260829-24` through the complete changed graph, including `index.html`, `src/app.js`, Home/Paths views, Home modules, scene modules, vendored addon imports where a query token is used, and any new shared-transition/asset-registry imports.

Do not change non-browser data semantics or route names while doing the version bump.

- [ ] **Step 3: Add asset policy to CI**

Update `.github/workflows/test.yml`:

```yaml
- run: node --test
- name: Check Home asset budget and licenses
  run: npm run check:home-assets
- name: Check for committed secrets
  run: node scripts/check-secrets.mjs
```

- [ ] **Step 4: Run syntax and focused V24 tests**

Run:

```bash
node --check src/home/home-experience.js
node --check src/home/scene/asset-registry.js
node --check src/home/scene/parallax-rig.js
node --check src/home/home-shared-transition.js
node --check src/home/scene/study-room-renderer.js
node --test tests/home-startup.test.js tests/home-assets.test.js tests/home-materials.test.js tests/home-parallax.test.js tests/home-screen-ui.test.js tests/home-exit-journey.test.js tests/home-shared-transition.test.js tests/paths-return-controller.test.js tests/home-deployment.test.js
```

Expected: all PASS.

- [ ] **Step 5: Run the complete local verification suite**

```bash
node --test
npm run check:home-assets
node scripts/check-secrets.mjs
```

Expected: all tests PASS, asset checker reports <=7 models and <=12 MiB hard budget, secret checker prints `Nessun possibile segreto rilevato.`

- [ ] **Step 6: Commit the release**

```bash
git add index.html src styles tests scripts assets vendor package.json package-lock.json .github/workflows/test.yml README.md
git commit -m "feat: publish realistic immersive home v24"
```

- [ ] **Step 7: Verify the exact final SHA in GitHub Actions**

Record the final commit SHA and verify on that exact SHA:

1. `Test` workflow conclusion is `success`;
2. job step `Run node --test` is `success`;
3. `Check Home asset budget and licenses` is `success`;
4. `Check for committed secrets` is `success`;
5. `pages build and deployment` conclusion is `success`.

Do not claim V24 published until both Test and Pages are green on the same final SHA.

- [ ] **Step 8: Perform final non-visual contracts and user visual handoff**

Confirm from source/tests:

- loading path cannot expose legacy fallback before a real failure;
- no runtime asset URL begins with `http://` or `https://`;
- asset attribution exists;
- desktop parallax has >=4 depth responses and <=12 moving layers;
- mobile/reduced-motion parallax is disabled while scroll journey remains active;
- screen projection tests still pass at 390×844;
- route transition only triggers after >=90% exit handoff;
- Paths top-edge reverse returns to the final Home runway and anti-loop remains active.

Then provide the V24 GitHub Pages URL and ask the user to visually verify three perceptual criteria we cannot prove in Node tests: whether the hero props now read as real objects, whether pointer depth feels close to the intended Igloo-like behavior, and whether Home → Paths reads as one continuous cinematic transition.
