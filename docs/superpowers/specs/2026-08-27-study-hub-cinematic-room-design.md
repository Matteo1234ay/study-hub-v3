# Cinematic Study Hub Room — Design

## Goal
Replace the abstract blue WebGL object with a recognizable futuristic personal study hub and make scrolling act like camera direction: every segment of scroll deliberately moves attention to one study function.

## Experience
The homepage is one continuous sticky cinematic scene lasting roughly 900vh. It begins with a distant view of a suspended study pod/room, moves through the front opening, then orbits and pushes the camera toward specific stations: active lesson desk, notes wall, Social Media path, assessments, progress, other paths, and final overview.

The hub must read as a place rather than a logo: floor/platform, central desk, display wall, shelves/modules and illuminated functional nodes. Text is secondary and contextual. No motivational headline dominates the scene.

## Visual language
Dark near-black environment, translucent glass/ice materials, cool white and electric blue light with subtle violet iridescence. Geometry is architectural and layered rather than a single primitive. Use original Study Hub geometry and copy; borrow only the cinematic interaction principles of Igloo Inc.

## Scroll choreography
1. 0–12%: distant establishing shot, whole hub visible.
2. 12–25%: camera approaches the entrance and the shell opens.
3. 25–38%: camera lands on central desk / current lesson.
4. 38–50%: camera pans to notes/review wall.
5. 50–63%: camera turns to Social Media Manager path core.
6. 63–74%: camera pushes toward assessment module.
7. 74–84%: camera glides to progress/data module.
8. 84–94%: camera widens to reveal dormant future paths.
9. 94–100%: final wide shot with actionable links.

## Technical architecture
Use native WebGL2 already present in the repository, with an SDF/raymarch fragment shader. Replace the current box SDF with a composed room/pod scene built from boxes, rounded boxes, slabs, desk, screens and module lights. The shader receives a `journey` uniform and computes a piecewise camera path and look-at target across the scroll timeline.

DOM overlays remain for accessible labels and links. Their visibility is driven by the same journey progress so only the currently relevant station is emphasized. Reduced-motion receives a static, readable fallback.

## Constraints
- No CDN or external runtime dependency.
- Must remain compatible with current CSP (`script-src 'self'`, `style-src 'self'`).
- Must keep existing routes and Study Hub data stores intact.
- Must preserve reduced-motion support.
- Must not regress focus-mode and versioned-asset tests.
- Homepage must remain one continuous scene, not a card grid or stacked marketing sections.
