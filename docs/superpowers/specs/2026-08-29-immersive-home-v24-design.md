# Study Hub Immersive Home V24 Design

## Goal

Turn the current V23 immersive homepage into a substantially more convincing, physically plausible Study Hub while preserving the existing semantic room, desktop/mobile camera choreography, reduced-motion scroll journey and zero-cost hosting model.

The result should no longer feel like “a web page with simple Three.js props”. It should feel like entering a believable studio in which real-looking objects, subtle depth reactions and the final transition to Paths all belong to one continuous experience.

## Non-negotiable constraints

- Zero recurring cost.
- No paid API, CDN dependency, backend or metered runtime service.
- GitHub Pages remains the deployment target.
- Runtime assets must be shipped from the repository itself.
- External 3D/textural assets must be free to use and redistribution-compatible; prefer CC0/public-domain assets.
- Preserve all six semantic Study Hub stations and every existing route.
- Preserve desktop and portrait mobile camera timelines unless a specific realism/legibility fix requires a small local adjustment.
- Preserve scroll-driven motion on reduced-motion devices. Reduced motion disables autonomous pointer/parallax movement, not user-driven scroll progression.
- Keep mobile usable and responsive on Safari/iPhone-class devices.
- Preserve current tests unless intentionally replaced by stronger contracts.

## Root causes in V23

### Initial visual flash

The home view mounts with `data-home-state="fallback"`, so the DOM fallback is visible while Three.js, materials, textures and the scene are still loading. Once the renderer is ready, the state switches to `ready` and the 3D experience replaces the fallback. This produces the visible “old homepage for a moment, then the new one” effect.

### Synthetic-looking objects

V23 improved material response with ACES tone mapping, roughness maps and normal maps, but the main room props are still mostly built from `BoxGeometry` and `CylinderGeometry`. Low-resolution procedural textures also cannot compensate for perfectly sharp, simplified silhouettes. The realism problem is therefore primarily geometric and material-source related, not just a lighting issue.

### Igloo-like interaction is too weak

V23 already has inertial pointer state, but the maximum offset is tiny and most visible objects do not behave as independent depth layers. The current effect reads more like a subtle camera wiggle than a scene with many small elements reacting at different depths.

### Final transition is structurally disconnected

The final runway exists, but the route change still culminates in a normal internal navigation/View Transition boundary. The 3D “Paths” surface and the HTML Paths page are not visually linked, so the user still perceives “render ends, page changes”.

## Architecture

V24 keeps the current semantic room and adds four focused improvements:

1. a dedicated loading/preload state that never exposes the legacy fallback during a normal WebGL startup;
2. a local realistic-asset layer for selected high-salience props;
3. a depth-layer parallax system that moves multiple semantic objects independently;
4. a shared visual handoff between the 3D Paths surface and the `#/paths` page.

The fallback DOM remains available for actual WebGL failure, but is no longer the visual loading state.

## 1. Startup and loading state

### Desired behavior

On a WebGL-capable device the homepage should visually enter the new experience immediately.

The loading flow becomes:

`route mount → cinematic preload shell → scene/asset preparation → first valid rendered frame → fade-in to ready scene`

The legacy DOM fallback must only become visible after a genuine rendering failure or unsupported WebGL path.

### Implementation direction

- Add an explicit `loading`/`preparing` state separate from `fallback`.
- Keep the canvas visible in the layout from the first frame, but do not reveal an incomplete room.
- Show a minimal dark cinematic preload surface matching the final scene palette instead of the old Home copy/cards.
- Do not show header/footer/quick navigation briefly on mobile before immersive mode is known.
- Preload critical local glTF assets and their textures before marking the room ready.
- Only transition to `ready` after the renderer has produced a valid first frame.
- If initialization fails, switch to the accessible DOM fallback and preserve all links.

### Acceptance criteria

- No visible old-home flash during successful WebGL startup.
- No blank white frame.
- No layout jump when ready state begins.
- Actual WebGL failure still exposes an accessible usable fallback.

## 2. Realistic asset strategy

### Hybrid approach

Do not replace the entire room with imported models. Keep architectural elements and semantic displays under code control, but replace the props that most strongly reveal the simplified render.

Initial high-salience candidates:

- ergonomic chair;
- articulated desk lamp;
- monitor/display body where geometry is visibly crude;
- mug and 2–4 desk props;
- selected books/binders;
- one or two silhouette-critical shelf/desk accessories.

The room shell, interactive screens, hit areas, station anchors and semantic state remain code-defined.

### Asset policy

Prefer assets from sources offering CC0/public-domain or equivalent redistribution-friendly licenses. Every imported asset must have:

- original source recorded in `assets/3d/ATTRIBUTION.md`;
- license recorded explicitly;
- no required network request at runtime;
- no paid account or paid download requirement;
- optimized local copy committed to the repository.

If a suitable free asset cannot be redistributed safely, do not use it. Improve the procedural geometry instead.

### glTF pipeline

Use local `.glb`/`.gltf` files loaded through Three.js `GLTFLoader` vendored/served locally with the project. Imported objects must be normalized through a small asset adapter that defines:

- semantic name;
- scale;
- position;
- rotation;
- shadow behavior;
- quality/LOD eligibility;
- fallback procedural object.

The application must never depend on remote asset hosting.

### Geometry fallback/refinement

Objects that remain procedural should receive silhouette improvements where visually important:

- beveled/rounded edges instead of perfectly sharp boxes;
- tapered legs/stands where appropriate;
- rounded monitor corners/bezel;
- more believable lamp shade/joints;
- chair geometry with curved seat/back proportions if a suitable asset is not used;
- realistic thickness and small gaps between stacked elements.

No decorative geometry should be added just to increase polygon count.

## 3. Material realism

### PBR requirements

For imported/high-salience assets use real PBR texture sets when available:

- base color/albedo;
- roughness;
- normal;
- metallic where appropriate;
- ambient occlusion where appropriate.

Textures should be resized/compressed for web delivery while retaining enough detail for close shots.

### Procedural materials

Existing procedural materials may remain for large architectural surfaces, but should be upgraded where needed:

- larger and less repetitive detail than the current 128–192 px maps;
- correct directional grain for wood;
- subtle roughness variation that does not look mathematically periodic;
- normal amplitude kept physically plausible;
- distinct material response for painted metal, anodized metal, ceramic, fabric, wood and screen glass;
- UV/repeat scale chosen per object size rather than globally where visually necessary.

### Lighting/shading

Keep the current composition and lighting direction that already works, but improve physical plausibility with:

- ACES tone mapping retained;
- calibrated exposure;
- soft contact shadows for hero objects;
- neutral ambient/fill so dark materials keep texture information;
- warm practical light near the desk/lamp;
- restrained cool screen spill;
- no saturated blue wash over the room;
- shadow bias/normalBias tuned to avoid floating objects and acne.

## 4. Performance budget

Realism is only accepted if mobile remains usable.

### Asset budget

Hard budgets for V24:

- maximum 7 imported glTF/glb props in the initial room;
- total committed runtime payload for new V24 3D models plus their textures: target <= 8 MB, hard ceiling 12 MB;
- assets required before the first complete room frame: target <= 5 MB total;
- no 4K textures;
- hero texture dimension normally <= 1024 px per axis;
- 2048 px is allowed only for one asset if a close-up projection test demonstrates that 1024 is insufficient;
- optional/non-critical assets may lazy-load only if their absence is visually hidden by the initial camera or a procedural fallback, so visible popping is not introduced.

If candidate free assets exceed the hard ceiling, optimize or reject them rather than weakening the mobile target.

### Rendering budget

- Preserve adaptive DPR and existing quality profiles.
- Mobile begins in balanced mode.
- High-quality shadows only where the quality profile permits them.
- Maximum two simultaneous shadow-casting lights; prefer one directional/key shadow plus one practical where visually justified.
- Avoid per-frame allocations in parallax/motion code.
- Dispose glTF geometries/materials/textures correctly on route teardown.
- Keep WebGL context-loss handling.

## 5. Igloo-inspired depth interaction

### Design intent

The scene should feel physically layered when the pointer moves. The effect must not look like the whole page follows the mouse.

### Layer model

Register a bounded set of semantic parallax layers. Each layer stores immutable base transforms and its own coefficients.

Example groups:

- foreground paper/post-it details: strongest translation/rotation;
- loose books and small props: medium movement;
- interface/screen decorative layers: medium-low movement;
- lamp shade and monitor body: very low movement;
- shelves/major furniture: near-static;
- camera: smallest offset of all.

Each layer may respond to normalized pointer X/Y with:

- tiny translation;
- tiny rotation;
- different depth multiplier;
- different easing/inertia.

### Motion behavior

- Pointer input sets targets, never direct object transforms.
- Each layer interpolates toward its target with its own damping.
- Leaving the canvas returns every layer smoothly to its immutable base transform.
- Movement amplitude remains small enough that objects still feel heavy.
- Scroll choreography remains authoritative; parallax is applied additively after the scroll-derived pose.
- No parallax during final exit transition.
- No autonomous parallax under reduced motion.
- No mouse parallax on mobile.
- Register at least 4 visibly distinct depth coefficients and no more than 12 moving scene layers in the initial implementation.
- Camera amplitude must remain lower than every intentionally visible foreground layer.

### Visual success criterion

A desktop pointer move should visibly create depth because several small objects drift/rotate by different amounts, but the user should not feel that the entire room is being dragged.

## 6. Screen legibility

Do not solve mobile legibility by pushing the camera too close.

For each station screen:

- keep high-resolution canvas textures;
- maintain correct physical aspect ratio;
- use strong title hierarchy;
- maximum one primary message plus 2–3 secondary facts;
- no decorative microtext;
- high contrast;
- stronger font weights;
- avoid text placed near texture edges;
- use anisotropic filtering/mipmapping;
- allow active-station texture resolution to be higher than inactive stations if memory budget permits.

The portrait mobile composition must preserve enough room context to understand which physical zone is being visited.

## 7. Final Home → Paths cinematic handoff

### Narrative sequence

The final phase should become a continuous visual transformation:

1. the last semantic station settles;
2. the camera briefly reveals enough of the full room to establish context;
3. captions/progress UI clear out;
4. practical/zone lighting visually converges toward the Paths archive;
5. the camera begins a slower dolly toward the Paths display;
6. nearby props separate in depth and leave the frame subtly;
7. the 3D Paths surface grows to dominate the viewport;
8. a matching HTML transition surface is prepared for the Paths route;
9. route navigation occurs while that shared surface remains visually continuous;
10. the real Paths page resolves underneath/inside the shared surface and the transition completes.

### Shared transition surface

Introduce an explicit transition surface/state used by both Home and Paths.

The outgoing Home phase must be able to provide a screen-aligned rectangle/state for the Paths display once it occupies the final viewport. The incoming Paths view renders a matching transition surface with the same title/visual identity and a stable `view-transition-name` when the API is available.

Fallback behavior is mandatory: without View Transitions API, the outgoing surface must still expand/fade to full viewport, route navigation occurs, and the incoming Paths surface fades out to reveal the actual page. The user must not see an unstyled hard cut.

### Timing

Keep the extended final runway introduced in V23, but tune easing so the user has time to understand the approach. Navigation should occur only after at least 90% of the exit visual has completed. The final movement should feel slower than the station-to-station choreography.

## 8. Reversibility

Preserve and strengthen the existing cinematic route-state system.

When Paths was reached through the cinematic exit:

- upward wheel/trackpad/touch at the top returns to Home;
- Home resumes inside the final runway rather than at the beginning;
- the reverse handoff is required: with View Transitions API the matching Paths surface contracts toward the resumed Home exit state; without the API, Paths fades through the same shared transition surface before Home resumes;
- hysteresis prevents immediate re-entry to Paths;
- normal menu navigation to Paths does not acquire special behavior;
- stale cinematic state expires.

The reverse transition is therefore not optional; only its rendering mechanism differs by browser capability.

## 9. Reduced motion

Reduced motion must keep the scroll-driven journey because the user directly controls that movement.

With reduced motion enabled:

- disable mouse parallax and autonomous layer easing loops;
- keep camera positions driven by scroll;
- keep station reveal/lighting states driven by scroll;
- keep Home → Paths navigation functional;
- replace the autonomous shared-surface zoom with a short opacity handoff while preserving route continuity and the ability to reverse from Paths.

## 10. Loading and asset failure handling

Imported assets are enhancements, not a single point of failure.

For each critical glTF asset:

- load through a central asset registry;
- apply timeout/error handling;
- if an asset fails, use the procedural fallback object for that prop;
- failure of one chair/lamp/prop must not collapse the whole homepage;
- screen UI and navigation must remain available.

The loading shell must not wait indefinitely for optional props. Critical preload has a 6-second upper bound; after that, unresolved props fall back procedurally and the room becomes usable.

## 11. Files/modules expected

The design expects these boundaries unless implementation discovers a concrete incompatibility with the existing code:

- `src/home/home-experience.js` — startup state and final journey integration;
- `src/views/home-view.js` — non-flashing loading shell;
- `styles/home-immersive.css` — startup and shared transition visuals;
- `src/home/scene/study-room-renderer.js` — asset preload, rendering, parallax integration and transition projection;
- `src/home/scene/build-room.js` — hybrid procedural/imported object anchors and layer registry;
- `src/home/scene/materials.js` — upgraded local material system;
- `src/home/scene/interaction-controller.js` — multi-layer inertial pointer state;
- `src/home/scene/camera-timeline.js` — final runway tuning;
- new `src/home/scene/asset-registry.js` — local glTF loading, caching, fallbacks and disposal;
- new `src/home/home-shared-transition.js` — Home/Paths handoff state;
- `src/views/paths-view.js` — receiving transition surface and reverse-entry support;
- `assets/3d/**` — local optimized free assets;
- `assets/3d/ATTRIBUTION.md` — source/license record.

If a boundary must change during implementation, the reason must be documented in the corresponding implementation commit rather than silently introducing a parallel mechanism.

## 12. Testing strategy

All behavior changes follow red-green TDD.

Add or strengthen tests for:

- successful WebGL startup never exposing the legacy fallback;
- WebGL failure still exposing fallback navigation;
- first-frame ready contract;
- asset registry local-only policy and procedural fallback behavior;
- attribution/license metadata for every imported asset;
- imported asset count and total byte budget;
- disposal of imported geometries/materials/textures;
- bounded multi-layer parallax amplitudes;
- at least 4 distinct depth coefficients and maximum 12 moving layers;
- pointer leave reset;
- reduced-motion parallax disable;
- no mouse parallax on mobile;
- final transition runway timing/easing and >=90% visual-completion navigation threshold;
- shared Home→Paths handoff state and fallback path;
- Paths→Home reverse handoff and anti-loop hysteresis;
- existing screen legibility/projection constraints;
- desktop and 390×844 camera composition;
- Safari-safe coherent release-token graph;
- complete existing suite.

## 13. Verification before release

Before claiming V24 complete:

- run the full Node test suite;
- run committed-secret checks;
- verify the exact final commit SHA;
- verify GitHub Pages build and deployment on that exact SHA;
- verify no external runtime asset URLs are required;
- verify all imported assets have recorded licenses;
- verify new model/texture payload stays within the specified byte ceiling;
- inspect desktop and 390×844 behavior as far as available tooling permits;
- do not claim visual parity with Igloo Inc.; validate interaction contracts and ask for user visual confirmation where browser rendering cannot be inspected directly.

## Definition of done

V24 is done only when all of the following are true:

- normal startup no longer flashes the old homepage;
- major props no longer read as obvious box/cylinder primitives;
- materials show plausible surface response at the current camera distances;
- several small scene elements visibly respond to desktop pointer movement at different depths;
- reduced motion still preserves the scroll journey while disabling autonomous parallax;
- mobile keeps readable screens without losing room context;
- the final Paths transition reads as entering the Paths surface rather than switching pages;
- the transition reverses from the top of Paths through the same shared visual handoff concept;
- no paid runtime dependency or recurring cost is introduced;
- new runtime 3D assets stay within the V24 payload ceiling;
- tests, secret checks and GitHub Pages deployment are green on the final commit.
