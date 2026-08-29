# Study Hub Immersive Home V24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn V23 into a zero-cost, locally hosted Study Hub that loads without flashing the legacy Home, uses physically convincing hero props/materials, has clearly layered Igloo-inspired pointer depth, keeps mobile screens readable, and enters `#/paths` through a reversible cinematic handoff.

**Architecture:** Preserve the existing six semantic stations, desktop/mobile camera timelines, route-state/re-entry logic and adaptive quality system. Add four focused pieces: first-frame readiness, a local CC0 asset registry with procedural fallbacks, an independent parallax rig, and a body-level Paths transition portal that survives the SPA route swap. No backend, CDN, paid service or metered API is introduced.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, vendored Three.js example loaders/geometries, CSS, Node 22 test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-immersive-home-v24-design.md`

## Global Constraints

- Zero recurring cost.
- No paid API, CDN dependency, backend or metered runtime service.
- GitHub Pages remains the deployment target.
- Runtime 3D, texture and environment assets are served only from this repository.
- External assets must be redistribution-compatible; prefer CC0/public-domain and record exact source/license in `assets/home/ATTRIBUTION.md`.
- Import at most 7 new 3D assets. Target total new Home asset payload: <= 8 MiB; hard cap: <= 12 MiB.
- Initial asset set: Poly Haven CC0 `desk_lamp_arm_01`, Poly Haven CC0 `stationery_supplies`, and Poly Haven CC0 `poly_haven_studio` at 1K HDR. If an exact downloaded package is too large, optimize/rescale its local textures or replace it with another CC0 asset in the same semantic category; do not exceed 12 MiB.
- Preserve all six semantic Study Hub stations and all current routes.
- Preserve desktop and portrait camera choreography except for small local composition corrections proven by projection tests.
- Preserve user-controlled scroll motion under reduced motion. Reduced motion disables pointer/autonomous parallax, not scroll-driven camera/light/reveal states.
- Pointer parallax is desktop-only, exposes at least 4 distinct depth responses, and controls at most 12 scene layers/objects.
- Critical asset preparation fails open to procedural fallbacks within 6 seconds. Failure of one imported prop cannot break Home.
- Automatic navigation to `#/paths` happens only after at least 90% of the final exit choreography.
- Preserve the physical final runway: 140vh desktop and 180vh mobile.
- Preserve Safari-safe coherent cache versioning. V24 token: `20260829-24`.
- Preserve exact source substrings `event.key === "Escape"` and `preferences.update({ focus: false })` in `src/app.js`.
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
- Renderer returns `ready: Promise<void>` resolving after the first successful `renderer.render(scene, camera)`.
- Home states are `loading` → `preparing` → `ready`; `dom` is reserved for unsupported/failed WebGL.

- [ ] **Step 1: Write failing startup tests**

Create `tests/home-startup.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("successful WebGL startup never switches to fallback before ready", async () => {
  const source = await read("src/home/home-experience.js");
  assert.doesNotMatch(source, /root\.dataset\.homeState\s*=\s*["']fallback["']/);
  assert.match(source, /root\.dataset\.homeState\s*=\s*["']preparing["']/);
  assert.match(source, /await\s+renderer\.ready/);
  assert.match(source, /root\.dataset\.homeState\s*=\s*["']ready["']/);
});

test("renderer exposes first-frame readiness", async () => {
  const source = await read("src/home/scene/study-room-renderer.js");
  assert.match(source, /readyPromise/);
  assert.match(source, /resolveReady/);
  assert.match(source, /renderer\.render\(scene, camera\);[\s\S]*resolveReady/);
});

test("loading and preparing hide fallback copy while DOM failure can reveal it", async () => {
  const css = await read("styles/home-immersive.css");
  assert.match(css, /data-home-state="loading"[\s\S]*\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /data-home-state="preparing"[\s\S]*\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /data-home-state="dom"/);
});
```

Update the existing first `home-view.test.js` contract: fallback links stay in the DOM for accessibility, but normal `loading`/`preparing` must not visually expose them.

- [ ] **Step 2: Run RED**

```bash
node --test tests/home-startup.test.js tests/home-view.test.js
```

Expected: FAIL because V23 `mountHomeExperience()` still exposes fallback and renderer has no `ready` promise.

- [ ] **Step 3: Add a minimal cinematic preload shell**

In `home-view.js` add inside `.home-stage`:

```js
const preload = element("div", {
  className: "home-preload",
  attrs: { "aria-live": "polite", "aria-label": "Preparazione Study Hub" }
}, [
  element("span", { className: "home-preload-mark", text: "STUDY HUB" }),
  element("span", { className: "home-preload-line", attrs: { "aria-hidden": "true" } })
]);
```

Keep root initial state `loading`. Keep `.home-fallback` in DOM but hidden until a real `dom` failure.

- [ ] **Step 4: Separate preparation from failure**

At mount start use:

```js
root.dataset.homeState = "preparing";
root.dataset.journeyStarted = "false";
root.dataset.homeExit = "false";
```

Unsupported WebGL and `useDomFallback()` continue to set `dom`.

- [ ] **Step 5: Add first-frame readiness to renderer**

Inside `createStudyRoomRenderer()`:

```js
let resolveReady;
let rejectReady;
let readySettled = false;
const readyPromise = new Promise((resolve, reject) => {
  resolveReady = resolve;
  rejectReady = reject;
});
```

Immediately after the first successful render:

```js
renderer.render(scene, camera);
if (!readySettled) {
  readySettled = true;
  resolveReady();
}
```

Reject once if the WebGL context is lost before readiness. Return `ready: readyPromise`.

- [ ] **Step 6: Reveal ready state only after first frame**

After renderer construction:

```js
await renderer.ready;
if (disposed || !root.isConnected) return cleanup;
root.dataset.homeState = "ready";
```

Remove any earlier unconditional `ready` assignment.

- [ ] **Step 7: Style loading/preparing without layout flash**

Add:

```css
.home-journey[data-home-state="loading"] .home-fallback,
.home-journey[data-home-state="preparing"] .home-fallback,
.home-journey[data-home-state="loading"] .home-quick-actions,
.home-journey[data-home-state="preparing"] .home-quick-actions,
.home-journey[data-home-state="loading"] .home-captions,
.home-journey[data-home-state="preparing"] .home-captions {
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
  background: radial-gradient(circle at 50% 42%, rgba(64,75,90,.18), transparent 28%), #090d12;
  transition: opacity 260ms ease, visibility 260ms;
}

.home-journey[data-home-state="ready"] .home-preload,
.home-journey[data-home-state="dom"] .home-preload {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
```

On mobile hide site header/footer for Home `loading`/`preparing` as well as ready immersive mode, so chrome cannot flash before Three initializes.

- [ ] **Step 8: Run GREEN and commit**

```bash
node --test tests/home-startup.test.js tests/home-view.test.js tests/motion-fallback.test.js
git add src/views/home-view.js src/home/home-experience.js src/home/scene/study-room-renderer.js styles/home-immersive.css tests/home-startup.test.js tests/home-view.test.js
git commit -m "fix: make immersive home startup atomic"
```

---

### Task 2: Vendor Three addons and establish a zero-cost local asset pipeline

**Files:**
- Modify: `scripts/vendor-three.mjs`
- Modify: `scripts/check-secrets.mjs`
- Modify: `package.json`
- Create: `scripts/check-home-assets.mjs`
- Create: `src/home/scene/asset-registry.js`
- Add: `assets/home/models/desk-lamp/scene.gltf` plus its local buffers/textures
- Add: `assets/home/models/stationery/scene.gltf` plus its local buffers/textures
- Add: `assets/home/environment/studio-1k.hdr`
- Create: `assets/home/ATTRIBUTION.md`
- Add: `vendor/three/examples/jsm/loaders/GLTFLoader.js`
- Add: `vendor/three/examples/jsm/loaders/RGBELoader.js`
- Add: `vendor/three/examples/jsm/utils/BufferGeometryUtils.js`
- Add: `vendor/three/examples/jsm/utils/SkeletonUtils.js`
- Add: `vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js`
- Create: `tests/home-assets.test.js`

**Interfaces:**
- `HOME_ASSET_MANIFEST` contains exactly the locally shipped asset categories needed by the implementation.
- `createHomeAssetRegistry({ THREE, GLTFLoader, RGBELoader, timeoutMs = 6000 })` returns `preloadCritical()`, `getModel(id)`, `getEnvironment()`, `audit()`, `dispose()`.
- `audit()` returns `{ importedCount, loadedIds, failedIds }`.
- `npm run check:home-assets` enforces <=7 3D models, <=12 MiB hard payload, local-only references, and attribution.

- [ ] **Step 1: Write asset-policy tests**

Create `tests/home-assets.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { HOME_ASSET_MANIFEST } from "../src/home/scene/asset-registry.js";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}

test("manifest ships only local CC0 Home assets", () => {
  assert.deepEqual(HOME_ASSET_MANIFEST.map(item => item.id), ["desk-lamp", "stationery", "studio-env"]);
  assert.ok(HOME_ASSET_MANIFEST.every(item => !/^https?:/.test(item.src)));
  assert.ok(HOME_ASSET_MANIFEST.every(item => item.license === "CC0-1.0"));
});

test("Home assets stay attributed and below the hard payload budget", async () => {
  const root = new URL("../assets/home/", import.meta.url);
  const files = await walk(root.pathname);
  const models = files.filter(path => /\.(?:glb|gltf)$/i.test(path));
  const bytes = (await Promise.all(files.map(path => stat(path)))).reduce((sum, item) => sum + item.size, 0);
  const attribution = await readFile(new URL("../assets/home/ATTRIBUTION.md", import.meta.url), "utf8");
  assert.ok(models.length <= 7);
  assert.ok(bytes <= 12 * 1024 * 1024);
  for (const descriptor of HOME_ASSET_MANIFEST) {
    assert.match(attribution, new RegExp(descriptor.id.replaceAll("-", "[- ]"), "i"));
  }
});
```

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-assets.test.js
```

Expected: FAIL because the registry/assets do not exist.

- [ ] **Step 3: Vendor the exact Three.js addons**

Extend `vendor-three.mjs` to copy these from `node_modules/three/examples/jsm`:

```text
loaders/GLTFLoader.js
loaders/RGBELoader.js
utils/BufferGeometryUtils.js
utils/SkeletonUtils.js
geometries/RoundedBoxGeometry.js
```

Rewrite every bare `from "three"` / `from 'three'` import in copied files to the correct relative local `three.module.min.js`. Keep Three exactly `0.185.1`.

- [ ] **Step 4: Add the concrete CC0 asset set locally**

Download the 1K/lightweight variants of:

```text
Poly Haven desk_lamp_arm_01 -> assets/home/models/desk-lamp/
Poly Haven stationery_supplies -> assets/home/models/stationery/
Poly Haven poly_haven_studio 1K HDR -> assets/home/environment/studio-1k.hdr
```

Normalize the model entry filenames to `scene.gltf`; update internal texture/buffer URIs to local relative files only. Resize local textures if required to keep the complete `assets/home` tree <=12 MiB. Record exact source page, original asset name, source/author, `CC0 1.0`, selected resolution and local path in `ATTRIBUTION.md`.

- [ ] **Step 5: Implement a fail-open asset registry**

Use this manifest:

```js
export const HOME_ASSET_MANIFEST = Object.freeze([
  { id: "desk-lamp", type: "gltf", src: "assets/home/models/desk-lamp/scene.gltf", critical: true, license: "CC0-1.0" },
  { id: "stationery", type: "gltf", src: "assets/home/models/stationery/scene.gltf", critical: true, license: "CC0-1.0" },
  { id: "studio-env", type: "hdr", src: "assets/home/environment/studio-1k.hdr", critical: true, license: "CC0-1.0" }
]);
```

Resolve with `new URL(`../../../${descriptor.src}`, import.meta.url)`. `preloadCritical()` loads all three with `Promise.allSettled()` and a 6-second global timeout; failures are recorded, not thrown. `getModel(id)` returns `loadedScene.clone(true)` or `null`. `getEnvironment()` returns the loaded HDR texture or `null`. `dispose()` disposes cached geometries/materials/textures once.

- [ ] **Step 6: Add the asset budget/license checker**

`check-home-assets.mjs` must:

1. sum `assets/home` bytes;
2. count `.glb/.gltf` model entry files;
3. fail above 7 models or 12 MiB;
4. warn above the 8 MiB target;
5. require every manifest id/local filename in `ATTRIBUTION.md`;
6. reject `http://` or `https://` URIs inside runtime `.gltf` JSON.

Add:

```json
"check:home-assets": "node scripts/check-home-assets.mjs"
```

to `package.json`.

- [ ] **Step 7: Keep secret scanning binary-safe**

Add `.glb` and `.hdr` to the binary extension skip set in `scripts/check-secrets.mjs`; continue scanning `.gltf` because it is text JSON.

- [ ] **Step 8: Regenerate/vendor and run GREEN**

```bash
npm run vendor:three
npm run check:home-assets
node --test tests/home-assets.test.js tests/secret-scan.test.js
node scripts/check-secrets.mjs
git add scripts/vendor-three.mjs scripts/check-home-assets.mjs scripts/check-secrets.mjs package.json vendor/three/examples assets/home src/home/scene/asset-registry.js tests/home-assets.test.js
git commit -m "feat: add local realistic home asset pipeline"
```

---

### Task 3: Integrate realistic props, rounded procedural geometry and local environment reflections

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
- `buildStudyRoom({ THREE, materials, assets = null, RoundedBoxGeometry })` preserves station IDs/screens/hit areas.
- Room exposes `realismAudit: { importedProps, roundedProps }`.
- Renderer audit adds `environmentReady: boolean`.

- [ ] **Step 1: Strengthen realism tests**

In `home-materials.test.js`, allow procedural architectural maps up to 512px and require new material families:

```js
assert.ok(materials.ceramic.roughness >= .3 && materials.ceramic.roughness <= .7);
assert.equal(materials.ceramic.metalness, 0);
assert.ok(materials.paintedMetal.roughness > materials.metal.roughness);
```

In `home-scene-semantics.test.js` require:

```js
assert.ok(room.realismAudit.roundedProps >= 4);
assert.ok(room.group.getObjectByName("ergonomic-chair").userData.silhouetteRefined);
assert.ok(room.group.getObjectByName("main-monitor").userData.silhouetteRefined);
```

In renderer profile tests require source/audit evidence for `PMREMGenerator`, `scene.environment`, and `createHomeAssetRegistry`.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-materials.test.js tests/home-scene-semantics.test.js tests/home-renderer-profile.test.js tests/home-lighting.test.js
```

- [ ] **Step 3: Add distinct physical material families**

Add to `materials.js`:

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

Increase only visibly useful procedural maps to 256–512px; mix two deterministic noise scales so wood/wall/floor do not show a single periodic pattern.

- [ ] **Step 4: Preload assets before room construction**

In renderer initialization import local `GLTFLoader`, `RGBELoader`, `RoundedBoxGeometry`, create the registry, `await assets.preloadCritical()`, then call:

```js
room = buildStudyRoom({ THREE, materials, assets, RoundedBoxGeometry });
```

Because registry failures return `null`, room construction must always remain possible.

- [ ] **Step 5: Replace the visible lamp and add realistic desk props without changing semantic anchors**

Keep wrapper group name `articulated-desk-lamp`. If `assets.getModel("desk-lamp")` succeeds, clear only its procedural visible meshes, normalize imported bounds to the old lamp footprint, and insert the imported clone. If it fails, keep the current procedural lamp.

Create wrapper `desk-props`; insert `assets.getModel("stationery")` at the current desk-prop zone. If it fails, keep only the improved mug/keyboard/mouse fallback. Mark imported meshes `castShadow=true` and `receiveShadow=true`; quality profile still decides whether shadow maps are rendered.

- [ ] **Step 6: Improve the remaining high-salience silhouettes procedurally**

Use `RoundedBoxGeometry`/small custom curved geometries for:

- desk top edge radius about `.04` room units;
- monitor shell/bezel with rounded corners and separate back shell;
- chair seat/back with rounded/tapered geometry and subtle back curvature;
- mug with open cup body plus handle using `materials.ceramic`;
- low rounded keyboard and mouse bodies.

Set:

```js
chair.userData.silhouetteRefined = true;
monitor.userData.silhouetteRefined = true;
```

Do not move station targets or hit areas.

- [ ] **Step 7: Add local HDR reflections via PMREM**

After registry preload:

```js
const pmrem = new THREE.PMREMGenerator(renderer);
const hdr = assets.getEnvironment();
let envTarget = null;
if (hdr) {
  envTarget = pmrem.fromEquirectangular(hdr);
  scene.environment = envTarget.texture;
}
```

Keep designed `scene.background`; HDR is only reflection/fill. Expose `environmentReady: Boolean(envTarget)` in renderer audit and dispose `envTarget`, PMREM and registry on teardown.

- [ ] **Step 8: Preserve lighting composition while improving contact**

Keep current key/fill directions, ACES and cumulative station lighting. Keep only the existing key shadow-casting light; tune bias/normalBias if rounded/imported objects float or acne appears. Maintain readable neutral fill and restrained cool screen spill.

- [ ] **Step 9: Run regression suite and commit**

```bash
node --test tests/home-materials.test.js tests/home-scene-semantics.test.js tests/home-renderer-profile.test.js tests/home-lighting.test.js tests/home-camera-timeline.test.js tests/home-mobile-cinematic-v19.test.js
git add src/home/scene/build-room.js src/home/scene/materials.js src/home/scene/study-room-renderer.js src/home/scene/lighting-controller.js tests/home-materials.test.js tests/home-scene-semantics.test.js tests/home-renderer-profile.test.js tests/home-lighting.test.js
git commit -m "feat: make study room props physically plausible"
```

---

### Task 4: Increase screen legibility without moving mobile cameras closer

**Files:**
- Modify: `src/home/scene/screen-ui.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-screen-ui.test.js`
- Modify: `tests/home-mobile-cinematic-v19.test.js`
- Modify: `tests/home-scene-semantics.test.js`

**Interfaces:**
- Export exact function `resolveScreenSize(screenKind, { active = false } = {})`.
- Screen handle exposes `setActive(active): boolean`; it redraws only when resolution tier changes.

- [ ] **Step 1: Add RED resolution-tier tests using the existing test fixture**

In `home-screen-ui.test.js`, use the existing `record()` helper:

```js
test("active screens use a denser texture without exceeding memory ceiling", () => {
  const { handle, canvas } = record("lesson");
  const base = [canvas.width, canvas.height];
  assert.equal(handle.setActive(true), true);
  const active = [canvas.width, canvas.height];
  assert.ok(active[0] >= base[0]);
  assert.ok(active[1] >= base[1]);
  assert.ok(active[0] <= 1280);
  assert.ok(active[1] <= 1792);
});
```

Also assert no informational body text uses a logical font below 15px; Social title remains >=52px and secondary facts >=28px.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-screen-ui.test.js tests/home-mobile-cinematic-v19.test.js
```

- [ ] **Step 3: Implement exact base/active resolution policy**

`resolveScreenSize()` returns:

```text
default base 768×480
default active 1024×640
social base 960×1344
social active 1280×1792
```

Logical coordinate systems remain unchanged. `setActive()` resizes and redraws only on state transition, not per frame.

- [ ] **Step 4: Remove remaining microcopy**

Each screen is limited to one primary title/state, one primary metric/progress line, 2–3 secondary facts, one short action cue. Keep high contrast and heavier weights. Do not enlarge physical screen geometry and do not reduce mobile camera distance for text.

- [ ] **Step 5: Switch texture tier only when active station changes**

Renderer stores `activeScreenId`. On `shot.stationId` change, deactivate prior handle, activate current handle, and set the affected `CanvasTexture.needsUpdate=true` once.

- [ ] **Step 6: Run GREEN and commit**

```bash
node --test tests/home-screen-ui.test.js tests/home-mobile-cinematic-v19.test.js tests/home-scene-semantics.test.js
git add src/home/scene/screen-ui.js src/home/scene/build-room.js src/home/scene/study-room-renderer.js tests/home-screen-ui.test.js tests/home-mobile-cinematic-v19.test.js tests/home-scene-semantics.test.js
git commit -m "feat: sharpen active study screens"
```

---

### Task 5: Replace V23 pointer wiggle with independent Igloo-like depth layers

**Files:**
- Create: `src/home/scene/parallax-rig.js`
- Modify: `src/home/scene/interaction-controller.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-parallax.test.js`
- Modify: `tests/motion-fallback.test.js`

**Interfaces:**
- `createParallaxRig({ layers, maxLayers = 12 })`.
- Layer shape: `{ object, depth, translation: {x,y}, rotation: {x,y}, damping }`.
- Methods: `setTarget({x,y})`, `update(deltaSeconds)`, `reset()`, `restoreImmediately()`, `audit()`.
- `audit()` returns `{ count, depths, damping, maxTranslation, maxRotation }`.
- Interaction controller keeps hit testing and exposes `getPointerDepth()` / `resetPointerDepth()` normalized to `[-1,1]`.

- [ ] **Step 1: Strengthen parallax tests**

Require:

```js
assert.ok(room.parallaxAudit.count >= 8);
assert.ok(room.parallaxAudit.count <= 12);
assert.ok(new Set(room.parallaxAudit.depths).size >= 4);
assert.ok(new Set(room.parallaxAudit.damping).size >= 3);
```

With two fake objects at different depth/damping, the same pointer target must produce different translation and rotation after updates. Strongest translation stays <= `.08` room units; strongest rotation stays <= `.04` radians. `reset()` eases back; `restoreImmediately()` restores exact base transforms.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-parallax.test.js tests/motion-fallback.test.js
```

- [ ] **Step 3: Implement frame-rate-independent layer damping**

Capture immutable base transforms once. For each layer:

```js
const alpha = 1 - Math.exp(-layer.damping * Math.max(0, deltaSeconds));
state.x += (targetX - state.x) * alpha;
state.y += (targetY - state.y) * alpha;
```

Apply translation/rotation additively from base values. Allocate no new Vector/Euler objects in `update()`.

- [ ] **Step 4: Register 8–12 semantic layers**

Use these depth bands:

```text
1.00 damping 10: foreground review card + loose stationery
0.78 damping 8: two other review cards
0.58 damping 7: mug / stationery cup
0.42 damping 6: future binders 1–2
0.28 damping 5: keyboard, mouse, future binder 3
0.12 damping 4: lamp shade or monitor shell, rotation only
```

Shelves, room shell, chair and desk remain effectively stationary.

- [ ] **Step 5: Use normalized pointer input, not tiny scene-space input**

Remove `MAX_PARALLAX=.012` as the global physical amplitude. Interaction returns normalized pointer target. Strongest layer starts near:

```js
translation: { x: .055, y: .035 },
rotation: { x: .018, y: .028 }
```

Camera offset/rotation is separate and smaller: max about `.008` radians.

- [ ] **Step 6: Enforce motion policy**

Enable rig only when:

```js
!reducedMotion && cameraLayout === "desktop" && exitProgress === 0
```

Mobile never maps touch/device orientation to parallax. Reduced motion uses `restoreImmediately()` and has no autonomous return loop. Normal desktop pointer leave uses `reset()` so objects ease back.

- [ ] **Step 7: Run GREEN and commit**

```bash
node --test tests/home-parallax.test.js tests/motion-fallback.test.js tests/home-camera-timeline.test.js tests/home-mobile-cinematic-v19.test.js
git add src/home/scene/parallax-rig.js src/home/scene/interaction-controller.js src/home/scene/build-room.js src/home/scene/study-room-renderer.js tests/home-parallax.test.js tests/motion-fallback.test.js
git commit -m "feat: add layered inertial room depth"
```

---

### Task 6: Make the final runway slow, readable and explicitly three-phase

**Files:**
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/camera-timeline.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/lighting-controller.js`
- Modify: `tests/home-exit-journey.test.js`
- Modify: `tests/home-camera-timeline.test.js`
- Modify: `tests/home-lighting.test.js`

**Interfaces:**
- Export `resolveExitChoreography(exitProgress)` -> `{ establish, dolly, handoff }`.
- Renderer method `getPathsProjection()` -> `{ left, top, width, height } | null` in CSS pixels.

- [ ] **Step 1: Add RED choreography tests**

```js
const start = resolveExitChoreography(0);
const context = resolveExitChoreography(.16);
const approach = resolveExitChoreography(.55);
const end = resolveExitChoreography(.92);
assert.equal(start.establish, 0);
assert.ok(context.establish > .5);
assert.equal(context.handoff, 0);
assert.ok(approach.dolly > .25 && approach.dolly < .9);
assert.ok(end.handoff > .5);
```

For sampled raw progress values assert `shouldExit === true` implies `exitProgress >= .9`.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-exit-journey.test.js tests/home-camera-timeline.test.js
```

- [ ] **Step 3: Implement phase mapping**

```js
export function resolveExitChoreography(value) {
  const p = clamp01(value);
  const range = (start, end) => {
    const t = clamp01((p - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  return {
    establish: range(0, .2),
    dolly: range(.18, .88),
    handoff: range(.82, 1)
  };
}
```

Keep 140vh desktop and 180vh mobile runway.

- [ ] **Step 4: Make camera exit piecewise**

Add establish shots:

```js
const HOME_EXIT_ESTABLISH = {
  position: [0.15, 3.65, 4.6], target: [0.45, 2.35, -2.25], fov: 41
};
const MOBILE_EXIT_ESTABLISH = {
  position: [-0.45, 3.55, 4.25], target: [0.55, 2.55, -2.3], fov: 52
};
```

`timeline.exit()` moves final station → establish during 0–.22, then establish → current close Paths exit during .18–1. Preserve continuity/projection tests.

- [ ] **Step 5: Converge lighting toward Paths without switching the room off**

Keep previous cumulative zones visible; gradually strengthen Future/Paths practical/screen spill and reduce guide emphasis elsewhere. Ambient never drops below the existing readable floor. Add no new blue wash and no extra shadow-casting light.

- [ ] **Step 6: Expose the projected Paths display rectangle**

Project `room.stations["future-paths"].screen` world bounds through the current camera, map NDC to `canvas.getBoundingClientRect()`, and return a finite/clamped CSS rect. Return `null` if behind camera/invalid.

- [ ] **Step 7: Run GREEN and commit**

```bash
node --test tests/home-exit-journey.test.js tests/home-camera-timeline.test.js tests/home-lighting.test.js tests/home-mobile-cinematic-v19.test.js
git add src/home/home-experience.js src/home/scene/camera-timeline.js src/home/scene/study-room-renderer.js src/home/scene/lighting-controller.js tests/home-exit-journey.test.js tests/home-camera-timeline.test.js tests/home-lighting.test.js
git commit -m "feat: choreograph slow cinematic paths approach"
```

---

### Task 7: Create a shared Home → Paths surface and keep reverse scroll continuous

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
- Export singleton accessor `getSharedPathsTransition({ documentTarget = document, reducedMotion = false } = {})` so Home and Paths reuse the same body portal.
- Methods: `beginFromScene(rect)`, `updateFromScene(progress, rect)`, `markNavigating()`, `receivePaths(root)`, `beginReverseFromPaths(root)`, `receiveHome(rect)`, `disposePortal()`.
- Extend `createPathsReturnController()` with `beforeReturn = () => {}`; call it before marking return/navigating.

- [ ] **Step 1: Write RED shared-transition tests**

Create a minimal fake document/body and require:

```js
test("portal starts from projected 3D rect and lives outside app", () => {
  const transition = getSharedPathsTransition({ documentTarget: fakeDocument });
  transition.beginFromScene({ left: 120, top: 80, width: 420, height: 240 });
  const portal = fakeDocument.body.children[0];
  assert.equal(portal.className, "paths-shared-portal");
  assert.match(portal.style.transform, /translate/);
});

test("portal does not become full before 90 percent handoff", () => {
  transition.updateFromScene(.5, rect);
  assert.notEqual(portal.dataset.phase, "full");
  transition.updateFromScene(.91, rect);
  assert.equal(portal.dataset.phase, "full");
});
```

Extend return-controller test with `beforeReturn` event ordering: callback → `markReturn` → navigate.

- [ ] **Step 2: Confirm RED**

```bash
node --test tests/home-shared-transition.test.js tests/home-transition.test.js tests/paths-return-controller.test.js tests/home-route-state.test.js
```

- [ ] **Step 3: Implement the persistent body-level portal**

The portal is visual only and is appended to `document.body`, never inside `#app`, so `app.replaceChildren()` cannot remove it. Use transforms/custom properties rather than animating layout properties every frame:

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

`updateFromScene(progress, rect)` is directly scroll-driven and reversible before route swap.

- [ ] **Step 4: Start the portal only in the final handoff phase**

In Home `updateJourney()`, when `choreography.handoff > 0`, obtain `renderer.getPathsProjection()`, call `beginFromScene(rect)` once and then `updateFromScene(choreography.handoff, rect)` each scroll frame.

Automatic navigation requires:

```js
phases.shouldExit && choreography.handoff >= .9
```

Before navigation call `sharedTransition.markNavigating()`. For this automatic exit call the existing transition manager with `{ focus:false, overlay:false, viewTransition:false }`; the persistent portal is now the primary route handoff rather than a hash-change View Transition.

- [ ] **Step 5: Make cinematic Paths entry detectable synchronously**

Refactor `renderPathsView({ navigate })` so it creates `routeState` and `createPathsReturnController(...)` synchronously before returning `root`; the controller does not require the root to be connected. If `controller.active`:

```js
root.dataset.cinematicEntry = "true";
```

must be set before `renderPathsView()` returns. Queue only DOM-dependent receiver/MutationObserver work. This makes `app.js` able to inspect `view.dataset.cinematicEntry` immediately after `app.replaceChildren(view)`.

- [ ] **Step 6: Add the HTML receiving surface**

Prepend:

```js
const receiver = element("div", {
  className: "paths-cinematic-receiver",
  attrs: { "aria-hidden": "true" }
});
```

On cinematic entry queue `sharedTransition.receivePaths(root)`. Normal menu/direct Paths entries leave the receiver inert/hidden. `receivePaths()` settles the portal into the receiver/full Paths hero, then removes the body portal after the page underneath is stable.

- [ ] **Step 7: Prevent `app.js` from fighting the cinematic entry**

Keep the exact Escape/focus strings. After `app.replaceChildren(view)`:

```js
const cinematicPathsEntry = route.name === "paths" && view.dataset.cinematicEntry === "true";
scrollTo({
  top: 0,
  behavior: cinematicPathsEntry || reducedMotion ? "auto" : "smooth"
});
```

Normal routes retain current smooth behavior.

- [ ] **Step 8: Make Paths → Home reverse use the same portal**

Pass to the Paths return controller:

```js
beforeReturn() {
  sharedTransition.beginReverseFromPaths(root);
}
```

Then keep existing `markReturn({ resumeProgress })` and navigate `#/home`. When Home has restored its final runway and renderer is ready, call `sharedTransition.receiveHome(renderer.getPathsProjection())`; normal motion shrinks/fades the full-screen portal back into the 3D Paths display, reduced motion uses a short opacity handoff. Existing re-entry lock prevents immediate Home → Paths looping.

- [ ] **Step 9: Keep generic click transitions unchanged**

`home-transition-manager.js` still focuses/shows semantic overlays for ordinary station clicks. Only automatic `future-paths` exit bypasses overlay/focus/ViewTransition because the new portal handles it.

- [ ] **Step 10: Run GREEN and commit**

```bash
node --test tests/home-shared-transition.test.js tests/home-transition.test.js tests/paths-return-controller.test.js tests/home-route-state.test.js tests/home-exit-journey.test.js
git add src/home/home-shared-transition.js src/home/home-experience.js src/home/home-transition-manager.js src/views/paths-view.js src/home/paths-return-controller.js src/app.js styles/home-immersive.css tests/home-shared-transition.test.js tests/home-transition.test.js tests/paths-return-controller.test.js tests/home-route-state.test.js
git commit -m "feat: bridge cinematic home into paths"
```

---

### Task 8: Publish V24 coherently and verify the exact release SHA

**Files:**
- Modify: `tests/home-deployment.test.js`
- Modify: `index.html`
- Modify: all changed Home/Paths browser import query tokens
- Modify: `.github/workflows/test.yml`
- Modify: `README.md`

**Interfaces:**
- Browser graph uses only `20260829-24` for changed Home/Paths modules.
- CI runs `node --test`, `npm run check:home-assets`, and `node scripts/check-secrets.mjs`.

- [ ] **Step 1: Turn release graph RED**

Change only:

```js
const RELEASE_TOKEN = "20260829-24";
```

in `home-deployment.test.js`. Extend the graph to include:

```text
src/home/scene/asset-registry.js
src/home/scene/parallax-rig.js
src/home/home-shared-transition.js
src/views/paths-view.js
```

Also assert vendored Three addon files import the local vendored Three module and no runtime CDN.

Run:

```bash
node --test tests/home-deployment.test.js
```

Expected: FAIL while public graph is still V23.

- [ ] **Step 2: Advance changed browser graph atomically**

Replace every V23 query token in changed Home/Paths browser imports and `index.html` with `?v=20260829-24`, including new module imports. Preserve all routes and application data semantics.

- [ ] **Step 3: Put the asset checker in CI**

Update `.github/workflows/test.yml`:

```yaml
- run: node --test
- name: Check Home asset budget and licenses
  run: npm run check:home-assets
- name: Check for committed secrets
  run: node scripts/check-secrets.mjs
```

- [ ] **Step 4: Document zero-cost local Home assets**

Add a short README architecture note: Home 3D assets/HDR are committed locally, redistribution-compatible/CC0, checked for payload/license in CI, and require no paid runtime service.

- [ ] **Step 5: Run focused V24 verification**

```bash
node --check src/home/home-experience.js
node --check src/home/scene/asset-registry.js
node --check src/home/scene/parallax-rig.js
node --check src/home/home-shared-transition.js
node --check src/home/scene/study-room-renderer.js
node --test tests/home-startup.test.js tests/home-assets.test.js tests/home-materials.test.js tests/home-parallax.test.js tests/home-screen-ui.test.js tests/home-exit-journey.test.js tests/home-shared-transition.test.js tests/paths-return-controller.test.js tests/home-deployment.test.js
```

Expected: all PASS.

- [ ] **Step 6: Run complete verification**

```bash
node --test
npm run check:home-assets
node scripts/check-secrets.mjs
```

Expected: complete test suite PASS; asset checker <=7 3D assets and <=12 MiB; secret checker prints `Nessun possibile segreto rilevato.`

- [ ] **Step 7: Commit release**

```bash
git add index.html src styles tests scripts assets vendor package.json package-lock.json .github/workflows/test.yml README.md
git commit -m "feat: publish realistic immersive home v24"
```

- [ ] **Step 8: Verify exact final SHA in GitHub Actions/Pages**

On the final commit SHA verify all of these on that same SHA:

1. Test workflow `success`;
2. `Run node --test` step `success`;
3. `Check Home asset budget and licenses` `success`;
4. `Check for committed secrets` `success`;
5. `pages build and deployment` `success`.

Do not claim V24 published until Test and Pages are green on the same final SHA.

- [ ] **Step 9: Final contract check and visual handoff**

Confirm from source/tests:

- no legacy fallback is visible during normal successful startup;
- no runtime 3D/HDR URL is remote;
- all imported assets have attribution/license metadata;
- desktop parallax has >=4 depth responses and <=12 moving layers;
- mobile/reduced motion has no pointer parallax while scroll journey stays active;
- 390×844 screen projection bounds still pass;
- route handoff starts only after >=90% exit progress;
- cinematic Paths entry can scroll back to the final Home runway without a loop.

Then provide the V24 Pages URL and ask the user to visually verify the three perceptual criteria Node tests cannot prove: whether hero props read as real objects, whether pointer depth feels close to the intended Igloo-like motion, and whether Home → Paths feels like one continuous cinematic transition.
