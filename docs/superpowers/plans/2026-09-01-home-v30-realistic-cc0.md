# Study Hub Home V30 Realistic CC0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current V29 hero with a genuinely realistic, locally hosted CC0 + custom-Blender study environment that performs reversible mechanical actions, dematerializes semantically into the Study Hub archive, and passes real Chromium/WebKit visual QA before publication.

**Architecture:** Blender owns the physical scene, hierarchy, pivots, materials, sourced CC0 asset composition and mechanical animation clips. Three.js owns loading, deterministic scroll scrubbing, camera, lighting transition, semantic dematerialization, archive visuals, responsive quality and the `#/paths` handoff. The old V29/V28 room is never a production visual fallback: V30 failure keeps a V30 poster plus accessible navigation.

**Tech Stack:** Blender 4.x headless, Python/bpy, glTF/GLB, Three.js 0.185.1 vendored locally, `GLTFLoader`, `AnimationMixer`, Node test runner, Playwright Chromium/WebKit, GitHub Actions, GitHub Pages, CC0 Poly Haven development-time sources.

**Spec:** `docs/superpowers/specs/2026-09-01-home-v30-realistic-cc0-design.md`

## Global Constraints

- Hosting remains GitHub Pages only.
- Zero paid API, paid asset, backend, analytics or runtime CDN dependency.
- Runtime requests remain same-origin only; Poly Haven is development-time vendoring only.
- Main remains on V29 until V30 passes browser screenshot review.
- Do **not** bump the public cache token to `20260901-30` until the final release task.
- V30 must not silently instantiate V29 or V28 when the new scene fails.
- Study Hub blue is restricted to screen/UI/digital accents during the physical phase.
- Scroll progress is the only choreography clock; animation must be reversible.
- Desktop and mobile use separate authored camera framing.
- Automated tests are necessary but not sufficient: visual screenshot review is a hard merge gate.
- Each implementation task follows TDD: add/adjust a failing guard first, implement, rerun targeted tests, then full regression where appropriate.

---

## Task 1: Lock the V30 contract, CSP rule and no-old-fallback policy

**Files:**
- Create: `src/home/scene/home-v30-contract.js`
- Create: `tests/home-v30-contract.test.js`
- Create: `tests/home-v30-security.test.js`
- Later modify: `index.html`, `src/home/scene/asset-registry.js`, `src/home/scene/renderer-setup.js`, `src/home/scene/study-room-renderer.js`

**Interfaces:**

```js
export const HOME_V30_ASSET_ID = "study-hub-home-v30";

export const HOME_V30_NODES = Object.freeze([
  "V30_Root",
  "Desk_Root",
  "Drawer_Primary",
  "Drawer_Secondary",
  "Chair_Root",
  "Lamp_Root",
  "Cabinet_Root",
  "Cabinet_Door",
  "Monitor_Root",
  "Monitor_Screen_Anchor",
  "Paper_Stack",
  "Notebook_Root",
  "ArchiveOrigin_Paths",
  "ArchiveOrigin_Review",
  "ArchiveOrigin_Progress",
  "ArchiveOrigin_Assessment",
  "ArchiveOrigin_Search"
]);

export const HOME_V30_CLIPS = Object.freeze([
  "Drawer_Primary_Open",
  "Drawer_Secondary_Open",
  "Cabinet_Door_Open",
  "Lamp_Adjust",
  "Chair_Shift",
  "Paper_Lift",
  "Notebook_Lift",
  "Monitor_Info_Reveal"
]);

export const HOME_V30_WINDOWS = Object.freeze({
  Drawer_Primary_Open: Object.freeze([.15, .28]),
  Drawer_Secondary_Open: Object.freeze([.20, .34]),
  Cabinet_Door_Open: Object.freeze([.24, .38]),
  Lamp_Adjust: Object.freeze([.18, .36]),
  Chair_Shift: Object.freeze([.20, .36]),
  Paper_Lift: Object.freeze([.38, .54]),
  Notebook_Lift: Object.freeze([.43, .58]),
  Monitor_Info_Reveal: Object.freeze([.40, .60])
});

export const HOME_V30_ARCHIVE_ORIGINS = Object.freeze({
  "future-paths": "ArchiveOrigin_Paths",
  memory: "ArchiveOrigin_Review",
  progress: "ArchiveOrigin_Progress",
  assessment: "ArchiveOrigin_Assessment",
  search: "ArchiveOrigin_Search"
});
```

- [ ] **Step 1: Add contract tests first.** Assert unique required nodes/clips, valid monotonic windows, all archive origins represented, and no public release token embedded in this contract.
- [ ] **Step 2: Add CSP regression tests first.** Require `connect-src 'self' blob:` and `img-src 'self' data: blob:` while rejecting `https:`, `http:`, `*` and third-party hosts in those directives.
- [ ] **Step 3: Add a future production-source guard.** Once runtime files are migrated, executable source in `renderer-setup.js` / `study-room-renderer.js` must not contain `loadHomeV29`, `home-v29/`, `v28-fallback`, or `setProceduralHeroVisible` as the V30 fallback path.
- [ ] **Step 4: Run RED.**

```bash
node --test tests/home-v30-contract.test.js tests/home-v30-security.test.js
```

Expected: contract test can pass once constants exist; CSP/no-old-fallback assertions remain RED until later implementation.

- [ ] **Step 5: Commit.**

```bash
git commit -am "test: define home v30 contract and security gate"
```

---

## Task 2: Vendor the chosen CC0 source art locally with provenance

**Files:**
- Create: `assets/3d/home-v30/manifest.json`
- Create: `scripts/assets/vendor-home-v30-assets.mjs`
- Create: `.github/workflows/vendor-home-v30-assets.yml`
- Create: `tests/home-v30-manifest.test.js`
- Reuse: `assets/3d/desk-lamp-arm-01/*`

**Approved source set:**

- `desk_lamp_arm_01` — Desk Lamp Arm 01; reuse the already-local project copy.
- `office_notepads` — Office Notepads.
- `stationery_supplies` — Stationery Supplies.
- `drawer_cabinet` — Drawer Cabinet; static secondary storage/reference, not the hero interactive desk.
- `poly_haven_studio` — neutral studio HDRI.
- `natural_walnut_veneer` — walnut PBR surface.
- `white_plaster_02` — plaster PBR surface.

All sourced production art must be CC0 and stored locally. If a source becomes unavailable or its license metadata no longer confirms CC0, stop and choose another CC0 source before proceeding.

- [ ] **Step 1: Write manifest test RED.** Every entry requires `id`, `role`, `sourceSite`, `sourcePage`, `license`, local file list and SHA-256 hashes after vendoring. Require `license === "CC0-1.0"`.
- [ ] **Step 2: Implement the development-only vendoring script.** It may call `https://api.polyhaven.com/files/<id>` with a unique User-Agent such as `StudyHub-V30-AssetVendor/1.0`, but generated runtime files must never call Poly Haven.
- [ ] **Step 3: Download only practical web-quality source variants.** Prefer 1k glTF for props, 1k/2k PBR maps for materials and 2k HDR for the lighting source; recursively capture required glTF dependencies.
- [ ] **Step 4: Save assets under `assets/3d/home-v30/vendor/<asset-id>/` using stable filenames; calculate SHA-256 after download and write them to the manifest.
- [ ] **Step 5: For the existing lamp, record the existing local path/hash instead of duplicating it.
- [ ] **Step 6: Add a manual GitHub Action.** `workflow_dispatch` runs the vendor script, manifest tests and uploads/commits the exact vendored outputs to the feature branch. This workflow is not used by the website at runtime.
- [ ] **Step 7: Run tests.**

```bash
node --test tests/home-v30-manifest.test.js
```

- [ ] **Step 8: Commit.**

```bash
git commit -am "feat: vendor cc0 art assets for home v30"
```

---

## Task 3: Assemble the realistic Blender scene and export the V30 GLB

**Files:**
- Create: `scripts/blender/build-home-v30.py`
- Create: `.github/workflows/build-home-v30.yml`
- Create: `tests/home-v30-assets.test.js`
- Generate: `assets/3d/home-v30/study-hub-home-v30.blend`
- Generate: `assets/3d/home-v30/study-hub-home-v30.glb`

**Blender responsibility:**

The scene generator/assembly script must use the repo-local sourced art plus custom modeled Study Hub-specific hero pieces. It must not recreate the whole room as a collection of crude `add_box()` calls.

Custom modeling requirements:

- Desk: believable slab/profile, edge treatment, joinery/legs, drawer carcasses, visible drawer interiors/rails and handles.
- Chair: curved/subdivided seat and back, support structure, base and casters as separate real forms.
- Monitor: shell, bezel, stand and screen surface; keyboard with proper profile/keys and a believable pointing device.
- Cabinet: controllable door/sliding panel with a real hinge/rail origin.
- Interactive props have their own hierarchy and origins.

Imported CC0 props add small detail, not clutter.

Physical materials must visibly separate walnut, plaster, graphite/aluminum, neutral fabric, paper, ceramic/glass and screen glass. Blue is limited to screen/emissive accent materials.

- [ ] **Step 1: Write GLB tests RED.** Parse GLB magic/version/declared length and JSON chunk like the robust V29 tests. Require all `HOME_V30_NODES`, all `HOME_V30_CLIPS`, material families and semantic archive origins.
- [ ] **Step 2: Initialize Blender scene in meters, `BLENDER_EEVEE_NEXT`, neutral world, normalized scene centered around the desk.
- [ ] **Step 3: Import the local CC0 assets and remap all paths/materials to repo-local data.
- [ ] **Step 4: Build the custom desk/chair/monitor/cabinet with smooth shading, bevel/subdivision/curves where form requires it; no primitive toy silhouettes.
- [ ] **Step 5: Assign PBR surfaces.** Use local walnut/plaster maps, neutral custom graphite/aluminum, neutral fabric, paper, ceramic/glass and restrained screen accent.
- [ ] **Step 6: Create real mechanical pivots/origins for drawers, cabinet door, lamp joints and chair movement.
- [ ] **Step 7: Author all eight named animation actions.** Actions are non-looping and affect only intended hierarchies.
- [ ] **Step 8: Add all five named archive origin empties at intentional spatial targets.
- [ ] **Step 9: Save `.blend` and export GLB with Y-up, materials and animations.
- [ ] **Step 10: Add free headless build workflow.** Install Blender + `python3-numpy`, run the build, then run `tests/home-v30-assets.test.js`; upload `.blend` and `.glb` artifacts.
- [ ] **Step 11: Commit the exact binaries produced by the verified workflow.** Target 8–12 MiB for initial GLB; keep an 18 MiB hard guard while iterating rather than destroying visible fidelity for an arbitrary target.
- [ ] **Step 12: Commit.**

```bash
git commit -am "feat: assemble realistic blender home v30"
```

---

## Task 4: Render a poster fallback from the exact same V30 scene

**Files:**
- Modify: `scripts/blender/build-home-v30.py`
- Modify: `.github/workflows/build-home-v30.yml`
- Create: `tests/home-v30-poster.test.js`
- Generate: `assets/3d/home-v30/home-v30-poster.webp`

- [ ] **Step 1: Add poster test RED.** Require the file, `RIFF`/`WEBP` magic, useful size (>20 KiB), sane upper bound (<3 MiB), and no reference to a V29 image.
- [ ] **Step 2: Add the approved opening camera to Blender.** Render 1600×900 from the same physical scene and lighting used to author V30.
- [ ] **Step 3: Render PNG headlessly and convert to WebP (`cwebp -q 84`) in the build workflow.
- [ ] **Step 4: Ensure the poster itself passes the visual direction: neutral walls, visible warm wood, charcoal/metal/fabric variation, Study Hub blue only as accent.
- [ ] **Step 5: Run targeted tests and commit.**

```bash
node --test tests/home-v30-poster.test.js tests/home-v30-assets.test.js

git commit -am "feat: add v30 hero poster fallback"
```

---

## Task 5: Mount V30 explicitly and replace silent V29/V28 fallback with the poster

**Files:**
- Create: `src/home/scene/home-v30-mount.js`
- Create: `src/home/scene/home-v30-controller.js`
- Create: `tests/home-v30-runtime.test.js`
- Modify: `src/home/scene/asset-registry.js`
- Modify: `src/home/scene/renderer-setup.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `src/home/home-experience.js`
- Modify: `src/views/home-view.js`
- Modify: `styles/home-startup.css`
- Update/retire obsolete V29 production assertions in: `tests/home-v29-runtime.test.js`, `tests/home-startup.test.js`

**Runtime result contract:**

```js
{ status: "ok", scene, animations }
{ status: "timeout", error }
{ status: "error", error }
```

Never convert V30 loader errors silently to `null`.

- [ ] **Step 1: Write runtime tests RED.** Require local V30 GLB URL, explicit status, finite timeout, paused `AnimationMixer` scrub behavior and no external URL.
- [ ] **Step 2: Add the poster to `home-view.js` immediately:**

```html
<img class="home-v30-poster" src="assets/3d/home-v30/home-v30-poster.webp" alt="" aria-hidden="true">
```

The accessible navigation/fallback copy remains semantic; the poster is decorative.

- [ ] **Step 3: Add diagnostic renderer state.** Root starts with `data-home-renderer="loading"`; success becomes `v30`; failure/no-WebGL becomes `poster-fallback`; add `data-home-renderer-error="timeout|load|webgl"` where useful.
- [ ] **Step 4: Implement `loadHomeV30()` with explicit status and timeout.
- [ ] **Step 5: Implement `prepareHomeV30()`. Validate required nodes and finite scene bounds before adding the root to the scene.
- [ ] **Step 6: Implement controller using the known-good V29 pattern: `AnimationMixer`, activate actions once, pause immediately, set `action.time` from scroll windows, `mixer.update(0)`.
- [ ] **Step 7: Remove V29/V28 from the production hero decision.** `renderer-setup.js` must not show the old procedural room if V30 fails. Keep legacy modules in the repo only if historical tests/reference still need them, but no V30 production import may use them as visual substitute.
- [ ] **Step 8: Crossfade poster only after an actual first successful `renderer.render(scene, camera)` and `resolveReady()`.
- [ ] **Step 9: On V30 failure keep the poster and functional quick navigation; do not pretend the renderer is ready.
- [ ] **Step 10: Run targeted + startup tests.**

```bash
node --test tests/home-v30-runtime.test.js tests/home-v30-security.test.js tests/home-startup.test.js
```

- [ ] **Step 11: Commit.**

```bash
git commit -am "feat: mount v30 with explicit poster fallback"
```

---

## Task 6: Author V30 state, camera, lighting and semantic studio → archive choreography

**Files:**
- Create: `src/home/scene/home-v30-state.js`
- Create: `src/home/scene/home-v30-camera-timeline.js`
- Create: `src/home/scene/home-v30-lighting.js`
- Create: `src/home/scene/home-v30-dematerialization.js`
- Create: `src/home/scene/home-v30-archive.js`
- Create: `tests/home-v30-choreography.test.js`
- Modify: `src/home/scene/study-room-renderer.js`
- Modify: `tests/home-digital-archive-v27.test.js`

**State phases:**

```text
0.00–0.15 establish
0.15–0.38 mechanical
0.38–0.60 release
0.60–0.80 dematerialize
0.80–0.95 archive
0.95–1.00 handoff
```

**Initial normalized desktop camera keys:**

```text
p=0.00  pos [ 4.70, 2.60, 5.80] target [ 0.00, 1.25,-0.20] fov 38
p=0.15  pos [ 3.80, 2.20, 4.50] target [ 0.15, 1.12,-0.15] fov 36
p=0.28  pos [ 2.40, 1.65, 3.00] target [ 0.75, 0.82, 0.05] fov 34
p=0.38  pos [-3.00, 2.15, 4.20] target [-1.30, 1.25,-1.10] fov 35
p=0.55  pos [-2.15, 2.85, 5.20] target [ 0.00, 1.45,-0.60] fov 38
p=0.72  pos [ 0.35, 3.90, 6.90] target [ 0.00, 1.65,-1.05] fov 43
p=0.94  pos [ 1.15, 3.05, 4.15] target [ 0.35, 1.85,-2.40] fov 36
p=1.00  pos [ 0.45, 2.60, 1.00] target [ 0.28, 1.82,-2.42] fov 30
```

Mobile uses the same narrative with increased distance and roughly +9–12° FOV, then is tuned only through screenshot review, not by cropping desktop composition.

- [ ] **Step 1: Write choreography tests RED.** Require deterministic/reversible phase sampling, mechanical action windows before release, separate desktop/mobile keys, semantic archive destination types and absence of a one-geometry-for-all icosahedron scheme.
- [ ] **Step 2: Implement `home-v30-state.js` with smooth ranges and reversible outputs.
- [ ] **Step 3: Implement the camera timeline with stable horizon and authored key interpolation.
- [ ] **Step 4: Implement physical lighting.** Warm practical/key, neutral fill/environment, contact grounding; fade physical warmth progressively while digital emissive contributions grow locally after release begins.
- [ ] **Step 5: Implement semantic dematerialization.** Do not hash-scatter objects. For each named semantic source, capture base transform plus destination anchor and use authored lift/curve interpolation. Preserve silhouette and material scale during the first part of dissolution.
- [ ] **Step 6: Implement distinct archive destination languages:**
  - Percorsi → spline/ribbon/path.
  - Ripasso → layered card stack.
  - Progressi → timeline/bars/data track.
  - Verifiche → checkpoint/grid frame.
  - Cerca → query ray + point field.
- [ ] **Step 7: Integrate with `study-room-renderer.js`; `getPathsProjection()` projects the V30 Percorsi object/anchor through existing `projectObjectToCss()`.
- [ ] **Step 8: Keep route ownership in `home-experience.js` / shared transition; do not reinvent router navigation in the 3D module.
- [ ] **Step 9: Update old archive tests so they guard semantic behavior rather than requiring the obsolete `archive-field.js` icosahedrons.
- [ ] **Step 10: Run tests and commit.**

```bash
node --test tests/home-v30-choreography.test.js tests/home-digital-archive-v27.test.js tests/home-shared-transition.test.js

git commit -am "feat: choreograph v30 studio to semantic archive"
```

---

## Task 7: Replace the blue-room chrome and update legacy visual tests without weakening accessibility

**Files:**
- Modify: `styles/home-immersive.css`
- Modify: `styles/home-startup.css`
- Modify: `src/views/home-view.js`
- Modify: `tests/home-view.test.js`
- Modify obsolete visual assertions in V29-era tests as needed

- [ ] **Step 1: Write V30 style guards before CSS edits.** Require a neutral/warm physical opening background and poster layer; reject the old all-blue physical tokens/material names on the active V30 path.
- [ ] **Step 2: Make poster/canvas layering explicit.** Poster covers the stage while loading/failure; canvas crossfades above it only after first verified V30 frame.
- [ ] **Step 3: Re-art-direct the physical UI.** Minimal glass UI, restrained blue, neutral transparent overlays; avoid a large blue shade over the 3D content.
- [ ] **Step 4: Preserve accessibility and functionality.** Quick actions, captions, progress, reduced-motion and DOM/poster fallback routes remain navigable.
- [ ] **Step 5: Update old exact-number CSS tests.** Do not preserve V29 values such as `--home-scene-shade: .34` merely to make tests pass; rewrite those checks around V30 neutral/visible scene criteria.
- [ ] **Step 6: Remove obsolete production assumptions that require `archive-field.js`, V29 fallback or old blue procedural materials, while retaining tests for routes, reduced motion and shared handoff.
- [ ] **Step 7: Run the entire Node suite.**

```bash
node --test
node scripts/check-secrets.mjs
```

- [ ] **Step 8: Commit.**

```bash
git commit -am "style: replace blue room chrome with v30 art direction"
```

---

## Task 8: Add Chromium + WebKit screenshot QA as a hard merge gate

**Files:**
- Create: `scripts/qa/home-v30-browser-audit.mjs`
- Create: `.github/workflows/home-v30-visual-qa.yml`

**Required desktop frames:** `0`, `.25`, `.50`, `.75`, `.94` at 1440×1000 in Chromium and WebKit.

**Required mobile WebKit frames:** at least `.25` and `.75` at 390×844.

- [ ] **Step 1: Implement Playwright audit.** Serve the repository locally, open `#/home`, wait for `data-home-renderer="v30"`, then scroll by real `.home-journey` distance.
- [ ] **Step 2: Record network and console diagnostics.** Require V30 GLB 200, zero failed same-origin asset requests, zero page errors and zero external runtime asset requests.
- [ ] **Step 3: Fail explicitly on texture/runtime errors:** `GLTFLoader`, `Couldn't load texture`, `Refused to connect to blob`, WebGL texture upload failure or V30 renderer falling back.
- [ ] **Step 4: Record generic CSP/style warnings separately.** Do not weaken `style-src` with `'unsafe-inline'` merely to silence a warning; first determine whether it affects the handoff. The blob CSP fix remains narrowly `connect-src`/`img-src`.
- [ ] **Step 5: Save screenshots plus `home-v30-audit.json` as a GitHub Actions artifact.
- [ ] **Step 6: Run visual QA workflow on the feature branch.
- [ ] **Step 7: Download the exact artifact and inspect every frame.** This is a human/model visual review checkpoint, not a string test.

**Reject the branch if any frame shows:**

- the existing blue plastic room;
- blue-dominant walls/floor/furniture;
- major furniture reading as primitive boxes;
- wood/fabric/metal/paper/plaster/glass failing to separate visually;
- drawer/cabinet/lamp actions not visible;
- random explosion-like dematerialization;
- five archive targets that look like repeated generic primitives;
- missing/black textures in WebKit;
- mobile framing cutting off the primary action.

- [ ] **Step 8: If any criterion fails, return to Tasks 3, 6 or 7 and repeat QA. Do not start Task 9.
- [ ] **Step 9: Only after visual acceptance, commit the persistent QA workflow/script.**

```bash
git commit -am "test: add v30 chromium and webkit visual gate"
```

---

## Task 9: Release token, full verification, merge, Pages and production audit

**Precondition:** Task 8 screenshots have been inspected and accepted.

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `src/views/home-view.js`
- Modify: `src/views/paths-view.js`
- Modify: `src/home/home-experience.js`
- Modify the V30 critical import chain under `src/home/scene/`
- Modify: `tests/home-deployment.test.js`

- [ ] **Step 1: Apply the CSP fix in the release HTML:**

```text
connect-src 'self' blob:
img-src 'self' data: blob:
```

No external host or wildcard is added.

- [ ] **Step 2: Bump only the critical Home/Paths release chain to `20260901-30` now.** Do not mix `-29` and `-30` in the V30 dependency graph.
- [ ] **Step 3: Update `tests/home-deployment.test.js` to enforce the full changed chain.
- [ ] **Step 4: Run fresh full verification.**

```bash
node --test
node scripts/check-secrets.mjs
```

Expected: all tests pass, zero secret findings.

- [ ] **Step 5: Open/refresh the feature PR and verify base/head before merge.** Confirm `main` has not diverged unexpectedly. Never force-push `main`.
- [ ] **Step 6: Merge/fast-forward only the verified V30 SHA.
- [ ] **Step 7: Verify the new `main` test run succeeds on the exact merged SHA.
- [ ] **Step 8: Verify GitHub Pages build/deploy succeeds on that same SHA.
- [ ] **Step 9: Run the browser audit against production:**

```text
https://matteo1234ay.github.io/study-hub-v3/?release=20260901-30#/home
```

Confirm the HTML/module token is `20260901-30`, `data-home-renderer="v30"`, the GLB responds 200, no blob texture error occurs, and production screenshots match the accepted branch direction.

- [ ] **Step 10: Only then call V30 published/finished.
- [ ] **Step 11: Release commit message:**

```bash
git commit -am "release: publish home v30"
```

---

## Definition of Done

V30 is complete only when all of the following are simultaneously true:

- Opening frame is unmistakably different from V29 and reads as a believable studio, not a toy/procedural room.
- Physical phase uses restrained blue accents rather than blue surfaces everywhere.
- Wood, plaster, metal, fabric, paper and glass/ceramic are visibly different materials.
- Primary/secondary drawer, cabinet door, lamp and chair mechanical actions are visible and reversible.
- Paper/notebook/monitor become information in a purposeful sequence.
- Dematerialization follows semantic destinations rather than random scatter.
- Percorsi/Ripasso/Progressi/Verifiche/Cerca have distinct archive visual languages.
- Route handoff to Percorsi remains reversible.
- V30 GLB and poster are local and provenance is auditable.
- Browser logs show no V30 texture/CSP load failure in Chromium or WebKit.
- Mobile WebKit framing is usable and visually intentional.
- V30 failure displays the V30 poster + navigation, never the V29/V28 room.
- Full Node suite and secret scan pass.
- Chromium/WebKit screenshots at all required progress points were inspected and accepted before merge.
- GitHub Pages deploy and production browser audit both refer to the exact merged SHA.

## Plan Self-Review

- **Spec coverage:** art direction, CC0 provenance, Blender hierarchy, mechanical actions, semantic archive, CSP, fallback, mobile, performance, privacy and visual merge gate are all represented.
- **No placeholders:** asset IDs, required node/clip names, timeline windows, initial camera keys, filenames, test commands and release procedure are explicit.
- **Security consistency:** Poly Haven is development-only; production remains same-origin. CSP is widened only for local `blob:` resources needed by GLTFLoader, not third-party networking.
- **Fallback consistency:** old V29/V28 visual fallback is intentionally removed from the V30 production path.
- **Known risk:** V30 source/binary art can grow quickly. Optimize geometry/textures after visual quality is established; do not regress back to primitive modeling solely to hit a small file target.
- **Known risk:** WebKit previously logged inline-style CSP warnings around dynamic UI styling. The V30 audit records these separately; do not add broad `style-src 'unsafe-inline'` without proving it is necessary.
- **Release safety:** `20260901-30` is deliberately deferred until the visual gate passes, so `main` remains stable during reconstruction.
