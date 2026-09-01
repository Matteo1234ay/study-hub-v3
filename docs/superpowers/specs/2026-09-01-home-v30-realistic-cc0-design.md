# Study Hub V30 — Realistic CC0 Studio → Digital Archive

Date: 2026-09-01
Status: approved design direction, implementation not started
Branch: `feat/home-v30-realistic-cc0`

## 1. Goal

Replace the current V29 hero with a genuinely different visual system: a believable editorial study room made from high-quality CC0/local assets and selective custom Blender modeling, which progressively dematerializes into the Study Hub digital archive.

The concept remains:

**realistic physical study → purposeful mechanical motion → objects become information → digital archive → route handoff**.

The target is not to copy Igloo Inc assets, layout, branding, shaders, or proprietary work. The target is the same standard of craft: convincing materials, intentional animation, coherent art direction, cinematic camera work, and seamless state transitions.

## 2. Why V29 is rejected

V29 is technically deployed and its GLB is requested successfully, but the visual result still reads like a procedural Three.js demo:

- too much blue across large surfaces;
- furniture and props remain boxy / primitive;
- materials do not read as distinct physical substances;
- the room is compositionally too close to the earlier MVP;
- the transition is more a technical effect than an authored transformation;
- the old V28/V29 fallback can hide asset failures and make a new release look unchanged.

A browser audit also exposed a real runtime bug: the page CSP currently allows `connect-src 'self'` but not `blob:`. GLTFLoader creates blob URLs for embedded GLB textures, so Chromium and WebKit report blocked blob texture loads. The V30 work must fix that before judging any material quality.

## 3. Chosen approach

Use a hybrid asset pipeline:

1. **High-quality CC0 assets** for objects where realistic modeling already exists and adds value.
2. **Custom Blender modeling** only for Study Hub-specific or mechanically interactive objects whose topology, pivots, hierarchy, or animation must be controlled.
3. **Three.js as runtime compositor**, not as the main furniture modeler.
4. **Local vendoring only**: no runtime calls to asset websites, CDNs, analytics, paid APIs, or external render services.

Primary approved source: **Poly Haven**, whose HDRIs, textures, and 3D models are CC0. Assets are downloaded during development, optimized, and committed locally. A local attribution/provenance ledger is kept even where attribution is not legally required.

## 4. Art direction

### 4.1 Palette

The room must no longer be monochrome blue.

Physical phase:

- warm off-white / plaster walls;
- walnut or similarly warm wood;
- charcoal / graphite metal;
- dark neutral textile upholstery;
- ivory paper;
- ceramic white / stone;
- clear or slightly tinted glass;
- soft warm practical lighting;
- Study Hub blue only as a restrained accent on screen/UI/light details.

Digital phase:

- deep navy / graphite background;
- Study Hub blue and cool white as information light;
- restrained warm remnants from the physical room during the transition;
- no field of generic blue plastic geometry.

### 4.2 Material requirement

The first frame must clearly communicate at least these physically different material families:

- wood;
- painted/plastered wall;
- metal;
- fabric;
- paper;
- glass/ceramic.

They must differ not only in color but also in roughness, normal response, highlights, edge treatment, and texture scale.

### 4.3 Modeling requirement

Hero objects may not be represented by simple beveled boxes unless that is genuinely their real-world form.

Priority objects:

- desk with believable construction and drawer interiors;
- ergonomic chair with curved upholstery / support structure;
- articulated desk lamp;
- monitor and stand;
- keyboard / pointing device;
- books / notebooks / loose paper;
- wall shelf or cabinet with moving door/tray;
- one or two small editorial props that make the scene lived-in without turning it into a bedroom or lounge.

## 5. Scene architecture

### 5.1 Blender owns the physical scene

The Blender scene is the source of truth for:

- object hierarchy;
- pivots/origins;
- parent-child mechanical relationships;
- initial transforms;
- named animation clips;
- named archive anchors;
- material assignments;
- collision-free drawer/door travel.

Three.js must not recreate the desk, chair, cabinet, lamp, monitor, or principal props with BoxGeometry/CylinderGeometry as the normal path.

### 5.2 Asset manifest

Add `assets/3d/home-v30/manifest.json` recording, per external CC0 asset:

- local asset id;
- role in the scene;
- source project/site;
- original source page;
- license;
- creator when supplied;
- downloaded source filename;
- optimized local filename;
- SHA-256 of the vendored source/derivative where practical;
- transformations/optimization applied.

This keeps the home reproducible and auditable while remaining privacy-first.

### 5.3 Runtime files

Expected production artifacts:

- `assets/3d/home-v30/study-hub-home-v30.glb`
- `assets/3d/home-v30/home-v30-poster.webp`
- local KTX2 / WebP / PNG textures as appropriate
- local environment map derived from a CC0 HDRI or a custom authored lighting environment

The `.blend` source and reproducible build script/workflow remain in the repository.

## 6. Animation choreography

The animation is authored as one continuous story rather than six unrelated camera stations.

### Stage A — Establish / arrival (0–15%)

- camera enters or settles into a credible wide/medium composition;
- practical lamp wakes subtly;
- monitor gets a restrained screen glow;
- very small chair/desk parallax, no floating-object gimmicks;
- room is readable immediately.

### Stage B — Mechanical study actions (15–38%)

- primary desk drawer opens on real rails/pivot hierarchy;
- secondary drawer or tray opens with a different timing curve;
- cabinet door or sliding panel moves;
- lamp arm/head adjusts through its joints;
- chair rotates/slides by a few centimeters with inertia;
- notebook/papers respond only after their supporting object moves.

No animation runs autonomously. Scroll controls a reversible timeline: scrolling backward restores the physical state exactly.

### Stage C — Knowledge release (38–60%)

- selected paper/cards/books lift from their physical locations;
- content surfaces gain subtle emissive information marks;
- the monitor contributes structured UI fragments;
- small connection cues appear between real objects and archive concepts;
- physical objects remain recognizably themselves.

### Stage D — Dematerialization (60–80%)

Objects separate according to semantic and physical hierarchy:

1. paper/cards;
2. books and desk accessories;
3. lamp/chair/cabinet moving assemblies;
4. desk and architectural elements.

The effect must preserve object silhouettes during the first part of dissolution. Avoid generic explosion vectors. Fragments transition from material surfaces into information strips/cards/points whose destinations come from Blender archive anchors.

### Stage E — Digital archive (80–95%)

The room has become the archive itself. The primary destinations are:

- Percorsi;
- Ripasso;
- Progressi;
- Verifiche;
- Cerca.

Do not represent these as identical icosahedrons. Each destination uses a restrained semantic visual language derived from the information that flowed into it: cards, ribbons, timelines, clusters, paths, or data surfaces.

### Stage F — Route handoff (95–100%)

The selected/default `Percorsi` structure becomes the destination transition. Camera motion, archive geometry, and page portal must align spatially so navigation feels like continuation of the same scene rather than a cut.

## 7. Camera and lighting

### Camera

- cinematic but restrained;
- no constant orbit around the room;
- use authored key poses and smooth interpolation;
- movement should reveal an action or object, not exist for spectacle;
- preserve a stable horizon and believable lens perspective;
- desktop and mobile get separate framing tables, not a single desktop path cropped on mobile.

### Lighting

Physical phase:

- warm practical/key source;
- soft neutral fill;
- controlled window/environment contribution;
- realistic contact shadows and AO-like grounding;
- no whole-room blue wash.

Transition phase:

- physical warm light recedes rather than switching off abruptly;
- digital light is introduced locally from the objects becoming information;
- final archive can become cooler/darker while retaining tonal hierarchy.

## 8. Texture / glTF delivery

### CSP fix

The current CSP must be updated so locally-created blob URLs required by embedded GLB resources can load without opening external network access. The intended policy is narrowly scoped, e.g.:

- `connect-src 'self' blob:`
- `img-src 'self' data: blob:`

No third-party origins are added.

If V30 export is changed to use external relative texture files and no blob fetch is needed, the policy can be tightened again, but browser tests must prove that path first.

### Compression

Use glTF-friendly production optimization. KTX2/Basis Universal is preferred where it preserves visible quality and works reliably with the locally vendored Three.js loader/transcoder. Geometry may use appropriate mesh optimization only if it does not introduce Safari/WebKit regressions.

The goal is not the smallest possible file; the goal is a visually credible hero that remains practical on desktop and mobile.

## 9. Loading and fallback behavior

V30 must never silently fall back to the old blue V29/V28 room.

Loading states:

1. DOM/UI loads immediately.
2. `home-v30-poster.webp` can appear as a stable visual placeholder.
3. V30 WebGL scene mounts when its required assets are ready.
4. poster crossfades only after a verified first WebGL frame.

If V30 fails:

- keep the V30 poster;
- keep navigation and route controls fully functional;
- expose a diagnostic state in `data-home-renderer` / console in development;
- do not instantiate V29 as a visual substitute.

This makes asset failures obvious during QA instead of disguising them as an unchanged release.

## 10. Performance targets

Initial targets, to be validated against actual visual quality:

- desktop first interactive UI is not blocked by GLB download;
- poster appears immediately;
- V30 GLB + required initial textures should target roughly 8–12 MB compressed transfer or less;
- optional detail can load after the hero becomes usable;
- cap DPR on high-density displays;
- reduce shadow resolution / particle budget on mobile;
- separate mobile camera framing and reduced detail level;
- no mandatory network request outside the GitHub Pages origin.

If the only way to meet an arbitrary size target is to make materials visibly worse, visual fidelity wins and a staged load is used instead.

## 11. Privacy and cost

Requirements remain unchanged:

- zero paid APIs;
- zero paid asset dependency;
- zero backend required for the hero;
- no tracking or analytics introduced;
- no external runtime asset requests;
- CC0/local assets only for sourced production art;
- GitHub Pages remains the hosting target.

## 12. Automated tests

Before merge, automated tests must cover at minimum:

- V30 GLB exists and has valid glTF 2 header;
- required named nodes / pivots / anchors exist;
- required mechanical animation clips exist;
- no production import references V29 as the primary/fallback visual scene;
- CSP permits the exact local texture-loading mechanism used by V30 and still blocks external origins;
- local asset manifest entries contain provenance/license fields;
- route handoff remains reversible;
- reduced-motion / DOM fallback remains navigable;
- cache-bust release chain is consistent;
- secret scan remains clean.

## 13. Browser visual QA — hard merge gate

A green unit-test suite is not sufficient.

The branch must render the actual site in both:

- Chromium;
- WebKit (Safari engine equivalent available in CI).

Capture screenshots at approximately:

- 0%;
- 25%;
- 50%;
- 75%;
- 92–95%.

Also capture at least one mobile WebKit frame.

The screenshots must be retained as CI artifacts for review.

### Visual acceptance criteria

Do not merge if any of these are true:

- opening frame still reads as the existing blue plastic room;
- blue dominates walls/floor/furniture rather than functioning as an accent;
- major furniture still reads as primitive boxes;
- wood, fabric, metal, paper, plaster and glass/ceramic do not visibly separate as materials;
- drawers/door/lamp motion clips do not visibly change the scene;
- the 50–75% transition looks like random exploding geometry;
- archive destinations look like generic repeated primitives;
- WebKit logs CSP texture errors;
- WebKit shows missing/black textures;
- mobile framing cuts off the primary action.

### Release review rule

The implementation is not called “finished” and is not moved to `main` until the screenshots have been inspected. If screenshots are technically valid but aesthetically below the approved direction, the branch stays unmerged and the art pass continues.

## 14. Rollout

1. Build V30 entirely on `feat/home-v30-realistic-cc0`.
2. Keep public `main` stable during reconstruction.
3. Add browser screenshot workflow to the feature branch.
4. Fix all runtime/CSP errors.
5. Inspect the full screenshot sequence.
6. Only then bump the production release token and merge.
7. Verify the GitHub Pages deployment from the exact merged SHA.
8. Run one production URL browser audit after deploy.

## 15. Definition of done

V30 is done only when all of the following are true:

- the physical studio is unmistakably more realistic than V29;
- sourced assets are CC0 and local;
- custom interactive objects have correct Blender pivots/hierarchy;
- mechanical actions are scroll-reversible;
- studio → archive transformation is semantically coherent;
- no silent V29 visual fallback exists;
- CSP/texture errors are gone in Chromium and WebKit;
- desktop and mobile screenshots pass the visual gate;
- automated tests and secret scan pass;
- the verified build is deployed from `main`.
