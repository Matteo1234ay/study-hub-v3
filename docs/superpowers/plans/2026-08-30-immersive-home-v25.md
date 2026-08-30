# Study Hub Immersive Home V25 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the V24 Study Hub homepage more cinematic, readable and physically convincing on desktop and mobile, including authored approach/read/release camera direction, weighted depth interaction, a late crash zoom into Paths, and a reversible Home ↔ Paths handoff.

**Architecture:** Preserve the six semantic Three.js stations and the existing V24 renderer/route structure. Add one focused director controller above the camera/lighting/parallax systems, upgrade the camera timeline to curve sampling, keep screen readability and captions driven by director state, add one local CC0 hero prop through a local-only glTF registry, and extend the final exit choreography with a bounded crash phase before the existing shared Paths transition.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, CanvasTexture screen UI, CSS, Node `node:test`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-30-immersive-home-v25-design.md`

## Global Constraints

- Cost to host and run: **0 €** under the existing GitHub Pages model.
- No paid API, paid SaaS, metered runtime service, required payment method, or paid asset.
- No runtime CDN dependency for critical assets.
- Any added 3D/model/texture asset must be redistribution-compatible and recorded in the repository; prefer CC0/public-domain.
- No image-generation dependency or image-generation step.
- Preserve all six semantic Study Hub stations and every existing route.
- Home final destination remains `#/paths`.
- Preserve reversible Paths → Home behavior only for cinematic entry.
- Scroll-driven motion remains enabled under `prefers-reduced-motion`; pointer parallax and fast crash acceleration do not.
- Mobile target includes approximately 390×844 and widths 360–430 px.
- Mobile default quality remains balanced; adaptive DPR remains active.
- Maximum 12 pointer-moving scene layers.
- If local models are added: maximum 7 props; target new model+texture payload ≤ 8 MB; hard ceiling 12 MB; critical first-frame asset payload target ≤ 5 MB; no 4K textures.
- Preserve the successful-WebGL startup contract: cinematic preload → first valid frame → ready; never old DOM Home → wait → 3D Home.
- Preserve exact existing Focus/Escape behavior in `src/app.js` and Home navigation.
- All production behavior changes follow red-green TDD.
- Release token for this version: `20260830-25`.

---

## File Structure

### Create

- `src/home/scene/director-controller.js` — pure approach/read/release state, read strength, motion scaling and scroll-velocity damping.
- `src/home/scene/asset-registry.js` — local glTF load/timeout/fallback/disposal for the hero prop.
- `vendor/three/examples/jsm/loaders/GLTFLoader.js` — vendored by `scripts/vendor-three.mjs`, no CDN.
- `assets/3d/desk-lamp-arm-01/**` — optimized local CC0 Desk Lamp Arm 01 asset from Poly Haven, 1K textures only.
- `assets/3d/ATTRIBUTION.md` — exact source and CC0 license record.
- `tests/home-director-v25.test.js` — director, phase and velocity contracts.
- `tests/home-crash-zoom-v25.test.js` — final crash, reduced-motion and reverse contracts.
- `tests/home-assets-v25.test.js` — local-only asset, license and payload contracts.

### Modify

- `src/home/scene/camera-timeline.js` — curve transitions, tighter mobile composition, crash camera samples.
- `src/home/scene/study-room-renderer.js` — director integration, scroll velocity, read mode, crash/reduced-motion selection.
- `src/home/scene/renderer-setup.js` — clustered parallax metadata, hero asset insertion, stable shadow policy.
- `src/home/scene/lighting-controller.js` — ratio-based lighting and final convergence.
- `src/home/scene/parallax-rig.js` — cluster/weight metadata and amplitude scale.
- `src/home/scene/screen-ui.js` — read/mobile presentation policy.
- `src/home/home-experience.js` — physical scroll pacing, scroll velocity, director/caption state, crash-aware exit threshold and reverse resume position.
- `src/home/home-shared-transition.js` — projection flattening and visual dominance during crash/handoff.
- `src/home/home-route-state.js` — allow pre-crash resume progress rather than hard-clamping to `.97`.
- `src/home/paths-return-controller.js` — controlled reverse entry remains top-only and one-shot.
- `src/views/paths-view.js` — receiving surface state if needed by updated shared transition contract.
- `styles/home-immersive.css` — smaller captions, read-phase attenuation, crash/handoff styling.
- `scripts/vendor-three.mjs` — vendor `GLTFLoader.js` locally.
- `tests/home-camera-timeline.test.js`
- `tests/home-exit-journey.test.js`
- `tests/home-lighting.test.js`
- `tests/home-parallax-v24.test.js`
- `tests/home-screen-legibility-v24.test.js`
- `tests/home-screen-ui.test.js`
- `tests/home-shared-transition.test.js`
- `tests/home-route-state.test.js`
- `tests/paths-return-controller.test.js`
- `tests/home-deployment.test.js`
- `index.html` and the V25 Home dependency graph cache tokens.

---

### Task 1: Add the V25 Director State Model

**Files:**
- Create: `src/home/scene/director-controller.js`
- Create: `tests/home-director-v25.test.js`
- Modify: `src/home/scene/camera-timeline.js` only to expose station window metadata through `stationWindows()`; no camera behavior changes yet.

**Interfaces:**
- Consumes: `createCameraTimeline({ layout })` and its new `stationWindows()` result.
- Produces: `createDirectorController({ timeline, layout })`.
- `director.sample(progress, { scrollVelocity = 0 })` returns:
  `{ stationId, phase, phaseProgress, readStrength, captionStrength, motionScale, parallaxScale, lightingScale }`.
- Phase is one of `"approach" | "read" | "release"`.
- `readStrength` is `0..1`, strongest in read phase.
- `parallaxScale` is `0..1` and decreases as absolute scroll velocity increases.

- [ ] **Step 1: Write the failing director tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";
import { createDirectorController } from "../src/home/scene/director-controller.js";

test("every station exposes approach, read and release director phases", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  const director = createDirectorController({ timeline, layout: "desktop" });
  for (const window of timeline.stationWindows()) {
    assert.equal(director.sample((window.enter + window.readStart) / 2).phase, "approach");
    assert.equal(director.sample((window.readStart + window.readEnd) / 2).phase, "read");
    if (window.releaseEnd > window.readEnd) {
      assert.equal(director.sample((window.readEnd + window.releaseEnd) / 2).phase, "release");
    }
  }
});

test("fast scrolling reduces visual detail without changing semantic station", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  const director = createDirectorController({ timeline, layout: "desktop" });
  const progress = timeline.stationProgress("social");
  const slow = director.sample(progress, { scrollVelocity: 0 });
  const fast = director.sample(progress, { scrollVelocity: 4 });
  assert.equal(slow.stationId, fast.stationId);
  assert.ok(fast.parallaxScale < slow.parallaxScale);
  assert.ok(fast.motionScale <= slow.motionScale);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/home-director-v25.test.js`

Expected: FAIL because `director-controller.js` and/or `stationWindows()` do not exist.

- [ ] **Step 3: Expose station windows from the timeline**

Add to the `createCameraTimeline()` return value:

```js
function stationWindows() {
  return selectedShots.map(shot => ({
    stationId: shot.stationId,
    enter: shot.enter,
    readStart: shot.settleStart,
    readEnd: shot.settleEnd,
    releaseEnd: shot.exit
  }));
}
```

Return `stationWindows` with the existing timeline API.

- [ ] **Step 4: Implement the director as a pure deterministic controller**

Core shape:

```js
const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));
const smooth = value => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function createDirectorController({ timeline, layout = "desktop" } = {}) {
  const windows = timeline.stationWindows();

  function sample(progress, { scrollVelocity = 0 } = {}) {
    const p = clamp01(progress);
    const current = windows.find(item => p >= item.enter && p <= item.releaseEnd) ?? windows.at(-1);
    let phase = "read";
    let phaseProgress = 1;
    if (p < current.readStart) {
      phase = "approach";
      phaseProgress = clamp01((p - current.enter) / Math.max(.0001, current.readStart - current.enter));
    } else if (p <= current.readEnd) {
      phase = "read";
      phaseProgress = clamp01((p - current.readStart) / Math.max(.0001, current.readEnd - current.readStart));
    } else {
      phase = "release";
      phaseProgress = clamp01((p - current.readEnd) / Math.max(.0001, current.releaseEnd - current.readEnd));
    }
    const readStrength = phase === "read" ? 1 : 1 - smooth(phaseProgress);
    const velocity = Math.min(6, Math.abs(Number(scrollVelocity) || 0));
    const velocityScale = 1 - velocity / 8;
    return {
      stationId: current.stationId,
      phase,
      phaseProgress,
      readStrength: clamp01(readStrength),
      captionStrength: phase === "read" ? .45 : 1,
      motionScale: Math.max(.55, velocityScale),
      parallaxScale: Math.max(.3, velocityScale) * (phase === "read" ? .65 : 1),
      lightingScale: phase === "read" ? .9 : 1,
      layout
    };
  }
  return { sample };
}
```

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/home-director-v25.test.js tests/home-camera-timeline.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/home/scene/director-controller.js src/home/scene/camera-timeline.js tests/home-director-v25.test.js
git commit -m "feat: add V25 home director phases"
```

---

### Task 2: Replace Straight Camera Transfers with Authored Curves and Improve Mobile Framing

**Files:**
- Modify: `src/home/scene/camera-timeline.js`
- Modify: `tests/home-camera-timeline.test.js`
- Modify: `tests/home-mobile-cinematic.test.js`
- Modify: `tests/home-mobile-cinematic-v19.test.js` only where old FOV thresholds conflict with the stronger V25 contract.

**Interfaces:**
- Preserves: `createCameraTimeline({ layout }).sample(progress)`, `.exit(progress)`, `.activeStation()`, `.stationProgress()`, `.overview()`, `.stationWindows()`.
- Adds no public dependency on Three.js; curve math remains plain arrays/numbers for Node tests.

- [ ] **Step 1: Add failing curve and mobile-FOV tests**

Add tests that verify the midpoint of at least one transfer is not collinear with start/end and mobile FOV is tighter:

```js
test("station transfers use authored curved camera paths", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  const a = timeline.sample(.25);
  const m = timeline.sample(.27);
  const b = timeline.sample(.29);
  const linearMid = a.position.map((value, index) => (value + b.position[index]) / 2);
  const curveOffset = Math.hypot(...m.position.map((value, index) => value - linearMid[index]));
  assert.ok(curveOffset > .015, `camera transfer still looks linear: ${curveOffset}`);
});

test("portrait V25 framing narrows FOV while retaining room context", () => {
  const timeline = createCameraTimeline({ layout: "mobile" });
  for (const stationId of ["desk", "memory", "social", "assessment", "progress", "future-paths"]) {
    const shot = timeline.sample(timeline.stationProgress(stationId));
    assert.ok(shot.fov >= 42 && shot.fov <= 50, `${stationId} mobile FOV ${shot.fov}`);
  }
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-camera-timeline.test.js tests/home-mobile-cinematic.test.js tests/home-mobile-cinematic-v19.test.js`

Expected: at least the curve/FOV tests fail against V24.

- [ ] **Step 3: Add cubic Bezier sampling for transfer position and target**

Add pure helpers:

```js
function cubicPoint(a, b, c, d, t) {
  const u = 1 - t;
  return a.map((value, index) =>
    u ** 3 * value
    + 3 * u ** 2 * t * b[index]
    + 3 * u * t ** 2 * c[index]
    + t ** 3 * d[index]
  );
}
```

For each transition use authored `exitControl`/`entryControl` offsets stored in shot data. The look target must use its own controls and begin anticipating the next station before camera position fully arrives.

- [ ] **Step 4: Tighten mobile settled FOVs and compensate with camera position**

Start from these safe targets, then only tune within test bounds:

```js
const mobileFov = {
  desk: 46,
  memory: 49,
  social: 48,
  assessment: 50,
  progress: 48,
  "future-paths": 49
};
```

Keep screen projection and room-context tests green; do not solve readability by pushing the camera so close that station context disappears.

- [ ] **Step 5: Preserve settled read anchors**

Within `[settleStart, settleEnd]`, `sample()` remains a stable authored pose with `settled: true` and bounded movement at the exact boundaries.

- [ ] **Step 6: Run focused camera/mobile tests**

Run: `node --test tests/home-camera-timeline.test.js tests/home-mobile-cinematic.test.js tests/home-mobile-cinematic-v19.test.js tests/home-screen-legibility-v24.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/home/scene/camera-timeline.js tests/home-camera-timeline.test.js tests/home-mobile-cinematic.test.js tests/home-mobile-cinematic-v19.test.js
git commit -m "feat: direct V25 curved camera paths"
```

---

### Task 3: Integrate Director State and Scroll Velocity into the Renderer

**Files:**
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/home-experience.js`
- Modify: `tests/home-director-v25.test.js`
- Modify: `tests/home-exit-journey.test.js`

**Interfaces:**
- `createStudyRoomRenderer()` creates one director for the current timeline.
- Extend `setJourney(value, options)` without breaking old calls:
  `setJourney(value, { scrollVelocity = 0 } = {})`.
- Add `getPresentationState(value, { scrollVelocity = 0 } = {})` for DOM captions.
- `home-experience.js` computes native scroll velocity but never changes journey position from velocity.

- [ ] **Step 1: Add failing renderer-source/behavior contracts**

Add assertions in `tests/home-director-v25.test.js` that `study-room-renderer.js` imports `createDirectorController`, passes velocity into it, and exposes `getPresentationState`.

Add a pure scroll velocity helper test in `home-exit-journey.test.js`:

```js
test("scroll velocity is bounded and cannot change journey position", () => {
  assert.equal(typeof homeExperience.resolveScrollVelocity, "function");
  assert.equal(homeExperience.resolveScrollVelocity({ deltaProgress: .02, deltaMs: 16 }) > 0, true);
  assert.equal(homeExperience.resolveScrollVelocity({ deltaProgress: 5, deltaMs: 1 }) <= 6, true);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-director-v25.test.js tests/home-exit-journey.test.js`

Expected: FAIL on missing renderer/director integration and helper.

- [ ] **Step 3: Implement bounded scroll velocity in Home**

Add:

```js
export function resolveScrollVelocity({ deltaProgress = 0, deltaMs = 16 } = {}) {
  const seconds = Math.max(.016, Number(deltaMs) / 1000 || .016);
  return Math.min(6, Math.abs(Number(deltaProgress) || 0) / seconds);
}
```

Track only previous raw progress/time in `updateJourney()`. Pass velocity to `renderer.setJourney(phases.sceneProgress, { scrollVelocity })` and to `renderer.getPresentationState(...)`. Never alter `sceneProgress`, `rawProgress`, route thresholds, or native scroll position based on velocity.

- [ ] **Step 4: Integrate director inside renderer**

On timeline/layout change, rebuild director. In `draw()`:

```js
const direction = director.sample(journey, { scrollVelocity });
const shot = exitProgress > 0 ? timeline.exit(exitProgress) : timeline.sample(journey);
syncActiveScreen(direction.stationId, direction);
```

Use `direction.parallaxScale` and `direction.motionScale` in later tasks but expose them now.

- [ ] **Step 5: Expose presentation state for captions**

```js
getPresentationState(value, { scrollVelocity = 0 } = {}) {
  return director.sample(value, { scrollVelocity });
}
```

Home writes `root.dataset.homePhase = presentation.phase` and `root.style.setProperty("--home-caption-strength", presentation.captionStrength)`.

- [ ] **Step 6: Run tests**

Run: `node --test tests/home-director-v25.test.js tests/home-exit-journey.test.js tests/home-view.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/home/scene/study-room-renderer.js src/home/home-experience.js tests/home-director-v25.test.js tests/home-exit-journey.test.js
git commit -m "feat: coordinate V25 journey with director state"
```

---

### Task 4: Add Read-Mode Screen Presentation and Smaller Captions

**Files:**
- Modify: `src/home/scene/screen-ui.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-screen-ui.test.js`
- Modify: `tests/home-screen-legibility-v24.test.js`
- Modify: `tests/home-view.test.js`

**Interfaces:**
- Add `resolveScreenPresentation({ screenKind, active, read, compact })`.
- Extend screen handle with `setPresentation({ active, read, compact })` while keeping `setActive(value)` as a compatibility wrapper.
- Read mode uses active high-density textures; mobile read mode uses stricter content hierarchy.

- [ ] **Step 1: Add failing screen-policy tests**

```js
test("mobile read presentation is high density and compact", () => {
  const policy = resolveScreenPresentation({ screenKind: "social", active: true, read: true, compact: true });
  assert.ok(policy.width >= 1280);
  assert.ok(policy.height >= 1792);
  assert.equal(policy.compactCopy, true);
  assert.equal(policy.maxSupportLines, 2);
});
```

Add source/content assertions that mobile read drawers do not render more than one primary status/action plus two support lines and keep the existing portrait Social aspect ratio.

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-screen-ui.test.js tests/home-screen-legibility-v24.test.js tests/home-view.test.js`

Expected: FAIL on missing presentation policy/read CSS.

- [ ] **Step 3: Implement presentation policy without unnecessary redraws**

Use a stable presentation key:

```js
const key = `${active ? 1 : 0}:${read ? 1 : 0}:${compact ? 1 : 0}`;
if (key === presentationKey) return false;
presentationKey = key;
```

Only resize/redraw when the key or data changes.

- [ ] **Step 4: Simplify mobile read content**

Keep exact semantic content but compact text. Example Social read mode:

```js
label(context, data.pathTitle, 52, 174, 58, "#ffffff", 840);
label(context, `${data.lessonCount} lezione`, 52, 288, 42, "#ffffff", 820);
label(context, "Reach · Impression", 52, 370, 30, "#d9ebf8", 720);
label(context, "Watch time · Retention", 52, 418, 30, "#d9ebf8", 720);
label(context, "Apri il percorso →", 52, 800, 34, "#91c9ff", 820);
```

Do not add decorative microcopy.

- [ ] **Step 5: Connect director read state to screens**

`study-room-renderer.js` calls:

```js
station.screenHandle?.setPresentation?.({
  active: id === direction.stationId,
  read: id === direction.stationId && direction.phase === "read",
  compact: cameraLayout === "mobile"
});
```

- [ ] **Step 6: Reduce external caption dominance**

CSS rules use `--home-caption-strength` and `[data-home-phase="read"]`:

```css
.home-journey[data-home-state="ready"] .home-captions {
  opacity: var(--home-caption-strength, 1);
}
.home-journey[data-home-phase="read"] .home-station-caption.is-active {
  background: linear-gradient(90deg, rgba(5,9,15,.42), rgba(5,9,15,.06));
}
@media (max-width: 760px) {
  .home-journey[data-home-phase="read"] .home-station-caption.is-active small,
  .home-journey[data-home-phase="read"] .home-station-caption.is-active b { display: none; }
}
```

Do not place the caption over the projected active screen.

- [ ] **Step 7: Run focused tests**

Run: `node --test tests/home-screen-ui.test.js tests/home-screen-legibility-v24.test.js tests/home-view.test.js tests/home-camera-timeline.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/home/scene/screen-ui.js src/home/scene/study-room-renderer.js styles/home-immersive.css tests/home-screen-ui.test.js tests/home-screen-legibility-v24.test.js tests/home-view.test.js
git commit -m "feat: add V25 station read mode"
```

---

### Task 5: Rebalance Lighting Around Room Ratios Instead of Large Focus Boosts

**Files:**
- Modify: `src/home/scene/lighting-controller.js`
- Modify: `src/home/scene/renderer-setup.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-lighting.test.js`
- Modify: `tests/home-renderer-profile.test.js`

**Interfaces:**
- `lighting.apply(progress, context)` continues to return sampled state.
- Add context fields `readStrength`, `lightingScale`, `exitProgress`, `crashProgress`.
- No more than two shadow-casting lights; V25 keeps only the existing directional key as the default caster unless a second practical caster is explicitly enabled by high profile.

- [ ] **Step 1: Add failing bounded-lighting tests**

```js
test("focused lighting remains a bounded ratio adjustment", () => {
  const controller = createLightingController();
  const state = controller.sample(.5, "social");
  assert.ok(state.focusBoost <= .8);
  assert.ok(state.ambient >= .42);
  assert.ok(state.roomBase >= .2);
});

test("final Paths convergence never blacks out the room", () => {
  const controller = createLightingController();
  const final = controller.sample(1, "future-paths", { exitProgress: .9 });
  assert.ok(final.ambient >= .4);
  assert.ok(final.peripheralFloor >= .12);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-lighting.test.js tests/home-renderer-profile.test.js`

Expected: FAIL because V24 `focusBoost` is 2.8 and new state fields do not exist.

- [ ] **Step 3: Replace focus spike with bounded room ratios**

Target state ranges:

```js
ambient: .46 to .54
roomBase: .22 to .55
focusBoost: 0 to .7
peripheralFloor: >= .12
```

Zone light intensity should be base cumulative activation + bounded focus adjustment. Screen emissive intensity should remain restrained; no station gets a multi-x jump equivalent to V24 `2.8` focus boost.

- [ ] **Step 4: Add final convergence**

As `exitProgress` rises, reduce unrelated zone emphasis toward `peripheralFloor`, keep Paths readable, and keep ambient/key stable. Do not flash exposure or set the room to black.

- [ ] **Step 5: Keep shadow policy bounded**

Assert the setup contains at most two `.castShadow = true` light assignments. Default should remain the key directional light only.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/home-lighting.test.js tests/home-renderer-profile.test.js tests/home-realism-pipeline.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/home/scene/lighting-controller.js src/home/scene/renderer-setup.js src/home/scene/study-room-renderer.js tests/home-lighting.test.js tests/home-renderer-profile.test.js
git commit -m "feat: rebalance V25 room lighting"
```

---

### Task 6: Upgrade Pointer Depth into Weighted Semantic Clusters

**Files:**
- Modify: `src/home/scene/parallax-rig.js`
- Modify: `src/home/scene/renderer-setup.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-parallax-v24.test.js`
- Modify: `tests/home-parallax.test.js`

**Interfaces:**
- Each layer adds `cluster` and `weight` while retaining `depth`, `damping`, `translation`, `rotation`.
- Add `parallaxRig.setAmplitude(value)` in range `0..1`.
- Heavy objects always have lower translation/rotation product than lightweight paper layers.

- [ ] **Step 1: Add failing cluster/weight tests**

```js
test("V25 parallax layers are grouped and physically weighted", () => {
  const source = readFileSync(new URL("../src/home/scene/renderer-setup.js", import.meta.url), "utf8");
  for (const cluster of ["desk", "memory", "social", "paths"]) assert.match(source, new RegExp(`cluster: ["']${cluster}["']`));
  assert.match(source, /weight:\s*"light"/);
  assert.match(source, /weight:\s*"medium"/);
  assert.match(source, /weight:\s*"heavy"/);
});
```

Add a unit test around a fake light layer and fake heavy layer showing the heavy layer moves less after identical target/update calls.

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-parallax-v24.test.js tests/home-parallax.test.js`

Expected: FAIL on missing cluster/weight/amplitude behavior.

- [ ] **Step 3: Define at most 12 layers across four clusters**

Use existing named objects plus one or two already-present props. Keep major furniture static. Example metadata:

```js
{ name: "review-card-1", cluster: "memory", weight: "light", depth: 1, ... }
{ name: "ceramic-mug", cluster: "desk", weight: "medium", depth: .58, ... }
{ name: "keyboard", cluster: "desk", weight: "heavy", depth: .24, ... }
{ name: "future-binder-1", cluster: "paths", weight: "medium", depth: .5, ... }
```

- [ ] **Step 4: Add amplitude scaling to the rig**

```js
let amplitude = 1;
function setAmplitude(value = 1) { amplitude = clamp(value, 0, 1); }
```

Apply amplitude after target interpolation, before per-layer translation/rotation. `restoreImmediately()` remains exact.

- [ ] **Step 5: Connect director velocity/read scaling**

When pointer parallax is enabled:

```js
parallaxRig.setAmplitude(direction.parallaxScale);
```

When mobile, reduced motion, or exit is active: amplitude 0 and restore to base.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/home-parallax-v24.test.js tests/home-parallax.test.js tests/home-director-v25.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/home/scene/parallax-rig.js src/home/scene/renderer-setup.js src/home/scene/study-room-renderer.js tests/home-parallax-v24.test.js tests/home-parallax.test.js
git commit -m "feat: add weighted V25 depth clusters"
```

---

### Task 7: Add One Local CC0 Hero Prop with a Safe glTF Fallback

**Files:**
- Create: `src/home/scene/asset-registry.js`
- Create: `assets/3d/desk-lamp-arm-01/**`
- Create: `assets/3d/ATTRIBUTION.md`
- Create: `tests/home-assets-v25.test.js`
- Modify: `scripts/vendor-three.mjs`
- Create via vendor script: `vendor/three/examples/jsm/loaders/GLTFLoader.js`
- Modify: `src/home/scene/renderer-setup.js`
- Modify: `src/home/scene/build-room.js` only to expose the procedural lamp replacement anchor cleanly.

**Interfaces:**
- Source asset: Poly Haven **Desk Lamp Arm 01**, author Kuutti Siitonen / Yann Kervran, CC0.
- Runtime source is always repository-local; no request to `polyhaven.com` occurs in production.
- `createAssetRegistry({ THREE, timeoutMs = 6000 })` returns:
  - `loadDeskLamp()` → `Promise<Object3D | null>`
  - `dispose()`
- If load/parse/timeout fails, renderer keeps the existing procedural `articulated-desk-lamp`.

- [ ] **Step 1: Add failing local-only/license/payload tests**

```js
test("V25 hero model is local, CC0 documented and inside budget", () => {
  const attribution = readFileSync("assets/3d/ATTRIBUTION.md", "utf8");
  assert.match(attribution, /Desk Lamp Arm 01/i);
  assert.match(attribution, /CC0/i);
  assert.match(attribution, /Poly Haven/i);
  const files = collectFiles("assets/3d/desk-lamp-arm-01");
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  assert.ok(total <= 8 * 1024 * 1024, `desk lamp payload ${total}`);
  assert.ok(files.every(file => !/4k/i.test(file)));
});
```

Add source assertions that `asset-registry.js` contains no `http://` or `https://` runtime asset URL and has a finite timeout.

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-assets-v25.test.js`

Expected: FAIL because the registry/vendor loader/asset do not exist.

- [ ] **Step 3: Vendor GLTFLoader locally**

Update `scripts/vendor-three.mjs`:

```js
vendorAddon("loaders/GLTFLoader.js", "loaders/GLTFLoader.js")
```

Run: `npm ci && npm run vendor:three`

Confirm `vendor/three/examples/jsm/loaders/GLTFLoader.js` imports the local Three module, not package specifier `three`.

- [ ] **Step 4: Download and optimize the CC0 lamp once**

Use the Poly Haven `desk_lamp_arm_01` 1K glTF package. Commit only runtime-needed glTF/bin/1K texture files under `assets/3d/desk-lamp-arm-01/`. Remove 2K/4K duplicates, preview images and unused maps. Keep total directory ≤ 8 MB; if the 1K package exceeds 8 MB before optimization, reduce image dimensions/quality until under 8 MB without introducing another service.

- [ ] **Step 5: Record source/license**

`assets/3d/ATTRIBUTION.md` must include:

```md
## Desk Lamp Arm 01
- Source: Poly Haven — Desk Lamp Arm 01
- Authors: Kuutti Siitonen (modeling/texturing), Yann Kervran (rigging)
- License: CC0 1.0 / public domain dedication
- Runtime copy: optimized 1K glTF files stored in `assets/3d/desk-lamp-arm-01/`
- Production network dependency: none
```

- [ ] **Step 6: Implement asset registry with timeout and disposal**

Use the vendored `GLTFLoader`. The URL is relative/local. `Promise.race` with a 6000 ms timeout returns `null` on failure; it must not reject the entire Home renderer. Registry tracks loaded geometries/materials/textures for disposal.

- [ ] **Step 7: Replace only the procedural lamp when load succeeds**

After `buildStudyRoom()`, locate `articulated-desk-lamp`. If the glTF object loads, normalize scale/position/rotation to the existing lamp anchor, copy semantic name/userData, add it to the same parent, then hide/remove only the procedural lamp. If load returns `null`, leave procedural geometry untouched.

Do not replace the interactive station screens or semantic hit areas.

- [ ] **Step 8: Run asset + realism + startup tests**

Run: `node --test tests/home-assets-v25.test.js tests/home-realism-pipeline.test.js tests/home-realistic-props.test.js tests/home-startup.test.js`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/vendor-three.mjs vendor/three/examples/jsm/loaders/GLTFLoader.js src/home/scene/asset-registry.js src/home/scene/renderer-setup.js src/home/scene/build-room.js assets/3d tests/home-assets-v25.test.js
git commit -m "feat: add local CC0 V25 hero prop"
```

---

### Task 8: Add the Late Crash Zoom and Strengthen Home ↔ Paths Handoff

**Files:**
- Create: `tests/home-crash-zoom-v25.test.js`
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/camera-timeline.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/home-shared-transition.js`
- Modify: `src/home/home-route-state.js`
- Modify: `src/home/paths-return-controller.js`
- Modify: `src/views/paths-view.js` only if receiving data attributes/classes need the new crash phase.
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-exit-journey.test.js`
- Modify: `tests/home-shared-transition.test.js`
- Modify: `tests/home-route-state.test.js`
- Modify: `tests/paths-return-controller.test.js`

**Interfaces:**
- `resolveExitChoreography(exitProgress, { reducedMotion = false } = {})` returns:
  `{ establish, dolly, preCrash, crash, handoff }`.
- Crash phase: approximately `.76..94` of exit.
- Handoff begins around `.90` and route cannot commit before visual completion ≥ `.90`.
- Crash camera uses forward position rush + FOV narrowing; FOV never widens in crash.
- Mobile crash is weaker than desktop.
- Reduced motion sets `crash = 0` and uses dolly + shared opacity handoff.
- Reverse resume must land before crash start, around exit progress `.70..74`, not `.97` raw journey.

- [ ] **Step 1: Write failing crash tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";
import { resolveExitChoreography } from "../src/home/home-experience.js";

test("crash zoom is a late bounded phase after pre-crash settle", () => {
  assert.equal(resolveExitChoreography(.70).crash, 0);
  assert.ok(resolveExitChoreography(.84).crash > 0);
  assert.equal(resolveExitChoreography(.94).crash, 1);
});

test("crash zoom rushes forward while narrowing FOV", () => {
  for (const layout of ["desktop", "mobile"]) {
    const timeline = createCameraTimeline({ layout });
    const before = timeline.exit(.76);
    const during = timeline.exit(.90);
    assert.equal(during.phase, "crash");
    assert.ok(during.fov < before.fov, `${layout} crash must narrow FOV`);
    assert.ok(Math.abs(during.position[0] - before.position[0]) < 1.2, `${layout} crash lateral overshoot`);
  }
});

test("reduced motion removes fast crash acceleration", () => {
  const state = resolveExitChoreography(.86, { reducedMotion: true });
  assert.equal(state.crash, 0);
  assert.ok(state.handoff >= 0);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/home-crash-zoom-v25.test.js tests/home-exit-journey.test.js tests/home-shared-transition.test.js tests/home-route-state.test.js tests/paths-return-controller.test.js`

Expected: FAIL because V24 has only establish/dolly/handoff and route-state resume clamps to `.97`.

- [ ] **Step 3: Expand exit choreography**

Use these ranges:

```js
establish: 0.00..0.18
dolly: 0.18..0.68
preCrash: 0.68..0.76
crash: 0.76..0.94
handoff: 0.90..1.00
```

For reduced motion: `crash = 0`; keep establish/dolly/handoff scroll-driven.

- [ ] **Step 4: Add crash camera anchors**

Add desktop/mobile `PRE_CRASH`, `CRASH`, `SCREEN_LOCK` poses. The crash target stays exactly the Paths display center. From pre-crash to crash:

- z/forward distance changes sharply toward Paths;
- x lateral movement is small;
- FOV narrows moderately;
- mobile FOV remains within its stricter safe range.

`timeline.exit()` returns phase names `establish`, `dolly`, `pre-crash`, `crash`, `handoff`.

- [ ] **Step 5: Synchronize shared portal with crash projection**

`updateSharedHandoff()` starts portal tracking before final route commit. During crash/handoff, pass both projected `sourceRect` and progress. Shared portal border radius converges from screen-like radius to `0px`, while the projected screen grows. No white/blank frame.

- [ ] **Step 6: Commit route only after visual dominance**

`shouldExit` requires `handoff >= .9` and `rawProgress` final threshold. Do not call navigation when crash has begun but portal is not dominant.

- [ ] **Step 7: Move reverse resume to pre-crash region**

Change route-state clamp so cinematic resume can represent the calculated raw progress corresponding to exit progress around `.72`. Home marks that value when beginning exit. Paths reverse returns to that saved point. Existing re-entry hysteresis remains active so returning Home cannot immediately bounce to Paths.

- [ ] **Step 8: Reduced-motion final behavior**

Renderer must not sample the fast crash camera when reduced motion is active. It should continue user-controlled dolly/screen lock and shared opacity handoff. Reverse remains available.

- [ ] **Step 9: Run final-transition tests**

Run: `node --test tests/home-crash-zoom-v25.test.js tests/home-exit-journey.test.js tests/home-shared-transition.test.js tests/home-route-state.test.js tests/paths-return-controller.test.js tests/home-transition.test.js`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/home/home-experience.js src/home/scene/camera-timeline.js src/home/scene/study-room-renderer.js src/home/home-shared-transition.js src/home/home-route-state.js src/home/paths-return-controller.js src/views/paths-view.js styles/home-immersive.css tests/home-crash-zoom-v25.test.js tests/home-exit-journey.test.js tests/home-shared-transition.test.js tests/home-route-state.test.js tests/paths-return-controller.test.js
git commit -m "feat: add V25 crash zoom Paths handoff"
```

---

### Task 9: V25 Release Token, Regression Suite and GitHub Pages Verification

**Files:**
- Modify first: `tests/home-deployment.test.js`
- Then modify: `index.html` and every V25 Home dependency import carrying the release query token.
- Test: full `tests/**` through `npm test`.

**Interfaces:**
- Exact V25 token: `20260830-25`.
- No stale `20260829-24` token may remain in the reachable Home dependency graph.
- Final claim requires Node suite + committed-secret check + GitHub Pages success on the same final SHA.

- [ ] **Step 1: Make the deployment test demand V25 before changing production imports**

Update:

```js
const RELEASE_TOKEN = "20260830-25";
```

in `tests/home-deployment.test.js`.

- [ ] **Step 2: Run deployment test and verify RED**

Run: `node --test tests/home-deployment.test.js`

Expected: FAIL because production graph still carries `20260829-24`.

- [ ] **Step 3: Bump the complete Home dependency graph to V25**

Update `index.html` and every Home/scene/shared-transition import reachable from it to `?v=20260830-25`. Include newly added `director-controller.js`, `asset-registry.js` and vendored `GLTFLoader.js` imports where cache tokens are used.

- [ ] **Step 4: Run targeted V25 suite**

Run:

```bash
node --test \
  tests/home-director-v25.test.js \
  tests/home-camera-timeline.test.js \
  tests/home-screen-ui.test.js \
  tests/home-screen-legibility-v24.test.js \
  tests/home-lighting.test.js \
  tests/home-parallax-v24.test.js \
  tests/home-assets-v25.test.js \
  tests/home-crash-zoom-v25.test.js \
  tests/home-shared-transition.test.js \
  tests/home-startup.test.js \
  tests/home-deployment.test.js
```

Expected: PASS.

- [ ] **Step 5: Run full local verification**

Run:

```bash
npm test
node scripts/check-secrets.mjs
```

Expected: both exit 0.

- [ ] **Step 6: Verify cost/dependency policy locally**

Search the Home runtime graph and `assets/3d` metadata. Confirm:

- no new paid service or payment-required dependency;
- no remote model/texture URL at runtime;
- no image-generation dependency;
- Desk Lamp Arm 01 source/license is recorded as CC0;
- asset payload test passes;
- Three.js stays locked at `0.185.1`.

- [ ] **Step 7: Commit the V25 release graph**

```bash
git add index.html src styles vendor assets tests scripts
git commit -m "release: publish Study Hub Home V25"
```

- [ ] **Step 8: Verify the exact final SHA in GitHub Actions**

On the exact final commit SHA:

- Test workflow conclusion: `success`.
- `Run node --test`: `success`.
- `Check for committed secrets`: `success`.
- GitHub Pages build/deployment conclusion: `success`.

If any workflow runs against a different SHA, do not use it as release evidence.

- [ ] **Step 9: Production check URL**

Use:

`https://matteo1234ay.github.io/study-hub-v3/?v=20260830-25#/home`

Check as far as available tooling permits, then ask the user to visually judge desktop and mobile because this environment cannot guarantee subjective visual parity with the reference site.
