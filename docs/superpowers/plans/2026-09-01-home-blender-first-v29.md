# Study Hub Home V29 Blender-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the V28 blue/plastic-looking procedural hero with a reproducible Blender-first 3D homepage whose real mechanical parts scrub through a cinematic studio → digital archive journey.

**Architecture:** Blender owns the hero room, furniture, materials, node hierarchy, pivots and animation clips. Three.js owns camera, deterministic scroll-to-time scrubbing, dynamic monitor UI, digital archive effects, responsive quality and the final `#/paths` handoff. V28 procedural geometry survives only as a loading failure fallback and must never flash before V29 readiness.

**Tech Stack:** Blender 4.x headless, Python/bpy, glTF/GLB, Three.js vendored locally, `GLTFLoader`, `AnimationMixer`, GitHub Actions, GitHub Pages, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-01-home-blender-first-v29-design.md`

## Global Constraints

- Hosting remains GitHub Pages only.
- No paid API, backend, CDN, runtime asset host, analytics or tracker.
- Runtime Three.js remains vendored locally.
- Primary V29 asset must include the Blender source and runtime GLB.
- Preferred V29 GLB + texture budget: <= 12 MiB; hard limit 18 MiB.
- Texture maximum: 1024 px per side, 512 px where sufficient.
- Physical surfaces must not have a dominant blue palette; blue is reserved for UI, LED and digital archive accents.
- The V29 GLB must expose stable named nodes and animation clips.
- Scroll progress is the only timeline source; no autoplay and no timeout-driven choreography.
- Desktop and mobile keep the same narrative with dedicated camera treatment.
- Fallback order: V29 GLB → V28 procedural → accessible DOM.
- V28 must not flash before V29 readiness.
- Every implementation task follows TDD and ends in a dedicated commit.

---

## File Structure

### New files

- `scripts/blender/build-home-v29.py` — deterministic Blender scene generator, materials, node hierarchy, pivots, actions, save `.blend`, export `.glb`.
- `.github/workflows/build-home-v29.yml` — manual/branch Blender headless build and artifact validation workflow.
- `assets/3d/home-v29/study-hub-home-v29.blend` — generated editable Blender source.
- `assets/3d/home-v29/study-hub-home-v29.glb` — generated runtime asset.
- `src/home/scene/home-v29-contract.js` — stable node/clip names and timeline windows shared by loader/runtime/tests.
- `src/home/scene/home-v29-controller.js` — `AnimationMixer` setup and deterministic scrub API.
- `src/home/scene/home-v29-material-policy.js` — runtime validation/fallback helpers for V29 material families and scene readiness.
- `tests/home-v29-assets.test.js` — GLB header/size/node/clip/material contract tests.
- `tests/home-v29-runtime.test.js` — loader, scrub, readiness, fallback and no-autoplay tests.
- `tests/home-v29-visual-contract.test.js` — static acceptance guards against monochrome blue / procedural hero regression.

### Modified files

- `src/home/scene/asset-registry.js` — load V29 first with finite timeout; V28 only as fallback.
- `src/home/scene/renderer-setup.js` — mount V29 scene, hide procedural hero only after successful V29 readiness.
- `src/home/scene/study-room-renderer.js` — create/update V29 controller and use shared journey state.
- `src/home/scene/camera-timeline.js` — replace station-tour framing with the V29 cinematic sequence while preserving handoff API.
- `src/home/scene/lighting-controller.js` — practical warm lamp + neutral key + restrained cool fill; digital transition only later.
- `src/home/scene/materials.js` — procedural fallback palette becomes neutral, never a blue-dominant visual alternative.
- `src/home/home-experience.js` — readiness must wait for a real V29 frame or explicit fallback decision.
- `styles/home-immersive.css` — simplify overlays so 3D is dominant and avoid duplicated navigation weight.
- `assets/3d/ATTRIBUTION.md` — document V29 as project-authored and Blender-reproducible.
- `tests/home-deployment.test.js` — V29 release token across the full home graph.

---

### Task 1: Lock the V29 asset/runtime contract with failing tests

**Files:**
- Create: `src/home/scene/home-v29-contract.js`
- Create: `tests/home-v29-assets.test.js`
- Create: `tests/home-v29-runtime.test.js`
- Create: `tests/home-v29-visual-contract.test.js`

**Interfaces:**
- Produces: `HOME_V29_NODES`, `HOME_V29_CLIPS`, `HOME_V29_WINDOWS`, `HOME_V29_RELEASE`.
- Later tasks consume these constants; node and clip names must never be duplicated as ad-hoc string literals.

- [ ] **Step 1: Write the contract constants**

```js
export const HOME_V29_RELEASE = "20260901-29";

export const HOME_V29_NODES = Object.freeze([
  "DeskRoot",
  "DrawerTop",
  "DrawerMiddle",
  "ChairRoot",
  "LampRoot",
  "LampJointLower",
  "LampJointUpper",
  "LampHead",
  "CabinetDoor",
  "PulloutShelf",
  "MonitorScreenAnchor"
]);

export const HOME_V29_CLIPS = Object.freeze([
  "LampWake",
  "ChairClear",
  "DrawerReveal",
  "DrawerSecondary",
  "CabinetOpen",
  "ShelfPull",
  "BooksRelease",
  "PaperLift"
]);

export const HOME_V29_WINDOWS = Object.freeze({
  LampWake: [0.12, 0.22],
  ChairClear: [0.14, 0.27],
  DrawerReveal: [0.18, 0.31],
  DrawerSecondary: [0.23, 0.32],
  CabinetOpen: [0.27, 0.39],
  ShelfPull: [0.31, 0.43],
  BooksRelease: [0.40, 0.58],
  PaperLift: [0.43, 0.60]
});
```

- [ ] **Step 2: Write failing asset tests**

Test requirements:

```js
assert.ok(existsSync("assets/3d/home-v29/study-hub-home-v29.blend"));
assert.ok(existsSync("assets/3d/home-v29/study-hub-home-v29.glb"));
const glb = readFileSync("assets/3d/home-v29/study-hub-home-v29.glb");
assert.equal(glb.subarray(0, 4).toString("utf8"), "glTF");
assert.equal(glb.readUInt32LE(4), 2);
assert.equal(glb.readUInt32LE(8), glb.length);
assert.ok(glb.length <= 18 * 1024 * 1024);
```

Parse the GLB JSON chunk and assert every `HOME_V29_NODES` name is present, at least one `ChairWheel_`, `Book_`, `Paper_`, and `ArchiveOrigin_` node exists, and every `HOME_V29_CLIPS` action name is present.

- [ ] **Step 3: Write failing visual-contract tests**

Read `scripts/blender/build-home-v29.py` and assert it defines distinct named material families containing `Walnut`, `Graphite` or `Aluminum`, `Fabric_Charcoal`, `Paper`, `Glass`, and `Wall_Plaster`; reject primary material names matching `/blue.*(metal|fabric|floor)|deep-blue-floor/i`.

Also assert the script creates separate objects named `DrawerTop`, `DrawerMiddle`, `CabinetDoor`, `PulloutShelf`, `LampJointLower`, `LampJointUpper` and curved chair geometry through either bevel/subdivision/curve operations rather than only raw cube dimensions.

- [ ] **Step 4: Write failing runtime tests**

Assert the future controller contains `THREE.AnimationMixer`, pauses actions, sets action time from journey progress, and has no `.play()`-driven autoplay path.

- [ ] **Step 5: Run tests to verify RED**

Run:

```bash
node --test tests/home-v29-assets.test.js tests/home-v29-runtime.test.js tests/home-v29-visual-contract.test.js
```

Expected: FAIL because V29 Blender asset/controller do not yet exist.

- [ ] **Step 6: Commit**

```bash
git add src/home/scene/home-v29-contract.js tests/home-v29-*.test.js
git commit -m "test: define blender-first home v29 contract"
```

---

### Task 2: Build the real Blender scene generator and headless workflow

**Files:**
- Create: `scripts/blender/build-home-v29.py`
- Create: `.github/workflows/build-home-v29.yml`
- Modify: `assets/3d/ATTRIBUTION.md`
- Test: `tests/home-v29-visual-contract.test.js`

**Interfaces:**
- Consumes: `HOME_V29_NODES` and `HOME_V29_CLIPS` naming contract conceptually.
- Produces: reproducible `.blend` and `.glb` with stable node/action names.

- [ ] **Step 1: Implement deterministic Blender scene setup**

The Python script must:

```python
SCENE_NAME = "StudyHubHomeV29"
BLEND_OUT = ROOT / "assets/3d/home-v29/study-hub-home-v29.blend"
GLB_OUT = ROOT / "assets/3d/home-v29/study-hub-home-v29.glb"

bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
bpy.context.scene.unit_settings.system = "METRIC"
bpy.context.scene.unit_settings.scale_length = 1.0
```

Create physically separate collections: `Architecture`, `Desk`, `Chair`, `Lamp`, `Cabinet`, `Props`, `ArchiveAnchors`.

- [ ] **Step 2: Implement non-monochrome PBR material families**

Use Principled BSDF materials with clearly separated values:

```python
wall = material("Wall_Plaster_Warm", (0.62, 0.60, 0.56), metallic=0.0, roughness=0.92)
walnut = material("Walnut_Oiled", (0.22, 0.09, 0.035), metallic=0.0, roughness=0.46)
graphite = material("Graphite_Powdercoat", (0.035, 0.04, 0.045), metallic=0.55, roughness=0.42)
aluminum = material("Aluminum_Satin", (0.42, 0.45, 0.48), metallic=0.9, roughness=0.24)
fabric = material("Fabric_Charcoal", (0.055, 0.052, 0.05), metallic=0.0, roughness=0.95)
paper = material("Paper_Warm", (0.82, 0.79, 0.70), metallic=0.0, roughness=0.88)
glass = material("Glass_Monitor", (0.008, 0.01, 0.012), metallic=0.0, roughness=0.08)
```

Study Hub blue may only appear on emissive screen/accent materials.

- [ ] **Step 3: Model mechanical hierarchy with real pivots**

Create empties/parents at actual movement axes. Example:

```python
drawer_top = make_drawer("DrawerTop", parent=desk_root, ...)
drawer_top.location = closed_location
# movement is local Z or Y according to Blender orientation, constrained to one axis

cabinet_pivot = bpy.data.objects.new("CabinetDoorPivot", None)
cabinet_pivot.location = hinge_world_position
cabinet_door.parent = cabinet_pivot
```

Chair seat/back must use subdivision/beveled profiles and curved support surfaces; lamp joints must be separate objects parented around real hinge positions.

- [ ] **Step 4: Create named animation actions**

Create actions with explicit frame ranges and keyframes for all required clips. Each clip affects only its intended hierarchy. Example for `DrawerReveal`:

```python
action = bpy.data.actions.new("DrawerReveal")
drawer_top.animation_data_create()
drawer_top.animation_data.action = action
key_location(drawer_top, frame=1, value=closed)
key_location(drawer_top, frame=36, value=open)
set_bezier_handles(action)
```

Use restrained ease-in/ease-out; do not loop.

- [ ] **Step 5: Save `.blend` and export `.glb`**

```python
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
bpy.ops.export_scene.gltf(
    filepath=str(GLB_OUT),
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_animations=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=True,
)
```

- [ ] **Step 6: Add a free GitHub Actions Blender build workflow**

Workflow requirements:

```yaml
name: Build Home V29 Blender Asset
on:
  workflow_dispatch:
  push:
    branches: [feat/home-blender-first-v29]
    paths:
      - scripts/blender/build-home-v29.py
      - .github/workflows/build-home-v29.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Blender
        run: sudo apt-get update && sudo apt-get install -y blender
      - name: Build scene
        run: blender --background --python scripts/blender/build-home-v29.py
      - name: Validate artifacts
        run: node --test tests/home-v29-assets.test.js tests/home-v29-visual-contract.test.js
      - uses: actions/upload-artifact@v4
        with:
          name: study-hub-home-v29
          path: |
            assets/3d/home-v29/study-hub-home-v29.blend
            assets/3d/home-v29/study-hub-home-v29.glb
```

- [ ] **Step 7: Run the workflow and retrieve artifacts**

Expected: workflow succeeds and publishes both files. Download the artifact, verify GLB header/version/length, then commit the exact generated binaries to the branch.

- [ ] **Step 8: Re-run asset/visual tests to GREEN**

```bash
node --test tests/home-v29-assets.test.js tests/home-v29-visual-contract.test.js
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/blender/build-home-v29.py .github/workflows/build-home-v29.yml assets/3d/home-v29 assets/3d/ATTRIBUTION.md
git commit -m "feat: build blender-first home v29 scene"
```

---

### Task 3: Load V29 first and make fallback explicit

**Files:**
- Modify: `src/home/scene/asset-registry.js`
- Modify: `src/home/scene/renderer-setup.js`
- Test: `tests/home-v29-runtime.test.js`

**Interfaces:**
- Produces: `loadHomeV29(): Promise<{scene, animations}|null>` and renderer state `heroMode: "v29" | "v28-fallback"`.

- [ ] **Step 1: Extend failing runtime tests**

Require a local URL only:

```js
const HOME_V29_MODEL = new URL("../../../assets/3d/home-v29/study-hub-home-v29.glb", import.meta.url).href;
```

Assert the loader uses a finite timeout through `Promise.race`, returns `null` on failure, and contains no executable `http://` or `https://` URL.

- [ ] **Step 2: Implement `loadHomeV29`**

Reuse the existing finite `loadModel` helper and return the loader result including animations.

- [ ] **Step 3: Mount V29 without V28 flash**

`renderer-setup.js` must keep the procedural hero hidden while V29 is pending. On successful load:

```js
v29Scene.name = "home-v29-hero";
room.group.add(v29Scene);
room.heroAsset = v29Scene;
room.heroMode = "v29";
setProceduralHeroVisible(room, false);
```

On timeout/failure only:

```js
room.heroMode = "v28-fallback";
setProceduralHeroVisible(room, true);
```

- [ ] **Step 4: Run targeted tests**

```bash
node --test tests/home-v29-runtime.test.js tests/home-digital-archive-v27.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/home/scene/asset-registry.js src/home/scene/renderer-setup.js tests/home-v29-runtime.test.js
git commit -m "feat: load v29 hero before procedural fallback"
```

---

### Task 4: Scrub Blender animation clips from scroll deterministically

**Files:**
- Create: `src/home/scene/home-v29-controller.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Test: `tests/home-v29-runtime.test.js`

**Interfaces:**
- Consumes: `HOME_V29_CLIPS`, `HOME_V29_WINDOWS`, loaded `{scene, animations}`.
- Produces: `createHomeV29Controller({THREE, scene, animations})` with `setProgress(progress)`, `setQuality(profile)`, `dispose()`.

- [ ] **Step 1: Add failing scrub tests**

Test pure mapping helper:

```js
assert.equal(mapClipProgress(0.12, [0.12, 0.22]), 0);
assert.equal(mapClipProgress(0.22, [0.12, 0.22]), 1);
assert.ok(Math.abs(mapClipProgress(0.17, [0.12, 0.22]) - 0.5) < 0.001);
```

Assert reverse scroll produces exactly the earlier action times again.

- [ ] **Step 2: Implement controller**

For every required clip:

```js
const action = mixer.clipAction(clip);
action.enabled = true;
action.paused = true;
action.clampWhenFinished = true;
action.setLoop(THREE.LoopOnce, 0);
```

`setProgress` computes local progress, sets `action.time = clip.duration * localProgress`, then calls `mixer.update(0)`.

- [ ] **Step 3: Integrate with renderer journey**

When V29 is ready, create one controller. During every draw:

```js
homeV29Controller?.setProgress(journey);
```

The archive field and the Blender controller must receive the same journey value.

- [ ] **Step 4: Run targeted tests**

```bash
node --test tests/home-v29-runtime.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/home/scene/home-v29-controller.js src/home/scene/study-room-renderer.js tests/home-v29-runtime.test.js
git commit -m "feat: scrub blender home clips from scroll"
```

---

### Task 5: Replace the blue plastic lighting/material fallback and cinematic camera

**Files:**
- Modify: `src/home/scene/materials.js`
- Modify: `src/home/scene/lighting-controller.js`
- Modify: `src/home/scene/camera-timeline.js`
- Test: `tests/home-v29-visual-contract.test.js`
- Test: existing camera/lighting tests

**Interfaces:**
- Produces: neutral fallback materials and camera phases compatible with existing `sample(progress)` / `exit(progress)` APIs.

- [ ] **Step 1: Add RED palette guards**

Reject the old primary fallback names/colors:

```js
assert.doesNotMatch(materialsSource, /satin-blue-metal|powder-coated-blue|woven-blue-fabric|deep-blue-floor/);
```

Require neutral material families and only restrained Study Hub blue emission.

- [ ] **Step 2: Change fallback physical palette**

Use warm plaster walls, neutral graphite metal, charcoal fabric, neutral floor. Keep procedural wood but reduce saturation and gloss.

- [ ] **Step 3: Re-author lighting states**

Opening: neutral key + subtle cool fill, no blue wash. At 12–27%, practical lamp becomes warm. From 60% onward digital cool/blue intensity rises while physical warm light falls.

- [ ] **Step 4: Replace camera station-tour timing with cinematic phases**

Preserve public methods but retime positions around:

```text
0.00–0.12 establish desk
0.12–0.27 drawer/lamp/chair wake
0.27–0.45 cabinet/memory lateral move
0.45–0.60 centered lift
0.60–0.78 pull-back disassembly
0.78–0.94 archive traversal
0.94–1.00 paths dolly/handoff
```

Mobile gets its own authored positions, not only larger FOV values.

- [ ] **Step 5: Run camera/lighting/visual tests**

```bash
node --test tests/home-v29-visual-contract.test.js tests/home-camera*.test.js tests/home-lighting*.test.js
```

If glob expansion does not match in the shell, run `node --test` and verify the relevant named subtests.

- [ ] **Step 6: Commit**

```bash
git add src/home/scene/materials.js src/home/scene/lighting-controller.js src/home/scene/camera-timeline.js tests/home-v29-visual-contract.test.js
git commit -m "feat: retune home art direction and camera"
```

---

### Task 6: Make physical objects become the digital archive

**Files:**
- Modify: `src/home/scene/archive-state.js`
- Modify: `src/home/scene/archive-field.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Test: `tests/home-v29-runtime.test.js`
- Test: `tests/home-digital-archive-v27.test.js`

**Interfaces:**
- Consumes: named `Book_*`, `Paper_*`, `ArchiveOrigin_*` V29 nodes.
- Produces: archive transition where particle/card origins derive from real scene anchors rather than arbitrary world positions.

- [ ] **Step 1: Add RED semantic-origin test**

Require the runtime to collect archive origins from V29 names and pass them to the archive field.

- [ ] **Step 2: Add `setOrigins(origins)` to archive field**

Use deterministic mappings from semantic origin names to archive nuclei. No random route assignment.

- [ ] **Step 3: Retune transition windows**

Make visible semantic lifting start before 50%:

```js
knowledge: smoothRange(progress, 0.27, 0.45),
semanticLift: smoothRange(progress, 0.40, 0.60),
fragment: smoothRange(progress, 0.60, 0.78),
archive: smoothRange(progress, 0.74, 0.94),
handoff: smoothRange(progress, 0.94, 1)
```

- [ ] **Step 4: Hide physical scene by hierarchy during disassembly**

Drive opacity/scale/offset only from deterministic progress and named semantic groups. Lightweight props move first; desk/architecture last. Do not globally fade the whole room.

- [ ] **Step 5: Run transition tests**

```bash
node --test tests/home-v29-runtime.test.js tests/home-digital-archive-v27.test.js
```

Expected: PASS and reversibility preserved.

- [ ] **Step 6: Commit**

```bash
git add src/home/scene/archive-state.js src/home/scene/archive-field.js src/home/scene/study-room-renderer.js tests/home-v29-runtime.test.js tests/home-digital-archive-v27.test.js
git commit -m "feat: transform physical v29 props into archive"
```

---

### Task 7: Simplify homepage chrome and guarantee V29 readiness

**Files:**
- Modify: `src/home/home-experience.js`
- Modify: `styles/home-immersive.css`
- Test: `tests/home-v29-runtime.test.js`
- Test: existing home readiness/mobile tests

**Interfaces:**
- Consumes: renderer audit/readiness including `heroMode`.
- Produces: no legacy/procedural flash and lighter UI overlays.

- [ ] **Step 1: Add RED readiness test**

Success path must not resolve `.ready` until the renderer reports either `heroMode === "v29"` and a rendered frame, or explicit fallback mode after a failed V29 load.

- [ ] **Step 2: Implement readiness gate**

Replace generic first-frame readiness with a two-condition gate: asset decision + successful render.

- [ ] **Step 3: Reduce duplicated navigation weight**

Keep main navbar and make secondary scene controls visually subordinate. Lower-left lesson card remains compact; captions appear only for relevant journey windows.

- [ ] **Step 4: Run home/mobile/readiness tests**

```bash
node --test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/home/home-experience.js styles/home-immersive.css tests/home-v29-runtime.test.js
git commit -m "feat: make blender home the visible first frame"
```

---

### Task 8: Release V29, full verification and visual acceptance

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/views/home-view.js`
- Modify: `src/views/paths-view.js`
- Modify: `src/home/home-experience.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/scene/renderer-setup.js`
- Modify: V29 imported scene modules as needed
- Modify: `tests/home-deployment.test.js`

**Interfaces:**
- Produces: cache-safe `20260901-29` deployment graph.

- [ ] **Step 1: Update the complete home import graph to release token `20260901-29`**

Every changed home module import and `index.html` home asset reference must use the same token. Update `RELEASE_TOKEN` in `tests/home-deployment.test.js` accordingly.

- [ ] **Step 2: Run full automated verification**

```bash
node --test
node scripts/check-secrets.mjs
```

Expected: 0 failing tests and `Nessun possibile segreto rilevato.`

- [ ] **Step 3: Run the Blender build workflow once more from final branch head**

Expected: Blender build + V29 asset validation succeed on the same source revision.

- [ ] **Step 4: Open/update draft PR and verify CI on the final commit**

Do not merge on branch-only green from an earlier commit. Verify the exact final SHA.

- [ ] **Step 5: Publish a branch/Pages preview or equivalent real browser-visible deployment**

Capture at minimum:

```text
A. first frame / 0–10%
B. drawer + lamp phase / 18–30%
C. semantic lift / 45–60%
D. archive / 80–94%
```

- [ ] **Step 6: Perform visual acceptance against the V28 screenshot**

All must be YES before merge:

```text
[ ] first frame visibly differs from V28
[ ] walls/floor are not blue dominant
[ ] at least five material families are visually distinct
[ ] desk/cabinet read as manufactured furniture, not primitive boxes
[ ] chair reads as curved fabric/metal furniture, not rectangular plastic
[ ] lamp has believable articulated joints
[ ] drawer opening is obvious and integrated into the desk
[ ] cabinet door or pullout shelf visibly moves
[ ] objects begin semantic transformation before 50% scroll
[ ] final archive replaces the room instead of overlaying particles on it
[ ] Paths handoff still works and reverses
```

If any item is NO, do not merge; fix the specific visual defect and repeat the capture.

- [ ] **Step 7: Fast-forward/merge to `main` only after exact-SHA green + visual acceptance**

After merge, verify both `Test` and `pages build and deployment` succeed for the main SHA.

- [ ] **Step 8: Verify production serves V29 token and final asset**

Confirm the public page references `20260901-29` and successfully requests local `assets/3d/home-v29/study-hub-home-v29.glb`.

- [ ] **Step 9: Commit any final release-token changes before merge**

```bash
git add index.html src tests
git commit -m "chore: release blender-first home v29"
```

---

## Self-Review

### Spec coverage

- Blender-first ownership: Tasks 2–4.
- Real mechanical pivots and animated drawers/door/shelf/chair/lamp: Task 2.
- Non-monochrome material direction: Tasks 2 and 5.
- Deterministic scroll scrubbing/reversibility: Task 4.
- Physical → semantic transformation: Task 6.
- Dedicated cinematic camera/mobile treatment: Task 5.
- No V28 flash/readiness: Tasks 3 and 7.
- Free/local/privacy-preserving pipeline: Global Constraints + Tasks 2/3/8.
- Performance/asset limits: Tasks 1/2/8.
- Visual verification before merge: Task 8.
- Cache-safe Safari deployment: Task 8.

### Placeholder scan

No TBD/TODO/"implement later" placeholders remain. Each implementation step names the required behavior and validation command.

### Interface consistency

- `HOME_V29_NODES`, `HOME_V29_CLIPS`, `HOME_V29_WINDOWS`, `HOME_V29_RELEASE` are defined once in Task 1.
- `loadHomeV29()` is introduced in Task 3 and consumed by renderer setup/controller integration.
- `createHomeV29Controller(...).setProgress(progress)` is introduced in Task 4 and consumed by the renderer.
- `archiveField.setOrigins(origins)` is introduced in Task 6 and used only after V29 named anchors are available.
- Existing `cameraTimeline.sample/exit` and Paths handoff interfaces remain stable.
