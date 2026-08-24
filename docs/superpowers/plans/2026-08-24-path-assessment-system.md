# Path Assessment System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add progressive path checks and locked final exams that evaluate a balanced subset of lesson question banks and identify precise learning gaps.

**Architecture:** A public path manifest describes status, included lessons, competency weights, coverage rules, and thresholds. Pure modules validate manifests, merge lesson banks, select a reproducible balanced question set, score path-level results, and persist immutable sessions; the UI reuses the existing assessment controls and local-only privacy model.

**Tech Stack:** Browser-native ES modules, static JSON, DOM APIs, `localStorage`, Node.js built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-24-path-assessment-system-design.md`

## Global Constraints

- The site remains static and hosted on GitHub Pages.
- Selection, correction, scoring, and persistence run entirely in the browser.
- Do not use Apps Script, Google Cloud, OAuth, Google Sheets, remote AI, billable APIs, trials, credentials, tokens, secrets, or runtime dependencies.
- Questions come only from reviewed public lesson banks or reviewed transversal banks.
- Progressive levels refer only to currently published content.
- Final exams remain locked until the manifest explicitly uses `status: "complete"`.
- Responses and attempts remain in `study-hub-v3:path-assessment:` local keys and the existing JSON backup.

---

### Task 1: Path Manifest and Validation

**Files:**
- Create: `data/path-assessments/smm.json`
- Create: `src/path-assessment/path-schema.js`
- Create: `tests/path-assessment-schema.test.js`
- Modify: `src/config/paths.js`

**Interfaces:**
- Produces `validatePathAssessment(value)` returning a normalized manifest or `null`.
- Adds `assessmentManifestUrl` to the SMM path only.

- [ ] **Step 1: Write failing tests for valid `in-progress`, invalid statuses, duplicate lessons, bad thresholds, and a forbidden final-ready state without mandatory competencies.**

```js
test("accepts the in-progress SMM manifest", () => {
  const manifest = validatePathAssessment(raw);
  assert.equal(manifest.pathId, "smm");
  assert.equal(manifest.status, "in-progress");
  assert.equal(manifest.selection.minQuestions, 10);
});
```

- [ ] **Step 2: Run `node --test tests/path-assessment-schema.test.js`; expected: missing-module failure.**

- [ ] **Step 3: Implement strict validation of IDs, status, lesson references, competency weights, mandatory flags, selection bounds 1–50, progressive thresholds, and final thresholds.**

- [ ] **Step 4: Create SMM manifest version 1 with `status: "in-progress"`, SMM-01, the five existing competencies, 10–15 progressive questions, and a locked final exam.**

- [ ] **Step 5: Run schema tests and parse JSON; expected: exit 0.**

- [ ] **Step 6: Commit with `feat: add SMM path assessment manifest`.**

### Task 2: Question Pool and Deterministic Balanced Selector

**Files:**
- Create: `src/path-assessment/question-pool.js`
- Create: `src/path-assessment/selector.js`
- Create: `tests/path-question-pool.test.js`
- Create: `tests/path-selector.test.js`

**Interfaces:**
- Produces `buildQuestionPool({ manifest, assessments })` with globally stable question IDs, lesson/chapter provenance, and normalized competency IDs.
- Produces `selectPathQuestions({ manifest, pool, seed, recentQuestionIds, weakCompetencyIds })` returning `{ seed, questions, coverage }`.

- [ ] **Step 1: Write failing pool tests for merged banks, provenance, duplicate IDs, missing lesson banks, and declared partial coverage.**

- [ ] **Step 2: Implement a pure merger that prefixes internal collision keys with lesson ID while preserving original question IDs for reporting.**

- [ ] **Step 3: Write failing selector tests proving same-seed reproducibility, different-seed variation, competency coverage, lesson distribution, maximum bounds, no duplicates, reduced recent repetition, and moderate weak-area priority.**

```js
test("same seed returns the same ordered questions", () => {
  assert.deepEqual(selectPathQuestions(input(42)).questions.map(q => q.poolId), selectPathQuestions(input(42)).questions.map(q => q.poolId));
});
```

- [ ] **Step 4: Implement a small seeded PRNG and deterministic ranking: first satisfy uncovered competencies, then lesson spread, then weak-area boost, recent-question penalty, and seeded tie-break.**

- [ ] **Step 5: Run pool and selector tests; expected: all pass.**

- [ ] **Step 6: Commit with `feat: select balanced path assessment questions`.**

### Task 3: Path Scoring, Levels, and Gap Links

**Files:**
- Create: `src/path-assessment/path-score.js`
- Create: `src/path-assessment/path-insights.js`
- Create: `tests/path-score.test.js`
- Create: `tests/path-insights.test.js`

**Interfaces:**
- Reuses `scoreAttempt()` from `src/assessment/assessment-engine.js`.
- Produces `scoreProgressivePath({ manifest, selectedAssessment, answers })`.
- Produces `scoreFinalPath(...)` with mandatory-competency gates.
- Produces `derivePathInsights({ selectedQuestions, result, attempts })` with lesson/chapter review targets.

- [ ] **Step 1: Write failing progressive-level tests for 85, 70, 55, and below-55 boundaries plus a label containing the latest included lesson ID.**

- [ ] **Step 2: Implement progressive levels: `solid`, `good`, `partial`, `consolidate`, always marked as current-content coverage.**

- [ ] **Step 3: Write failing final tests proving `in-progress` is locked, total 75 is insufficient when a mandatory competency is below 60, and complete/advanced/excellent thresholds follow the manifest.**

- [ ] **Step 4: Implement final gating without professional-certification language.**

- [ ] **Step 5: Write failing insight tests that return exact `{ lessonId, chapterId, competencyId, priority }` targets and retain recurring misses across attempts.**

- [ ] **Step 6: Implement gap aggregation and stable priority sorting.**

- [ ] **Step 7: Run scoring and insight tests; expected: all pass.**

- [ ] **Step 8: Commit with `feat: score path mastery and learning gaps`.**

### Task 4: Immutable Local Sessions and Backup

**Files:**
- Create: `src/path-assessment/path-store.js`
- Create: `tests/path-store.test.js`
- Modify: `tests/backup.test.js`

**Interfaces:**
- Produces `createPathAssessmentStore(storage = localStorage, now = ..., randomSeed = ...)`.
- Methods: `createSession`, `getSession`, `saveAnswers`, `submitSession`, `getAttempts`, `getRecentQuestionIds`, `clearPath`.
- Keys: `study-hub-v3:path-assessment:sessions` and `study-hub-v3:path-assessment:attempts`.

- [ ] **Step 1: Write failing tests for immutable question selection, answer drafts, version separation, 100-attempt cap per path, malformed recovery, and explicit clearing of one path only.**

- [ ] **Step 2: Implement guarded reads and structured-clone returns. A saved session stores path/manifest versions, mode, seed, pool IDs, coverage, answers, creation time, and submission state.**

- [ ] **Step 3: Extend backup tests to prove both path-assessment keys export and import through the existing namespace filter.**

- [ ] **Step 4: Run store and backup tests; expected: all pass.**

- [ ] **Step 5: Commit with `feat: persist path assessments locally`.**

### Task 5: Progressive Assessment View and Routes

**Files:**
- Create: `src/views/path-assessment-view.js`
- Modify: `src/router.js`
- Modify: `src/app.js`
- Modify: `src/views/path-view.js`
- Modify: `src/ui/study-dialog.js`
- Modify: `styles/components.css`
- Create: `tests/path-assessment-routes.test.js`

**Interfaces:**
- Adds `#/paths/:pathId/assessment` and `#/paths/:pathId/final-exam`.
- Loads manifest and lesson assessment banks, validates all inputs, creates/resumes an immutable session, and reuses existing answer controls through an extracted shared renderer if necessary.

- [ ] **Step 1: Write failing route tests for progressive, final, and invalid extra segments.**

- [ ] **Step 2: Add route parsing and app dispatch.**

- [ ] **Step 3: Add a path-page panel showing current coverage, progressive CTA, latest comparable result, and final-exam locked state. Paths without valid content display a disabled explanation.**

- [ ] **Step 4: Build the progressive preflight and assessment flow with 10 selected SMM questions, auto-saved answers, explicit submission, correction feedback, level, coverage disclosure, and exact lesson/chapter review links.**

- [ ] **Step 5: Build the final route as a locked state while SMM remains `in-progress`; its unlock logic must consume only the manifest status and validated coverage.**

- [ ] **Step 6: Add optional whole-attempt ChatGPT preview by adapting `buildAssessmentReviewPackage`; no response data in URLs or automatic requests.**

- [ ] **Step 7: Add accessible responsive styling and focus management.**

- [ ] **Step 8: Run route and all path-assessment tests; expected: all pass.**

- [ ] **Step 9: Commit with `feat: add progressive path assessment experience`.**

### Task 6: Progress Dashboard, Documentation, and Publication

**Files:**
- Modify: `src/views/progress-view.js`
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `tests/secret-scan.test.js`

**Interfaces:**
- Progress dashboard consumes path attempts grouped by manifest version.
- No new external service interfaces.

- [ ] **Step 1: Add dashboard summaries for current coverage, latest/best comparable progressive level, top gaps, and final-exam state.**

- [ ] **Step 2: Document progressive-versus-final meaning, public answer-key limitation, local persistence, backup, deletion, and manual ChatGPT transfer.**

- [ ] **Step 3: Run full verification.**

```bash
node --test
node scripts/check-secrets.mjs
find src scripts tests -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
```

- [ ] **Step 4: Publish to `main`, verify the GitHub commit and static files, then verify live: SMM path panel → progressive check → selected question count → submission → level → exact review link → Progressi → final exam locked → ChatGPT preview with fixed clean URL.**

- [ ] **Step 5: Confirm no page errors and no response data in network destinations.**

- [ ] **Step 6: Commit final documentation with `docs: explain path-level assessments`.**
