# Local Assessment System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add chapter exercises and module evaluations to Study Hub V3, with deterministic in-browser correction, recurring-error insights, and private local persistence.

**Architecture:** Public assessment JSON files provide reviewed questions and correction rules. Focused pure modules validate assessments, score responses, persist attempts, and derive insights; views consume those modules without network services beyond the existing static GitHub Pages files. SMM-01 is the first content set, while every interface remains lesson-agnostic.

**Tech Stack:** Browser-native ES modules, DOM APIs, `localStorage`, static JSON, Node.js built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-24-local-assessment-system-design.md`

## Global Constraints

- The site remains static and hosted on GitHub Pages.
- Assessment runs entirely in the browser.
- Do not use Apps Script, Google Cloud, Google Sheets, OAuth, remote AI, or billable APIs.
- Do not add runtime dependencies, credentials, tokens, secrets, trials, or payment methods.
- Responses, scores, notes, and history remain in `study-hub-v3:` namespaced local storage.
- Missing assessment content displays “Valutazione non ancora disponibile” and never invents questions.
- Question content must be grounded only in the published lesson content.
- Open-answer scoring is deterministic keyword/concept coverage and must disclose its limits.

---

### Task 1: Assessment Schema and SMM-01 Question Data

**Files:**
- Create: `src/assessment/assessment-schema.js`
- Create: `data/assessments/SMM-01.json`
- Create: `tests/assessment-schema.test.js`
- Modify: `src/config/paths.js`

**Interfaces:**
- Produces: `validateAssessment(value)` returning a normalized assessment or `null`.
- Produces: lesson catalog property `assessmentUrl` for available assessments.
- Assessment shape: `{ id, lessonId, version, competencies, questions }`.

- [ ] **Step 1: Write failing schema tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { validateAssessment } from "../src/assessment/assessment-schema.js";

test("accepts a complete assessment and normalizes weights", () => {
  const value = { id: "SMM-01-v1", lessonId: "SMM-01", version: 1, competencies: [{ id: "kpi", label: "KPI" }], questions: [{ id: "q1", type: "boolean", chapterIds: ["c1"], competencyIds: ["kpi"], prompt: "Un KPI è una metrica scelta.", correct: true, explanation: "Il KPI è legato a un obiettivo." }] };
  assert.equal(validateAssessment(value).questions[0].weight, 1);
});

test("rejects unknown question types and missing explanations", () => {
  assert.equal(validateAssessment({ id: "x", lessonId: "SMM-01", version: 1, competencies: [], questions: [{ id: "q", type: "magic" }] }), null);
});
```

- [ ] **Step 2: Run `node --test tests/assessment-schema.test.js` and verify failure because the module is missing.**

- [ ] **Step 3: Implement strict validation**

```js
const TYPES = new Set(["single-choice", "boolean", "open", "scenario"]);
export function validateAssessment(value) {
  if (!value || typeof value.id !== "string" || typeof value.lessonId !== "string" || !Number.isInteger(value.version) || !Array.isArray(value.questions)) return null;
  if (value.questions.some(q => !q || typeof q.id !== "string" || !TYPES.has(q.type) || !Array.isArray(q.chapterIds) || !q.chapterIds.length || !Array.isArray(q.competencyIds) || typeof q.prompt !== "string" || typeof q.explanation !== "string")) return null;
  return { ...value, questions: value.questions.map(q => ({ ...q, weight: Number.isFinite(q.weight) && q.weight > 0 ? q.weight : 1 })) };
}
```

- [ ] **Step 4: Add `assessmentUrl: "./data/assessments/SMM-01.json"` to SMM-01 only and author reviewed questions covering every current SMM-01 chapter.**

Question requirements: stable IDs, at least one question per chapter, explanations grounded in the lesson, plausible distractors, competency mappings, and `open` questions with `requiredConcepts`, controlled synonyms, `modelAnswer`, and partial threshold.

- [ ] **Step 5: Run schema tests and a JSON parse check.**

Run: `node --test tests/assessment-schema.test.js && node -e "JSON.parse(require('fs').readFileSync('data/assessments/SMM-01.json','utf8'))"`  
Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/assessment/assessment-schema.js data/assessments/SMM-01.json tests/assessment-schema.test.js src/config/paths.js
git commit -m "feat: add assessment schema and SMM-01 questions"
```

### Task 2: Deterministic Scoring Engine

**Files:**
- Create: `src/assessment/open-answer.js`
- Create: `src/assessment/assessment-engine.js`
- Create: `tests/open-answer.test.js`
- Create: `tests/assessment-engine.test.js`

**Interfaces:**
- Produces: `normalizeAnswer(text): string`.
- Produces: `scoreOpenAnswer(question, answer): { score, status, matchedConcepts, missingConcepts }`.
- Produces: `scoreQuestion(question, answer)` and `scoreAttempt(assessment, answers)`.

- [ ] **Step 1: Write failing normalization and synonym tests**

```js
test("matches concepts ignoring accents case and punctuation", () => {
  const result = scoreOpenAnswer({ requiredConcepts: [{ id: "objective", terms: ["obiettivo", "goal"] }], partialThreshold: 0.5 }, "È legato all’OBIETTIVO!");
  assert.equal(result.status, "correct");
});
```

- [ ] **Step 2: Run `node --test tests/open-answer.test.js` and verify the missing-module failure.**

- [ ] **Step 3: Implement normalization and concept coverage**

```js
export const normalizeAnswer = text => String(text ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
```

Each concept matches when any controlled term is present as a normalized word sequence. Return `correct` at full coverage, `partial` at or above `partialThreshold`, otherwise `review`.

- [ ] **Step 4: Write failing engine tests for choice, boolean, open, weighted totals, chapters, and competencies.**

```js
test("calculates weighted module chapter and competency scores", () => {
  const result = scoreAttempt(assessment, { q1: "a", q2: "spiegazione" });
  assert.equal(result.total.max, 3);
  assert.ok(result.byChapter.c1.percent >= 0);
  assert.ok(result.byCompetency.kpi.percent >= 0);
});
```

- [ ] **Step 5: Implement pure scoring functions with results normalized to 0–1 and percentages rounded only for display values.**

- [ ] **Step 6: Run `node --test tests/open-answer.test.js tests/assessment-engine.test.js`; expected: all pass.**

- [ ] **Step 7: Commit**

```bash
git add src/assessment/open-answer.js src/assessment/assessment-engine.js tests/open-answer.test.js tests/assessment-engine.test.js
git commit -m "feat: add deterministic assessment scoring"
```

### Task 3: Private Draft and Attempt Storage

**Files:**
- Create: `src/assessment/assessment-store.js`
- Create: `tests/assessment-store.test.js`
- Modify: `tests/backup.test.js`

**Interfaces:**
- Produces: `createAssessmentStore(storage = localStorage, now = () => new Date().toISOString())`.
- Store methods: `getDraft(lessonId, version)`, `saveDraft(...)`, `clearDraft(...)`, `recordAttempt(attempt)`, `getAttempts(lessonId)`, `clearAssessments(lessonId?)`.
- Uses keys `study-hub-v3:assessment:drafts` and `study-hub-v3:assessment:attempts`.

- [ ] **Step 1: Write failing tests for draft isolation, attempt persistence, malformed recovery, and the retention cap.**

```js
test("keeps the newest 100 attempts per lesson", () => {
  const store = createAssessmentStore(memoryStorage(), () => "2026-08-24T00:00:00.000Z");
  for (let index = 0; index < 105; index += 1) store.recordAttempt({ id: String(index), lessonId: "SMM-01", version: 1, responses: {} });
  assert.equal(store.getAttempts("SMM-01").length, 100);
  assert.equal(store.getAttempts("SMM-01")[99].id, "104");
});
```

- [ ] **Step 2: Run `node --test tests/assessment-store.test.js` and verify failure.**

- [ ] **Step 3: Implement guarded JSON reads, immutable returns, per-version draft keys, and a 100-attempt cap per lesson.**

- [ ] **Step 4: Extend the backup test to assert both assessment keys are exported and imported because the existing namespace-based implementation should include them without production changes.**

- [ ] **Step 5: Run `node --test tests/assessment-store.test.js tests/backup.test.js`; expected: all pass.**

- [ ] **Step 6: Commit**

```bash
git add src/assessment/assessment-store.js tests/assessment-store.test.js tests/backup.test.js
git commit -m "feat: store private assessment attempts locally"
```

### Task 4: Recurring Errors and Competency Insights

**Files:**
- Create: `src/assessment/insights.js`
- Create: `tests/assessment-insights.test.js`

**Interfaces:**
- Produces: `deriveAssessmentInsights(assessment, attempts): { recurringErrors, competencies, reviewChapters }`.
- A recurring error requires insufficient results for the same question in at least two distinct submitted attempts.

- [ ] **Step 1: Write failing insight tests**

```js
test("flags the same missed question after two attempts", () => {
  const insights = deriveAssessmentInsights(assessment, [missedAttempt("a1", "q1"), missedAttempt("a2", "q1")]);
  assert.equal(insights.recurringErrors[0].questionId, "q1");
});

test("a later correct answer lowers but does not erase review priority", () => {
  const before = deriveAssessmentInsights(assessment, [missedAttempt("a1", "q1"), missedAttempt("a2", "q1")]);
  const after = deriveAssessmentInsights(assessment, [missedAttempt("a1", "q1"), missedAttempt("a2", "q1"), correctAttempt("a3", "q1")]);
  assert.ok(after.reviewChapters[0].priority < before.reviewChapters[0].priority);
});
```

- [ ] **Step 2: Run `node --test tests/assessment-insights.test.js` and verify failure.**

- [ ] **Step 3: Implement deterministic aggregation using attempt order, question weights, competency mappings, and chapter mappings.**

Competency statuses: `solid` at 80%+, `improving` at 60–79%, `review` below 60%. Sort review chapters by descending priority, then chapter order.

- [ ] **Step 4: Run the insight test; expected: all pass.**

- [ ] **Step 5: Commit**

```bash
git add src/assessment/insights.js tests/assessment-insights.test.js
git commit -m "feat: derive recurring assessment errors"
```

### Task 5: Routes and Assessment View

**Files:**
- Create: `src/views/assessment-view.js`
- Create: `tests/assessment-routes.test.js`
- Modify: `src/router.js`
- Modify: `src/app.js`
- Modify: `styles/main.css`

**Interfaces:**
- Adds routes `#/lessons/:lessonId/assessment` and `#/lessons/:lessonId/assessment/:chapterId`.
- Consumes schema, scoring engine, assessment store, lesson catalog, and static assessment JSON.

- [ ] **Step 1: Write failing route tests for full-module and chapter assessment URLs plus unknown extra segments.**

- [ ] **Step 2: Run `node --test tests/assessment-routes.test.js`; expected: failure.**

- [ ] **Step 3: Add `assessment` and `chapter-assessment` route names before the generic three-part lesson route, then dispatch both from `src/app.js`.**

- [ ] **Step 4: Build `renderAssessmentView({ lesson, chapterId })`.**

The view must load and validate `lesson.assessmentUrl`, filter questions for chapter mode, restore a compatible draft, save responses on change, show progress without color-only meaning, and submit only after explicit button activation. Missing or invalid data renders a non-blocking unavailable state.

- [ ] **Step 5: Render correction feedback safely.**

After submission show total, status, per-question explanation, matched/missing concepts, model answers for open questions, and `#/lessons/:lessonId/:chapterId` review links. Move focus to a `tabindex="-1"` result heading and clear the submitted draft.

- [ ] **Step 6: Add responsive dark-theme styles for question cards, option controls, progress, result states, and screen-reader announcements; respect reduced motion and existing reading preferences.**

- [ ] **Step 7: Run route tests and all pure assessment tests; expected: all pass.**

- [ ] **Step 8: Commit**

```bash
git add src/views/assessment-view.js src/router.js src/app.js styles/main.css tests/assessment-routes.test.js
git commit -m "feat: add local assessment experience"
```

### Task 6: Lesson and Progress Integration

**Files:**
- Modify: `src/views/lesson-view.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `src/views/progress-view.js`
- Modify: `styles/main.css`
- Create: `tests/assessment-links.test.js`
- Create: `tests/assessment-progress.test.js`

**Interfaces:**
- Lesson view produces assessment links only when `lesson.assessmentUrl` exists.
- Progress view consumes `createAssessmentStore()` and `deriveAssessmentInsights()`.

- [ ] **Step 1: Write failing tests asserting a module assessment link, one chapter exercise link per chapter, and no fabricated link for unavailable modules.**

- [ ] **Step 2: Run `node --test tests/assessment-links.test.js`; expected: failure.**

- [ ] **Step 3: Add “Esercitazione completa” to the lesson hero/index and “Esercitati sul capitolo” to each rendered chapter through explicit renderer options.**

- [ ] **Step 4: Write failing progress-summary tests for latest score, best score, attempt count, recurring errors, and review links.**

- [ ] **Step 5: Add assessment panels to Progressi.**

For every assessed lesson show last and best scores, number of attempts, competencies by status, recurring-error count, and highest-priority chapter links. If no attempt exists show “Nessuna valutazione completata”. Add a separately confirmed “Cancella valutazioni” control that does not affect notes, reading history, or lesson completion.

- [ ] **Step 6: Run link and progress tests; expected: all pass.**

- [ ] **Step 7: Commit**

```bash
git add src/views/lesson-view.js src/lessons/render-lesson.js src/views/progress-view.js styles/main.css tests/assessment-links.test.js tests/assessment-progress.test.js
git commit -m "feat: integrate assessments with lessons and progress"
```

### Task 7: Privacy Regression and Complete Verification

**Files:**
- Create: `src/assessment/review-package.js`
- Create: `tests/assessment-review-package.test.js`
- Modify: `tests/study-assistant.test.js`
- Modify: `tests/secret-scan.test.js`
- Modify: `src/views/assessment-view.js`
- Modify: `styles/main.css`
- Modify: `README.md`
- Modify: `SECURITY.md`

**Interfaces:**
- No new runtime interfaces.
- Verifies responses never enter ChatGPT prompts, URLs, logs, or remote requests.
- Produces: `buildAssessmentReviewPackage({ assessment, attempt, questionIds })` returning review text from only the explicitly selected submitted answers.

- [ ] **Step 1: Write failing tests for selective ChatGPT review packages.**

```js
test("includes only selected answers and excludes private study data", () => {
  const text = buildAssessmentReviewPackage({ assessment, attempt, questionIds: ["q1"] });
  assert.match(text, /Domanda:/);
  assert.match(text, /Risposta dello studente:/);
  assert.doesNotMatch(text, /nota privata|cronologia|q2 answer/);
});

test("does not put assessment data in the ChatGPT URL", () => {
  assert.equal(assessmentReviewDestination(), "https://chatgpt.com/");
});
```

- [ ] **Step 2: Run `node --test tests/assessment-review-package.test.js` and verify the missing-module failure.**

- [ ] **Step 3: Implement the pure review-package builder and fixed destination URL.**

The generated Italian instruction asks ChatGPT to assess conceptual correctness, identify valid reasoning and missing concepts, explain discrepancies with the deterministic result, avoid inventing lesson facts, and return an educational correction. Reject unknown question IDs and never read from `localStorage` inside this module.

- [ ] **Step 4: Add “Verifica questa risposta con ChatGPT” to open-answer feedback and “Verifica il test con ChatGPT” to the result summary.**

Both actions open the existing safe dialog pattern with a read-only complete preview, a copy button, and a plain `https://chatgpt.com/` link using `noopener` and `noreferrer`. No click copies and opens in one hidden action; the user controls both steps.

- [ ] **Step 5: Add a regression test that passes an object containing assessment responses alongside public chapter context and asserts the normal Approfondisci prompt still contains only public lesson/chapter content.**

- [ ] **Step 6: Add security scanner fixtures proving assessment JSON and documentation are allowed while credential-shaped values remain rejected.**

- [ ] **Step 7: Document local assessment behavior, public answer-key limitation, backup transfer, data deletion, the absence of automatic semantic AI correction, and the optional manual ChatGPT review transfer.**

- [ ] **Step 8: Run the complete verification suite.**

```bash
node --test
node scripts/check-secrets.mjs
find src scripts tests -type f \( -name '*.js' -o -name '*.mjs' \) -print0 | xargs -0 -n1 node --check
```

Expected: zero failed tests, “Nessun possibile segreto rilevato”, and exit code 0.

- [ ] **Step 9: Serve locally and manually verify home → SMM-01 → chapter exercise → submit → correction → selective ChatGPT preview → Progressi → backup, including keyboard navigation and a narrow viewport. Confirm the ChatGPT URL contains no response data.**

- [ ] **Step 10: Commit**

```bash
git add src/assessment/review-package.js src/views/assessment-view.js styles/main.css tests/assessment-review-package.test.js tests/study-assistant.test.js tests/secret-scan.test.js README.md SECURITY.md
git commit -m "feat: add private manual assessment review"
```

### Task 8: Publish and Verify GitHub Pages

**Files:**
- No source changes expected; change only if verification identifies a reproducible deployment defect, with a failing regression test first.

**Interfaces:**
- GitHub Pages serves the committed static app and assessment JSON.

- [ ] **Step 1: Push the feature branch and confirm the GitHub Actions test/deployment checks succeed.**

- [ ] **Step 2: Merge through the repository’s existing workflow after review.**

- [ ] **Step 3: Open the published Study Hub URL and verify SMM-01 exposes both chapter exercises and the complete evaluation.**

- [ ] **Step 4: Submit a non-sensitive test attempt and verify correction, Progressi insights, local persistence after refresh, and backup inclusion.**

- [ ] **Step 5: Inspect page console errors and network destinations; expected: no application errors and no response data sent to remote services.**

- [ ] **Step 6: Open the ChatGPT review preview without copying or sending it; verify single-answer and whole-test packages exclude notes, history, unrelated attempts, and URL parameters.**

- [ ] **Step 7: Record the deployed commit hash and public verification result in the handoff.**
