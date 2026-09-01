# Study Hub Home V30 — Task 2 Asset Review Checkpoint

Date: 2026-09-01
Branch: `feat/home-v30-realistic-cc0`
Status: awaiting full-suite verification after generated asset commit

## Scope inspected

Compared Task 1 head `d34ca65428da2ced5f75b1504db3db331e183737` with generated asset head `c78b7ac4159713157ba46ba5f5d157c00b9351b9`.

Observed changes are limited to:

- V30 CC0 asset guard tests;
- development-only Poly Haven vendor script;
- V30 asset-vendor workflow;
- attribution/provenance documentation;
- generated V30 manifest;
- generated local CC0 source files under `assets/3d/home-v30/vendor/`.

No production `src/` runtime file changed during Task 2.

## Vendor evidence

Workflow run `33562109921`, job `100036791938`:

- vendored exactly seven approved CC0 assets;
- focused V30 asset tests: 4 passed, 0 failed;
- committed-source secret scan: no possible secrets detected;
- generated vendor payload: approximately 14 MiB;
- artifact ID: `9821646595`;
- generated source commit: `c78b7ac4159713157ba46ba5f5d157c00b9351b9`.

## Production-network rule

The Poly Haven API and `dl.polyhaven.org` are development-time sources only. The generated manifest records local hashes and the published Study Hub must consume committed local derivatives only.

## Remaining gate

Do not mark Task 2 complete until the normal repository `node --test` suite and secret scan run from a user-authored head commit after the generated asset commit and report zero failures.
