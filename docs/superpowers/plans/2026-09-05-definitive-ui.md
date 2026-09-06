# Study Hub definitive UI implementation plan

Goal: apply the supplied definitive design to the existing GitHub Pages app.
Architecture: retain vanilla modules, local stores, authored Blender asset and Three renderer. Add a single coherent editorial presentation layer and dedicated Notes and Settings routes. Keep data and assessment contracts unchanged.
Spec: docs/superpowers/specs/2026-09-05-definitive-ui.md

- [x] Replace dark glass presentation with white/ink editorial surfaces, flat navigation and index-based course rows in styles/definitive.css and index.html. Keep semantic native controls and 44px touch targets.
- [x] Give the home an immediate title, accessible skip action and numbered journey navigation. Delay physical disassembly until the exit phase and preserve reversible sampling. Reduced motion uses the accessible poster route without WebGL.
- [x] Add Notes and Settings routes in router.js/app.js, reusing notes-store and preferences. Enable editing existing notes, explicitly starting another note, flushing pending drafts and preserving their original chapter context.
- [x] Retain chapter index, full overview, learning visualizations, assessments, backup and Focus exit. Add a persistent in-lesson reading toolbar and numerical chapter progress.
- [x] Run existing node suite plus behavioral regression tests for reduced motion, note editing and routes. Inspect desktop/mobile with supported browser QA if available. Fix overflow, contrast, clipping and input failures.
- [ ] Review diff, update module cache keys, commit and push the exact verified state to the existing GitHub repository; inspect deployment status.
