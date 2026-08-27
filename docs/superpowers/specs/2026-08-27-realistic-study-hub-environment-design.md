# Realistic Study Hub Environment Design

## Goal
Transform the current cinematic WebGL Study Hub from a stylized geometric scene into a believable premium study environment while preserving the long scroll-driven camera tour and readable station dwell.

## Visual direction
The environment should read as a real contemporary study/workspace first, with technology as a secondary layer. The palette moves away from uniform neon blue toward charcoal walls, warm walnut/composite desk surfaces, satin metal, dark glass, neutral fabric, and restrained blue accents only on active digital elements.

## Materials
- Desk: warm dark wood/composite, matte-to-satin response, visible warm tone rather than emissive blue.
- Metal: neutral cool gray with tighter highlights on lamp, monitor stand, chair base and structural details.
- Glass/screens: near-black reflective surfaces with controlled cool emission.
- Fabric/chair: dark neutral diffuse material with broad soft lighting and low specular response.
- Walls/floor: charcoal and warm-neutral surfaces with subtle tonal variation.
- Accent lighting: cool blue only for active SMM/data elements; warm lamp for practical illumination.

## Lighting
Use a three-part believable lighting model: a warm practical lamp near the desk, a soft cool fill from screens, and a subdued neutral room key. Add soft shadows and ambient occlusion so objects sit in the room instead of appearing as isolated shapes. Avoid full-surface emissive materials.

## Geometry and scale
Maintain recognizable real-world proportions. Keep the curved desk, monitor, keyboard, lamp and chair, but add small study cues such as books/notebooks and a mug. Structural room geometry should frame the scene, not dominate it. Rounded edges should be used where furniture would realistically have them.

## Camera and scroll
Keep the long cinematic tour and existing dwell behavior. Camera stops should feel like composed shots of a real environment, not demonstrations of primitives. Text overlays remain readable while the camera holds its subject.

## Constraints
- Native WebGL2 only; no external 3D libraries or paid APIs.
- Preserve GitHub Pages deployment and current CSP.
- Preserve reduced-motion fallback.
- Keep performance suitable for desktop Safari/Chrome; limit raymarch steps and shadow samples.
- Do not replace the scene with a static image; realism must come from geometry, materials and lighting in the interactive renderer.
