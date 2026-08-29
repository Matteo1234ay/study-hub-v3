# Study Hub Immersive Home V23 Design

## Goal

Complete the user-approved immersive Study Hub homepage without replacing the semantic Three.js room already shipped in V22. The result must keep the scroll-driven desktop and mobile journey, remain usable with reduced motion, improve physical depth and realism, and make the cinematic transition to `#/paths` reversible.

## Baseline to preserve

- Six semantic stations backed by real Study Hub state.
- Separate desktop and portrait camera timelines.
- Scroll-driven room and object animation on mobile and desktop.
- Cumulative lighting, high-resolution screen textures, mipmapping and anisotropy.
- Adaptive DPR, WebGL context-loss fallback, cleanup and Safari-safe release tokens.
- Direct links and DOM fallback when WebGL is unavailable.

## Journey and reduced motion

WebGL-capable devices always keep the user-driven cinematic journey. Reduced motion disables pointer parallax and autonomous easing only; it does not shorten the page or freeze camera, light, screen or reveal changes driven directly by scroll.

The scroll budget is explicit instead of being hidden in an arbitrary percentage:

- desktop content tour: 600 viewport heights;
- desktop final runway: 140 viewport heights;
- mobile content tour: 1100 viewport heights;
- mobile final runway: 180 viewport heights.

`resolveJourneyLayout(width)` returns these values and the derived normalized boundary. `resolveJourneyPhases(progress, width)` maps the main tour and final runway independently. The final navigation trigger remains near the end of the runway, never at its beginning.

## Reversible Home to Paths transition

A focused module owns cinematic route state. Before automatic Home → Paths navigation it stores a short-lived record in `sessionStorage` containing the origin, timestamp and safe resume progress. Normal menu navigation never writes this record.

When `#/paths` is opened from the cinematic exit and the document is still at the top, a deliberate upward wheel/trackpad gesture or upward finger movement returns to `#/home`. The home experience consumes the resume record and scrolls to the final runway just before the exit threshold. A re-entry lock prevents immediate navigation back to Paths until the user moves sufficiently away from the trigger or deliberately scrolls forward again. The record expires and is cleared after use, so refreshes and ordinary Paths visits do not acquire special behavior.

## Layered interaction

The pointer controller exposes an inertial normalized offset, not a direct camera rotation. The room registers a small bounded list of semantic parallax layers: papers, books, interface surfaces and desk props. Each layer keeps its original transform and receives a tiny depth-weighted offset. The camera receives a separate smaller offset. The effect is disabled on mobile, during the exit runway and whenever reduced motion is requested. Pointer leave eases all layers back to their origin.

## Materials, geometry and lighting

Materials remain local and procedural to avoid network dependencies. Wood, fabric, wall and floor gain paired color/roughness/normal detail with deterministic texture generation. Metal and glass use physically plausible response values. The renderer enables ACES tone mapping, calibrated exposure and soft shadow settings. Existing geometry is refined only where silhouette and contact matter; decorative object count must not grow.

Lighting remains cumulative. Screen spill and the articulated lamp affect nearby surfaces, while neutral ambient/fill lighting prevents crushed blacks. Blue remains an interface accent rather than the room's dominant color.

## Performance and fallbacks

- Mobile starts at the balanced quality profile and caps DPR.
- Reduced motion keeps scroll rendering but avoids continuous autonomous frames when the page is stationary.
- Parallax layers are capped and allocate no objects per frame.
- Procedural maps stay within the established texture budget and are disposed with the room.
- WebGL failure leaves every Study Hub route available through the DOM fallback.

## Testing

Tests cover journey budgets, reduced-motion scroll behavior, route provenance, wheel/touch return, expiration and anti-loop state, layered parallax smoothing and reset, material maps, renderer tone/shadow contracts, disposal, mobile camera layout, Safari version coherence and the complete existing suite.
