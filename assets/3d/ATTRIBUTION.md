# 3D Asset Attribution

## Desk Lamp Arm 01
- Source: Poly Haven — Desk Lamp Arm 01
- Authors: Kuutti Siitonen (modeling/texturing), Yann Kervran (rigging)
- License: CC0 1.0 / public domain dedication
- Runtime copy: optimized 1K glTF files stored in `assets/3d/desk-lamp-arm-01/`
- Production network dependency: none

## Study Hub Studio Core
- Source: project-authored geometry for Study Hub; no third-party model is embedded
- Runtime copy: `assets/3d/studio-core/studio-core.glb`
- Editable/reproducible Blender recipe: `scripts/blender/build-studio-core.py`
- Contents: desk, monitor shell, keyboard, mouse, chair, books and mug with local PBR materials
- Production network dependency: none

## Study Hub Home V29
- Source: project-authored Blender scene for Study Hub; no third-party model is embedded
- Editable Blender source: `assets/3d/home-v29/study-hub-home-v29.blend`
- Runtime copy: `assets/3d/home-v29/study-hub-home-v29.glb`
- Reproducible generator: `scripts/blender/build-home-v29.py`
- Build workflow: `.github/workflows/build-home-v29.yml`
- Materials: locally authored warm plaster, walnut, graphite/aluminum, charcoal fabric, warm paper, monitor glass, ceramic and restrained Study Hub emissive accents
- Mechanical content: separate drawers, cabinet door, pull-out shelf, articulated lamp hierarchy, ergonomic chair, books and papers with named animation clips
- Texture generation: deterministic and offline inside Blender; no texture CDN or runtime asset host
- Production network dependency: none

## Study Hub Home V30
- Direction: realistic CC0/local physical studio rebuilt as a semantic digital archive.
- CC0 sources: Poly Haven `desk_lamp_arm_01`, `office_notepads`, `stationery_supplies`, `drawer_cabinet`, `poly_haven_studio`, `natural_walnut_veneer`, and `white_plaster_02`.
- License: source assets are CC0 1.0 Universal/public-domain dedication.
- Provenance ledger: `assets/3d/home-v30/manifest.json` records source pages, authors, local filenames, byte counts, SHA-256 hashes, and build transformations.
- Reproducible vendor: `scripts/home-v30/vendor-polyhaven.mjs` uses Poly Haven's public API only during development and verifies downloaded files before they are committed.
- Runtime policy: the production application consumes committed local derivatives only; no asset API, CDN, analytics, or remote render service is required.
- Production network dependency: none

The runtime application reads committed local copies only. Poly Haven and other external services are not contacted by the published Study Hub.
