# Semantic Cinematic Study Hub — Design

## Goal
Turn the homepage into a fluid, cinematic tour of a believable study environment where every camera move, light cue, screen activation and object shown has a semantic reason connected to the accompanying text.

## Problems to solve
- V12 lost fluidity because the fragment shader now combines expensive raymarching, ambient occlusion, soft shadows and multiple dynamic lighting calculations every frame.
- Camera motion reaches useful areas but several targets are framed poorly or change too abruptly.
- The opening is too dark to immediately read as a study room.
- Some environmental objects currently feel decorative or arbitrary rather than related to the copy.
- The scene needs representational visuals on monitors/panels so each written concept has a matching visual anchor.

## Experience principles
1. The room must be understandable from the first frame. It begins dim, not black: desk, chair, shelves, wall monitors and room boundaries are visible as silhouettes with low ambient fill.
2. Scroll remains the primary controller. Every segment follows a cinematic pattern: approach → settle → hold → leave.
3. Lighting guides attention. Only the current area receives strong local light; the rest remains subdued. Mouse movement adds a subtle parallax/light response, never enough to fight the camera.
4. Screens and lamps activate only when narratively relevant. Monitor glow must illuminate nearby surfaces.
5. The entire room becomes fully lit only in the final overview.
6. No object is decorative without purpose. If an object is framed, it must visually represent the concept being described.

## Semantic scene mapping
- Opening / Study Hub: wide room silhouette, desk and monitor visibly recognizable.
- Active desk / current lesson: desk monitor powers on and shows a lesson-layout visual with heading, chapter progress and reading blocks.
- Notes + review: camera moves to shelving / note wall containing filled notebooks, pinned note cards and review markers. Empty shelving is removed unless it communicates future capacity.
- Social Media path: camera targets a dedicated screen or physical media board showing a social-feed grid, reach/impressions-like visual and content nodes. Arbitrary planet-like geometry is removed.
- Assessment: camera targets a quiz console with selectable answers / completion state rather than a generic cylinder.
- Progress: camera targets a progress display with bars, competency rings and trend graph rather than an abstract torus.
- Future modules: dormant labelled modules or closed folders/screens, clearly communicating unavailable future paths rather than unexplained shapes.
- Final overview: room lighting rises globally and every functional station is visible together.

## Camera choreography
Use piecewise eased camera keyframes with both camera position and look target interpolated continuously. Each scene reserves a stable hold interval where camera and target move minimally so text is readable and the intended object remains centered. Avoid abrupt target reassignment between branches.

Suggested timeline:
- 0–12% establish room
- 12–22% enter
- 22–35% active desk
- 35–48% notes/review
- 48–61% social media path
- 61–73% assessment
- 73–84% progress
- 84–94% future modules
- 94–100% final illuminated overview

## Lighting
- Base ambient fill from frame zero around 8–12% of final room brightness.
- Guided key light follows the current semantic target, not merely the camera.
- Desk lamp powers on during desk scene.
- Desk and wall monitors power on progressively when first needed and remain logically active afterward.
- Screen emissive light contributes local blue/cool illumination.
- Final room light uses `smoothstep(.94,1.0,j)` and reveals neutral material colors across the room.

## Visual content inside the environment
Representational visuals should be built procedurally inside the existing WebGL scene where possible, using thin planes, bars, cards, graph lines and screen regions rather than external raster images. This keeps the site self-contained and avoids loading overhead while still giving each written section an obvious visual counterpart.

## Realism
- Desk: believable thickness, support legs, monitor stand, keyboard, lamp base and articulated arm.
- Chair: separate seat/back/base with plausible proportions.
- Shelving: supports, books/notebooks and note cards rather than empty slabs.
- Assessment console: angled screen with UI geometry.
- Progress screen: framed display with graph/bars.
- Materials: warm wood, satin metal, dark glass, textile, matte walls and floor; blue only for active digital content.
- Keep bevels subtle and dimensions consistent across objects.

## Performance strategy
- Reduce raymarch iterations and expensive shadow/AO samples where visually safe.
- Compute expensive effects only when a hit exists and scale their contribution with scene need.
- Lower device pixel ratio cap for high-DPI displays if necessary.
- Keep mouse interaction smoothed and lightweight.
- Prefer emissive screen geometry and simple local-light approximations over additional full shadow rays.
- Preserve WebGL2 and no external runtime dependencies.

## Accessibility and fallback
- Keep DOM text overlays and links as the accessible source of truth.
- Preserve reduced-motion fallback.
- If WebGL is unavailable, the page must remain readable and navigable.

## Success criteria
- The room is immediately identifiable as a study environment even before lights turn on.
- Camera framing keeps the relevant object visible and centered during each text scene.
- Every featured object corresponds directly to the copy.
- Monitor/lamp activations are visibly timed to scroll scenes.
- Final scene is the first moment when full-room lighting is enabled.
- Interaction remains noticeably smoother than V12 on the same device.
