# Study Hub Immersive Home V24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current Study Hub homepage load atomically, look substantially more physically plausible, react to pointer movement through independent depth layers, keep mobile screen text readable, and transition reversibly into the general `#/paths` page.

**Architecture:** Preserve the existing six semantic Three.js stations, desktop/mobile camera timelines, cumulative lighting, reduced-motion scroll journey and route-state logic. Improve realism without paid services or runtime CDN dependencies by vendoring only MIT Three.js example modules (`RoundedBoxGeometry` and `RoomEnvironment`) and using them with richer procedural geometry/PBR materials. Add a dedicated parallax rig and a body-level transition portal for the final Home → Paths handoff.

**Tech Stack:** Vanilla ES modules, Three.js 0.185.1 vendored locally, CSS, Node 22 test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-29-immersive-home-v24-design.md`

## Global Constraints

- Zero recurring cost and zero paid dependency.
- No backend, metered API, paid CDN, external runtime 3D service or required account.
- GitHub Pages remains the deployment target.
- Preserve all six semantic stations and all existing routes.
- Preserve desktop/mobile camera choreography unless projection tests require a local adjustment.
- Reduced motion keeps user-controlled scroll progression but disables autonomous pointer parallax.
- Desktop pointer parallax uses at least four depth/damping responses and at most twelve moving scene layers.
- Mobile does not use pointer/device-orientation parallax.
- Preserve final physical runway: 140vh desktop and 180vh mobile.
- Automatic `#/paths` navigation cannot happen before 90% of final handoff progress.
- Preserve exact strings `event.key === "Escape"` and `preferences.update({ focus: false })` in `src/app.js`.
- Release token for this version: `20260829-24`.
- Every behavior change follows red-green TDD.

---

### Task 1: Remove the old-home flash during successful WebGL startup

**Files:**
- Modify: `src/views/home-view.js`
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-view.test.js`
- Create: `tests/home-startup.test.js`

**Interfaces:**
- Renderer exposes `ready: Promise<void>` resolved immediately after its first successful `renderer.render(scene, camera)`.
- Home states are `loading` → `preparing` → `ready`; `dom` is reserved for unsupported/failed WebGL.

- [ ] Write tests requiring loading/preparing to hide `.home-fallback`, requiring `renderer.ready`, and requiring the normal WebGL path never to enter `fallback`.
- [ ] Run `node --test tests/home-startup.test.js tests/home-view.test.js` and confirm RED.
- [ ] Add a minimal `.home-preload` visual shell in `home-view.js`; keep the fallback DOM present but invisible during normal loading.
- [ ] Set `homeState="preparing"` while renderer/modules initialize, await `renderer.ready`, then set `homeState="ready"`; on actual WebGL failure use `dom`.
- [ ] Resolve renderer readiness exactly once after the first successful render and reject/fail-open through the existing DOM fallback on initialization failure.
- [ ] Hide site header/footer/quick chrome during mobile `loading` and `preparing` so no old layout flashes before immersive mode.
- [ ] Run focused tests and commit `fix: make immersive home startup atomic`.

### Task 2: Vendor zero-cost geometry/environment helpers and improve PBR realism

**Files:**
- Modify: `scripts/vendor-three.mjs`
- Create: `vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js`
- Create: `vendor/three/examples/jsm/environments/RoomEnvironment.js`
- Modify: `src/home/scene/materials.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-materials.test.js`
- Modify: `tests/home-renderer-profile.test.js`
- Modify: `tests/home-deployment.test.js`

**Interfaces:**
- Vendored helper imports resolve only to local `vendor/three/three.module.min.js`.
- Renderer builds a PMREM environment from local `RoomEnvironment`; no network request is introduced.
- Materials expose physically distinct `wood`, `metal`, `paintedMetal`, `fabric`, `ceramic`, `glassOff`, `wall`, `floor` families.

- [ ] Write RED tests requiring local `RoundedBoxGeometry`, local `RoomEnvironment`, PMREM/environment usage, no `http(s)` dependency in Home scene modules, and physically plausible material ranges.
- [ ] Extend `vendor:three` to copy the exact r185 helper modules and rewrite bare `three` imports to the vendored module.
- [ ] Add ceramic/powder-coated metal material families, richer deterministic 256–512px roughness/normal detail, and subtle fabric sheen/wood directional variation.
- [ ] Generate `scene.environment` via `PMREMGenerator.fromScene(new RoomEnvironment())`; keep the designed room background and current key-light direction.
- [ ] Dispose PMREM/environment resources on route teardown.
- [ ] Run focused tests and commit `feat: add local physical room shading`.

### Task 3: Replace obvious primitive silhouettes with more believable furniture/props

**Files:**
- Modify: `src/home/scene/build-room.js`
- Modify: `tests/home-scene-semantics.test.js`
- Modify: `tests/home-mobile-cinematic-v19.test.js`

**Interfaces:**
- `buildStudyRoom({ THREE, materials, RoundedBoxGeometry })` preserves the same station IDs, hit areas, screen anchors and public room methods.
- Room exposes `realismAudit: { roundedProps, curvedProps }` for tests.

- [ ] Write RED tests requiring at least six silhouette-refined props while preserving station semantics, chair clearance and portrait screen bounds.
- [ ] Replace desk top, monitor body/base, keyboard, mouse and selected shelving pieces with rounded/beveled geometry.
- [ ] Rebuild chair seat/back with curved/rounded profiles and more plausible frame proportions while preserving its animation name/parking transform.
- [ ] Rebuild lamp with separate joints/arms/shade and small spring/cable detail; keep `lamp-shade` available to journey animation.
- [ ] Rebuild mug with ceramic body, inner wall/rim and handle; vary book/binder thickness/offsets slightly so they do not read as perfect repeated blocks.
- [ ] Keep geometry counts bounded; no decorative high-poly clutter.
- [ ] Run semantic/projection tests and commit `feat: refine physical study room silhouettes`.

### Task 4: Make every screen easier to read on mobile without zooming the camera closer

**Files:**
- Modify: `src/home/scene/screen-ui.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-screen-ui.test.js`
- Modify: `tests/home-mobile-cinematic-v19.test.js`

**Interfaces:**
- Screen handle exposes `setActive(active)` and redraws only when its resolution tier changes.
- Base canvases remain bounded; active default screens can use up to `1024×640`, active Social up to `1280×1792`.

- [ ] Write RED tests for active-resolution tier, minimum logical type sizes, one dominant primary message and no microcopy below the readable floor.
- [ ] Keep current physical screen sizes/cameras; increase only active texture density.
- [ ] Simplify each UI to one main state/title, one primary fact/progress line, at most 2–3 supporting facts and one short CTA.
- [ ] Switch active screen tier only when the active station changes; set the matching CanvasTexture `needsUpdate=true` only after redraw.
- [ ] Preserve anisotropic filtering/mipmapping and portrait Social aspect ratio.
- [ ] Run screen/projection tests and commit `feat: sharpen active study screens`.

### Task 5: Implement real independent Igloo-inspired depth motion

**Files:**
- Create: `src/home/scene/parallax-rig.js`
- Modify: `src/home/scene/interaction-controller.js`
- Modify: `src/home/scene/build-room.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-parallax.test.js`
- Modify: `tests/motion-fallback.test.js`

**Interfaces:**
- `createParallaxRig({ layers, maxLayers=12 })` captures immutable base transforms and exposes `setTarget({x,y})`, `update(deltaSeconds)`, `reset()`, `restoreImmediately()`, `audit()`.
- Layer shape: `{ object, depth, translation:{x,y}, rotation:{x,y}, damping }`.

- [ ] Write RED tests requiring 8–12 registered layers, at least four distinct depth/damping responses, translation + rotation, frame-rate-independent damping, pointer-leave return and exact base restoration.
- [ ] Normalize pointer input to `[-1,1]`; stop using one tiny scene-space offset as the entire effect.
- [ ] Register papers/review cards as strongest layers, mug/stationery as medium, binders/keyboard/mouse as lower, lamp shade/monitor shell as very low.
- [ ] Apply parallax additively after scroll-derived transforms so journey animation remains authoritative; capture journey bases before adding pointer offsets each frame to avoid transform drift.
- [ ] Give camera a separate, much smaller inertial offset.
- [ ] Disable immediately for reduced motion/mobile/final-exit and restore immutable transforms.
- [ ] Run focused tests and commit `feat: add layered inertial room depth`.

### Task 6: Rebuild the final Home → Paths handoff as a slow reversible visual continuation

**Files:**
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/camera-timeline.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/lighting-controller.js`
- Create: `src/home/home-shared-transition.js`
- Modify: `src/home/home-transition-manager.js`
- Modify: `src/views/paths-view.js`
- Modify: `src/home/paths-return-controller.js`
- Modify: `src/app.js`
- Modify: `styles/home-immersive.css`
- Modify: `tests/home-exit-journey.test.js`
- Modify: `tests/home-camera-timeline.test.js`
- Modify: `tests/home-transition.test.js`
- Create: `tests/home-shared-transition.test.js`
- Modify: `tests/paths-return-controller.test.js`

**Interfaces:**
- `resolveExitChoreography(exitProgress)` returns `{ establish, dolly, handoff }`.
- Renderer exposes `getPathsProjection()` returning the projected Paths screen rect in CSS pixels.
- `createSharedPathsTransition(...)` manages one body-level `.paths-shared-portal` that survives `app.replaceChildren()` and can run forward/reverse.

- [ ] Write RED tests requiring three-phase exit, `shouldExit` only after handoff ≥ .9, projected Paths rect, persistent portal, cinematic entry distinction and one-shot reverse return.
- [ ] Keep 140vh/180vh runway but map it into: establish room context (0–.2), slow dolly (.18–.88), visual handoff (.82–1).
- [ ] Add an intermediate establish camera before the close Paths shot; maintain continuity bounds on desktop/mobile.
- [ ] During exit, keep previous practicals on but converge guide/screen emphasis toward Paths; no abrupt blackout or blue wash.
- [ ] Project the 3D Paths screen to CSS coordinates and grow a body-level portal from that rect toward full viewport based on scroll handoff progress, not a timer.
- [ ] Navigate only when `shouldExit && handoff >= .9`; the body portal remains while the route swaps.
- [ ] Add a matching `.paths-cinematic-receiver` to general Paths; normal menu/direct entry does not activate it.
- [ ] Preserve the current wheel/touch return logic: upward scroll at the top of cinematic Paths calls reverse, navigates Home, restores the final runway around the saved resume progress and keeps anti-loop hysteresis.
- [ ] In `app.js`, do not let the generic smooth scroll fight cinematic Paths entry; preserve exact Escape/focus strings.
- [ ] Reduced motion keeps route continuity but uses an immediate/minimal-opacity portal instead of autonomous zoom.
- [ ] Run route/camera/reverse tests and commit `feat: bridge cinematic home into paths`.

### Task 7: Publish V24 coherently and verify the exact release commit

**Files:**
- Modify: `tests/home-deployment.test.js`
- Modify: `index.html`
- Modify: all changed Home/Paths browser import query tokens
- Modify: `.github/workflows/test.yml` only if new policy checks are introduced

**Interfaces:**
- Browser graph uses exactly `20260829-24`.

- [ ] Change only the deployment test token to V24 first and confirm RED while public graph remains V23.
- [ ] Atomically update every changed browser import/cache query to `20260829-24`, including newly vendored/local Home modules.
- [ ] Run/verify the complete GitHub Actions Test workflow and committed-secret check on the exact final SHA.
- [ ] Verify Pages build/deploy succeeds on that same SHA.
- [ ] Verify no changed Home runtime source contains external `http://` or `https://` asset dependency.
- [ ] Only then consider V24 published.
