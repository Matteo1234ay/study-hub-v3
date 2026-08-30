# Study Hub Immersive Home V25 Design

## Status

Design approved in chat through the sectioned brainstorming flow. This document consolidates the agreed V25 direction before implementation planning.

## Goal

Evolve the current V24 homepage into a more cinematic, more readable and more physically convincing Study Hub on both desktop and mobile, while preserving the existing semantic six-zone room, zero-cost deployment model, reduced-motion behavior and reversible Home → Paths flow.

V25 should improve the experience as a directed sequence rather than as a collection of isolated 3D shots. The user should feel that scroll continuously guides attention through the room, each station has a deliberate reading moment, small objects react with depth and weight, and the final transition into `#/paths` feels like physically entering the Paths display rather than changing pages.

The desired impression is:

> “I am moving through a believable Study Hub and the scene is directing my attention.”

Not:

> “A Three.js page is interpolating between six camera positions.”

## Non-negotiable constraints

- Zero recurring cost.
- No paid APIs, paid SaaS, metered runtime services or required payment method.
- GitHub Pages remains the production target.
- No runtime CDN dependency for critical assets.
- Three.js and helper modules remain served locally from the repository.
- Any new 3D/model/texture asset must be free to use and redistribution-compatible; prefer CC0/public-domain or equivalent permissive licenses.
- All third-party asset sources/licenses must be recorded in the repository.
- Preserve all six semantic Study Hub stations and all existing routes.
- Preserve the current Home → `#/paths` destination.
- Preserve the reversible Paths → Home interaction for users who reached Paths through the cinematic exit.
- Preserve scroll-driven motion with `prefers-reduced-motion`; reduced motion disables autonomous pointer/parallax behavior, not user-controlled scroll progression.
- Keep Safari/iPhone usability as a primary target.
- No image-generation step is part of this implementation. The work is code/assets in GitHub.

## Current V24 baseline

V24 already provides a strong foundation that must not be regressed:

- Three.js semantic room with six Study Hub zones;
- separate desktop and mobile camera shot definitions;
- scroll-driven journey;
- PBR materials and ACES tone mapping;
- PMREM `RoomEnvironment` image-based lighting generated locally;
- rounded procedural geometry for high-salience objects;
- high-resolution active station screen textures;
- anisotropic filtering and mipmapping for station screens;
- cumulative station lighting;
- multi-layer inertial pointer parallax on desktop;
- no pointer parallax on reduced-motion paths;
- final extended scroll runway;
- three-stage final camera logic (`establish`, `dolly`, `handoff`);
- shared Home/Paths transition surface;
- reverse handoff from Paths to Home;
- Safari-safe release-token cache graph;
- Node tests and committed-secret checks in CI.

V25 is a refinement/re-regie of this architecture, not a rewrite of the platform.

## Why V24 can still improve

### Camera movement is still shot-to-shot interpolation

The current camera timeline is primarily a sequence of fixed station poses with interpolation between them. Even when eased, this can read as “move to station A, then station B” rather than a camera that naturally arcs, anticipates the next subject and settles for reading.

### Mobile framing prioritizes context at the expense of subject scale

The mobile shot list uses wide fields of view, reaching approximately 56 degrees. This keeps room context visible but can make important display content feel smaller than necessary on portrait devices.

### Reading rhythm is not explicit enough

The scene has station settle ranges, but the camera, lighting, UI simplification and scroll pacing are not yet governed by one explicit “reading phase” concept.

### Lighting changes still feel somewhat like boosted station highlighting

The existing lighting controller boosts the active zone strongly. This works functionally, but can look more like a selected object being highlighted than a camera entering a different part of the same real environment.

### Parallax is functional but still object-list oriented

V24 already moves several props independently. V25 should group movement by semantic depth/weight clusters and make the effect read as physical depth rather than a list of objects with offsets.

### The final transition is improved but can be more authored

The existing final sequence already has `establish → dolly → handoff`. V25 should add a controlled crash-zoom beat late in the sequence, integrate it with the Paths display and make the route handoff/reverse feel even more continuous.

---

# 1. V25 director layer

## Design intent

Introduce a dedicated “director” concept that coordinates camera, look target, station phase, lighting emphasis, screen readability and object motion from a single normalized journey timeline.

The director does not replace the existing renderer. It becomes the orchestration layer above the camera timeline and scene controllers.

Each semantic station gets three explicit stages:

1. **Approach** — the camera starts orienting toward the station before fully arriving.
2. **Read** — the subject becomes stable enough to read; camera velocity and distracting motion are reduced.
3. **Release** — the camera begins leaving the station and visually hooks the next area before fully moving there.

This produces attention flow instead of teleport-like interpolation.

## Camera path behavior

The camera should no longer move only along straight interpolation between two fixed positions.

Use a curve-based path for transitions, preferably Catmull-Rom or cubic Bezier sampling over authored control points. The implementation can stay lightweight and deterministic; it does not require a physics engine.

For every station transition, define:

- start position;
- optional lateral/vertical control point(s);
- end position;
- start look target;
- anticipatory look target;
- final station target;
- FOV curve;
- read-zone velocity reduction.

The camera body and look target should not reach the next subject at exactly the same time. The look target may anticipate the subject slightly before the camera position arrives, which guides the eye naturally.

## Motion hierarchy

The intended order is:

`look target anticipates → camera arcs toward station → FOV gently settles → read phase stabilizes → target begins anticipating next station → camera releases`

The effect must remain fully scroll-driven. No autonomous camera animation after the user stops scrolling.

## Read-phase behavior

During the middle portion of each station:

- camera position changes minimally;
- look target changes minimally;
- FOV becomes stable;
- active screen switches to high-resolution/read mode;
- caption prominence can reduce if the physical screen is already readable;
- pointer parallax amplitude is reduced but not necessarily removed on desktop;
- nearby distracting props use lower movement amplitude;
- lighting ratios settle.

The user should be able to stop scrolling at any read phase and see a deliberate composition.

## Desktop direction

Desktop can use more lateral motion and spatial arcs because there is horizontal room in the viewport.

Use the desk/room architecture to create parallax naturally as the camera moves past foreground elements. Avoid excessive orbiting; the scene should still feel like a directed interior walkthrough.

## Mobile direction

Mobile must have a separately authored composition policy, not a crop of desktop.

Goals:

- generally narrower FOV than current V24 portrait shots;
- camera may sit slightly farther back to retain room context while keeping a larger screen projection;
- no station screen should dominate so much that the room context disappears;
- no station screen should become so small that reading depends on external captions;
- portrait-safe top/bottom headroom;
- no important text behind the iOS browser chrome or safe-area zones.

Target viewport for acceptance tests remains approximately 390×844, with additional reasoning for 360–430 px widths.

---

# 2. Scroll rhythm

## Design intent

Do not simply make the page longer. Redistribute scroll distance according to perceptual value.

Each station gets different runway allocations for:

- approach;
- read;
- release.

Read phases receive more physical scroll distance than low-information transitions.

## Desktop pacing

Desktop wheel/trackpad interaction can support slightly shorter read windows than touch because fine scroll control is easier.

The director should maintain enough runway that normal trackpad movement cannot unintentionally skip a whole station.

## Mobile pacing

Mobile touch gestures cover larger effective scroll distances. Therefore mobile should allocate more physical runway to read phases and important camera turns.

A single ordinary swipe should not normally jump from the beginning of one station to the end of the next.

## Velocity-sensitive visual damping

V25 may read scroll velocity to modulate only visual damping, not journey position.

Allowed:

- fast scroll → slightly more camera smoothing and less micro-parallax;
- slow scroll → full detail/read behavior.

Not allowed:

- changing the semantic scroll destination based on velocity;
- momentum-driven autonomous movement after user input;
- hijacking native scroll.

---

# 3. Screen legibility and UI hierarchy

## Read mode

Every active station screen gets a deliberate read state.

When the station is in its read phase:

- use active/high-resolution canvas texture;
- simplify visible content;
- use stronger contrast;
- use fewer secondary facts;
- reserve enough physical screen area around text to prevent edge blur;
- keep anisotropic filtering and mipmapping;
- keep the display close to perpendicular enough for readability when possible.

## Mobile text policy

Mobile station UI should be stricter than desktop:

- one main title;
- one main number/status/action;
- maximum two short support lines;
- no decorative microcopy;
- no tiny labels required to understand the station;
- active UI should not depend on reading external captions.

## External captions

External station captions become supporting narration rather than duplicated monitor content.

Desktop:

- smaller visual footprint;
- less opaque panel treatment;
- prefer one strong sentence and optional action.

Mobile:

- minimal lower-third treatment;
- disappear or reduce further in read phases where the physical screen is self-explanatory;
- never cover the main monitor projection.

---

# 4. Lighting direction

## Goal

Make station changes feel like moving through one believable room rather than switching selected spotlights.

## Lighting model

Retain the current PBR/PMREM/ACES base, but rebalance the lighting controller around ratios rather than large local intensity jumps.

Components:

- stable neutral ambient/fill preserving dark-material detail;
- stable directional/key logic establishing the room;
- warm practical contribution near desk/lamp;
- restrained cool spill near active displays;
- subtle station emphasis achieved by adjusting relative levels rather than dramatically boosting one light.

## Station focus

A station becoming active should:

- raise its practical/display spill modestly;
- slightly reduce unrelated zone emphasis if needed;
- keep cumulative room continuity;
- avoid large exposure-looking changes;
- avoid saturating the room blue.

## Final Paths phase

During the final approach, the room should not abruptly go black.

Instead:

- peripheral zone emphasis lowers gradually;
- Paths display remains readable;
- light direction supports forward motion;
- the display becomes the visual destination;
- the later crash zoom is supported by contrast, not by flashing brightness.

---

# 5. Material and object realism

## Hybrid realism strategy

Continue the V24 hybrid strategy.

Architectural/semantic elements stay procedural where code control matters. High-salience recognizable props may be replaced with local free 3D assets if they materially improve realism and remain within performance/licensing budgets.

Priority candidates:

- ergonomic chair;
- articulated lamp;
- mug;
- selected books/binders;
- one or two desk accessories;
- monitor body only if a free asset improves silhouette without complicating screen attachment.

## Asset policy

Every imported model must:

- be downloaded once and committed locally;
- have redistribution-compatible licensing;
- be documented in `assets/3d/ATTRIBUTION.md`;
- have no required external runtime request;
- have a procedural fallback;
- not become a single point of failure for Home.

## Performance budget

Maintain a conservative V25 budget:

- maximum 7 imported model props;
- target added model+texture payload <= 8 MB;
- hard ceiling 12 MB;
- no 4K textures;
- critical first-frame assets target <= 5 MB;
- mobile begins balanced quality;
- adaptive DPR remains active;
- imported assets must be disposed on route teardown.

If a free asset is visually better but too heavy, optimize it or reject it.

## Procedural fallback improvement

For props remaining procedural:

- maintain rounded/beveled silhouettes;
- add believable thickness/gaps;
- avoid mathematically perfect repeated spacing where visible;
- use material-specific roughness/normal response;
- avoid adding geometry purely to increase polygon count.

---

# 6. Igloo-inspired depth interaction

## Goal

Increase the perception that the scene contains layered physical objects reacting to the pointer, without making props float or turning the whole room into a mouse-follow effect.

## Cluster model

Replace the mental model of “nine individual parallax objects” with semantic clusters.

Suggested clusters:

### Desk cluster

- mug;
- mouse;
- keyboard;
- one or two lightweight desk props.

### Memory cluster

- selected post-its/papers;
- one nearby binder/book.

### Social/assessment cluster

- subtle interface glass/reflection offsets;
- one lightweight nearby physical detail.

### Paths cluster

- selected binders;
- small foreground archive detail.

Each cluster contains objects with different weight coefficients.

## Weight rules

- paper/lightweight UI decoration: strongest response;
- books/mug: medium response;
- keyboard/mouse: subtle response;
- monitor body/lamp: very low response;
- major furniture: almost static;
- camera: smaller amplitude than visible foreground props.

## Motion components

Each layer may receive:

- small x/y translation;
- tiny x/y rotation;
- individual damping;
- depth coefficient;
- optional reflection/texture offset when technically safe.

No visible z-position drift that makes objects detach from their supporting surfaces.

## Scroll interaction

Scroll choreography remains authoritative.

Pointer effects are applied additively after the scroll-derived pose. When scroll velocity is high, parallax amplitude may be reduced to avoid visual noise.

## Desktop only

Pointer parallax is desktop-only.

## Mobile

Do not simulate mouse movement using device orientation by default.

Mobile depth movement comes from scroll-driven lag/reveal offsets only. These offsets must remain deterministic and user-controlled.

## Reduced motion

Disable pointer parallax and delayed prop reactions under reduced motion. Preserve the scroll journey and station reveals.

---

# 7. V25 final Paths sequence

## Narrative sequence

The final sequence becomes:

1. **Final station read** — the Paths station is readable and stable.
2. **Establish** — camera briefly re-establishes enough room context to make the destination spatially understandable.
3. **Convergence** — peripheral lighting and prop emphasis guide attention toward Paths.
4. **Dolly** — camera starts a slow forward move toward the Paths display.
5. **Pre-crash settle** — a short perceptual beat before the speed change.
6. **Crash zoom** — controlled rapid forward compression toward the Paths screen.
7. **Screen lock** — the display fills/almost fills the viewport and perspective error is minimized.
8. **Shared handoff** — the shared transition surface takes over visually.
9. **Route commit** — navigation to `#/paths` occurs after the visual handoff is effectively complete.
10. **Reveal** — shared surface resolves into the real Paths page.

The crash zoom is a late accent, not the entire final transition.

---

# 8. Crash zoom design

## Intent

The crash zoom should create a sudden cinematic acceleration that feels intentional and exciting, while remaining continuous with the existing final dolly.

It must not feel like:

- an abrupt FOV snap;
- a CSS scale gimmick;
- a full-screen blur transition;
- a camera teleport;
- a movement so fast that the destination becomes unreadable.

## Mechanism

Use a combined camera-position and FOV curve rather than only changing FOV.

The crash zoom must use:

- a quick increase in forward camera velocity toward the Paths display;
- a **moderate FOV narrowing** synchronized with the forward rush; desktop may narrow more than mobile, but neither path may widen the FOV during the crash phase;
- a stable target locked on the display center;
- minimal lateral movement during the crash phase;
- peripheral depth separation from nearby props;
- handoff surface expansion synchronized to the screen projection.

The implementation should prioritize a believable “camera rushes into screen” feeling over a literal cinematography textbook dolly-zoom simulation.

## Timing

The final exit runway remains long enough for control.

Suggested normalized exit allocation:

- establish: 0.00–0.18;
- convergence/dolly: 0.18–0.68;
- pre-crash settle: 0.68–0.76;
- crash zoom: 0.76–0.94;
- screen lock/handoff: 0.90–1.00.

Ranges may overlap for blending.

Navigation must not commit before the handoff surface is visually dominant; target threshold remains >= 90% of the final visual sequence.

## Desktop crash zoom

Desktop may use a slightly stronger positional rush and moderate FOV narrowing because peripheral context is visible before the crash.

## Mobile crash zoom

Mobile crash zoom must be shorter and composition-safe:

- no FOV widening;
- only moderate FOV narrowing;
- no rapid sideways movement;
- maintain the Paths display centered;
- avoid motion that causes browser chrome/safe-area conflicts;
- maintain touch scroll reversibility.

## Reduced motion crash behavior

With reduced motion enabled, do not perform the fast crash acceleration.

Instead:

- keep the user-driven dolly;
- shorten the final screen-lock phase;
- use an opacity/shared-surface handoff;
- preserve reversibility.

---

# 9. Reverse crash/handoff from Paths to Home

The existing reverse transition remains mandatory.

If the user arrived at Paths through the cinematic Home exit and scrolls upward while still at the top of Paths:

1. the Paths page reactivates the shared transition surface;
2. the shared surface contracts toward the saved Paths display projection;
3. Home resumes inside the final runway;
4. the reverse motion should land before the crash-zoom trigger point;
5. the user can continue scrolling upward normally;
6. hysteresis prevents immediate automatic re-entry into Paths.

Do not play a literal full-speed crash zoom backward. Reverse should feel controlled and recoverable.

A good resume target is the pre-crash settle/dolly region, not the last 1–2% of the exit.

---

# 10. Shared transition surface

Retain the body-level shared transition concept from V24.

V25 should strengthen its relationship to the 3D screen:

- projection rectangle must be updated during the final dolly/crash phase;
- border radius/perspective treatment should converge toward flat page geometry;
- title/visual identity should match the real Paths page;
- the surface becomes visually dominant before route commit;
- no generic white/blank frame;
- fallback behavior works without View Transitions API.

The shared surface is the bridge between 3D and DOM, not merely an overlay shown after navigation begins.

---

# 11. Quality profiles

## Desktop high

Allow:

- higher DPR within the existing cap;
- softer/higher-resolution shadows;
- full parallax clusters;
- high-resolution active screen;
- optional higher-detail imported props.

## Desktop balanced

Use:

- moderate DPR;
- balanced shadows;
- same camera/director behavior;
- same semantic content;
- slightly reduced material/prop detail only if required.

## Mobile balanced

Default mobile profile.

Prioritize:

- stable frame pacing;
- readable screens;
- camera/director continuity;
- no pointer parallax;
- reduced shadow cost;
- active-screen quality over decorative texture quality.

The mobile experience must not look like a different product.

---

# 12. Loading and failure handling

V24's no-flash startup contract remains.

V25 must continue to show:

`cinematic preload → first valid rendered frame → ready scene`

Never:

`old DOM Home → wait → 3D Home`

If optional imported assets fail:

- use procedural fallbacks;
- do not fail the whole Home experience;
- do not block navigation;
- do not wait indefinitely.

Critical preload timeout remains finite (target around 6 seconds before fallback decisions).

---

# 13. Proposed module boundaries

V25 should preserve V24 boundaries and add orchestration rather than re-monolithizing the renderer.

Expected responsibilities:

- `src/home/home-experience.js` — journey progress, route integration, shared handoff orchestration;
- `src/home/scene/camera-timeline.js` — authored camera path data and curve sampling;
- new `src/home/scene/director-controller.js` — approach/read/release phase model and coordinated scene state;
- `src/home/scene/renderer-runtime.js` — apply sampled camera/director output per frame;
- `src/home/scene/renderer-setup.js` — lighting/environment/material configuration;
- `src/home/scene/lighting-controller.js` — ratio-based station/room lighting;
- `src/home/scene/parallax-rig.js` — cluster/weight-based parallax application;
- `src/home/scene/build-room.js` — semantic anchors and props;
- `src/home/scene/screen-ui.js` — stricter read-mode UI hierarchy;
- `src/home/home-shared-transition.js` — projection-driven Paths handoff/reverse;
- `src/views/paths-view.js` — receiving/reverse boundary behavior;
- `styles/home-immersive.css` — captions, preload, shared surface and responsive composition;
- optional `src/home/scene/asset-registry.js` if actual free local glTF props are introduced;
- optional `assets/3d/**` and `assets/3d/ATTRIBUTION.md` for local licensed assets.

Do not add a new module unless it has a clear single responsibility.

---

# 14. Testing strategy

All production changes use red-green TDD.

Add/strengthen tests for:

## Director/camera

- every station has approach/read/release phases;
- read phases have bounded camera velocity;
- camera path uses curve sampling rather than only linear shot interpolation;
- look target may anticipate position without overshooting station anchors;
- FOV stays within desktop/mobile safety bounds;
- mobile shot projections remain readable at 390×844;
- station screens do not exceed framing bounds.

## Scroll pacing

- mobile read runways are not shorter than desktop equivalents in physical viewport units where required;
- exit runway remains long enough for final sequence;
- crash phase occupies a bounded fraction of the exit, not the entire exit.

## Screen UI

- active screen texture policy remains high density;
- mobile UI follows simplified information-count rules;
- no prohibited microtext sizes;
- portrait Social display keeps correct aspect ratio;
- active screen redraw only happens when needed.

## Lighting

- focus lighting uses bounded boosts;
- ambient/key continuity remains non-zero across stations;
- final Paths convergence does not black out the room;
- no more than the allowed number of shadow-casting lights.

## Parallax

- at least four distinct depth/weight coefficients;
- maximum 12 moving layers unless an explicit performance test justifies more;
- heavy objects move less than lightweight layers;
- pointer leave returns transforms to base;
- high scroll velocity reduces parallax amplitude only, not journey position;
- mobile and reduced-motion paths disable pointer parallax.

## Crash zoom

- explicit crash phase exists late in exit choreography;
- crash begins only after pre-crash settle;
- crash camera target remains Paths display;
- position and FOV both participate within bounded limits;
- FOV narrows during crash and never widens;
- no lateral overshoot during crash;
- navigation cannot commit before >=90% visual completion;
- reduced motion replaces crash acceleration with controlled handoff;
- mobile crash limits are stricter than desktop.

## Home ↔ Paths

- shared projection updates through crash/handoff;
- route commits only after shared surface dominance threshold;
- direct normal `#/paths` navigation has no reverse hook;
- cinematic Paths entry has reverse hook at top only;
- reverse resumes before crash trigger;
- hysteresis prevents immediate re-entry loop;
- wheel/trackpad/touch reverse remain supported.

## Startup/performance

- no successful-WebGL old-home flash;
- WebGL failure still exposes fallback navigation;
- local-only critical asset policy;
- imported asset attribution/license checks if glTF is added;
- payload budget checks if assets are added;
- disposal/context-loss tests remain green;
- coherent Safari cache release-token graph.

---

# 15. Verification before release

Before calling V25 complete:

- full Node test suite passes;
- committed-secret check passes;
- exact final commit SHA identified;
- GitHub Pages succeeds on that same SHA;
- no paid/runtime external dependency has been introduced;
- no image-generation dependency has been introduced;
- any imported model asset has recorded source/license;
- asset payload remains within budget;
- no stale V24 cache token remains in the V25 Home dependency graph;
- desktop and approximately 390×844 mobile behavior is checked as far as available tooling permits;
- do not claim subjective visual parity with Igloo Inc. without direct visual confirmation from the user.

---

# Definition of done

V25 is complete only when all of the following are true:

- desktop camera movement feels authored as approach/read/release rather than simple point-to-point interpolation;
- mobile framing gives screens more presence without losing room context;
- every station has a stable readable phase;
- external captions are less invasive;
- lighting remains one coherent room rather than obvious station spotlight switches;
- pointer movement creates visible but physically weighted depth on desktop;
- mobile does not fake mouse interaction;
- material/object realism is improved without violating the zero-cost/performance constraints;
- the final Paths sequence includes an authored late crash zoom;
- crash zoom is a short accent inside a longer establish/dolly/handoff sequence;
- the Paths display becomes the shared transition surface before route commit;
- reverse Paths → Home returns to the pre-crash region without looping;
- reduced motion preserves the scroll journey while replacing fast autonomous-feeling crash acceleration;
- startup remains free of the old-home flash;
- tests, secrets check and Pages are green on one final commit;
- the whole result remains zero-cost to host and run under the existing GitHub Pages model.