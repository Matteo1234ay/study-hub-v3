# Study Hub Home V30 — Task 3 Blender Review Checkpoint

Date: 2026-09-01
Branch: `feat/home-v30-realistic-cc0`
Status: awaiting full-suite verification after generated Blender asset commit

## Build evidence

Workflow run `33562831621`, job `100039113621` completed successfully with Blender 4.0.2.

Generated outputs:

- `assets/3d/home-v30/study-hub-home-v30.blend` — approximately 16 MiB
- `assets/3d/home-v30/study-hub-home-v30.glb` — approximately 14 MiB
- artifact ID `9821941874`
- generated asset commit `7139cb9`

Focused validation reported 16 tests passed, 0 failed. The committed-source secret scan reported no possible secrets.

## Contract covered

The focused tests verify:

- glTF 2 header/version/length;
- hard runtime GLB limit <= 18 MiB;
- every required V30 mechanical node;
- every required V30 Blender animation clip;
- separate walnut, plaster, metal, fabric, paper and glass/ceramic material families;
- no blue-named physical material family;
- CC0 notepad, stationery, drawer cabinet and desk-lamp detail in the final GLB;
- local-only build source paths;
- PBR image/normal texture nodes;
- curves/subdivision/bevel and real mechanical origins/pivots;
- Y-up animated glTF export.

## Review observations

The asset build is structurally valid and substantially different from V29: it includes local CC0 source geometry and local image textures instead of relying only on procedural runtime furniture. The 14 MiB GLB is within the approved 18 MiB hard limit but is close enough that further runtime work should avoid embedding duplicate nonessential texture detail.

Blender emitted non-fatal glTF exporter warnings about multiple image texture nodes sharing samplers and an unavailable optional Draco library. The export completed successfully without Draco and the resulting GLB passed validation. Do not add Draco as a dependency merely to silence that warning.

## Important limitation

This checkpoint does not claim visual acceptance. No Chromium/WebKit screenshot gate has run yet. The scene must remain on the feature branch until runtime integration and browser screenshots are inspected.

## Remaining gate

Do not mark Task 3 complete until the full repository test suite and secret scan run from this user-authored checkpoint commit and report zero failures.
