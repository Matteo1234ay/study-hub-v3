# SMM-01 Deep Learning Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare SMM-01 in una lezione profonda a quattro macro-capitoli con compatibilità dei dati esistenti, note laterali esportabili e visualizzazioni animate funzionali.

**Architecture:** Il documento della lezione acquisisce una gerarchia esplicita `macro-capitolo → sezione → blocco`, mentre un modulo di compatibilità traduce i 19 vecchi identificatori senza modificare i dati locali originali. Rendering, note, progressi e animazioni restano moduli separati: un errore nel pannello o in una visualizzazione non può impedire il caricamento della lezione.

**Tech Stack:** JavaScript ES modules senza framework, HTML semantico, CSS responsive, LocalStorage, Node test runner, GitHub Pages. Nessun backend, API a consumo o dipendenza runtime remota.

**Spec:** `docs/superpowers/specs/2026-08-27-smm01-deep-learning-lesson-design.md`

## Global Constraints

- SMM-01 pubblicata contiene esattamente quattro macro-capitoli; introduzione, prova conclusiva e fonti non sono capitoli.
- Le verifiche interne sono non bloccanti e forniscono feedback esplicativo.
- Note, progressi e preferiti esistenti non vengono cancellati o sovrascritti durante la migrazione.
- Ogni animazione deve spiegare, orientare o dare feedback e possedere un equivalente statico.
- `prefers-reduced-motion` e “Riduci movimento” disattivano movimento non essenziale.
- Lo stato editoriale resta `review` durante la riscrittura e torna `published` solo dopo la revisione di Matteo.
- Tutto resta locale e gratuito: niente account, backend, OAuth, IA nel sito o servizi a pagamento.
- Le definizioni delle metriche usano fonti ufficiali; le affermazioni didattiche usano revisioni, meta-analisi o studi sperimentali pertinenti.
- Escape chiude prima note/fonti/dialoghi e soltanto dopo esce dalla modalità Focus.

---

### Task 1: Schema gerarchico e compatibilità con i 19 capitoli

**Files:**
- Create: `src/lessons/lesson-compatibility.js`
- Modify: `src/lessons/lesson-model.js`
- Modify: `data/lessons/SMM-01.json`
- Test: `tests/lesson-model.test.js`
- Test: `tests/lesson-compatibility.test.js`

**Interfaces:**
- Produces: `normalizeLessonExperience(model)`, `resolveLegacyChapterId(id)`, `aggregateLegacyCompletion(model, completedIds)`, `legacyIdsForMacroChapter(id)`.
- The normalized macro-chapter shape is `{ id, title, objective, estimated, legacyChapterIds, sections, exercise }`; a section is `{ id, title, blocks }`.

- [ ] **Step 1: Write failing schema tests**

```js
test("SMM-01 exposes exactly four macro chapters with unique sections", async () => {
  const model = JSON.parse(await readFile("data/lessons/SMM-01.json", "utf8"));
  const normalized = normalizeLessonExperience(model);
  assert.equal(normalized.chapters.length, 4);
  assert.deepEqual(normalized.chapters.map(chapter => chapter.id), [
    "misurare-cio-che-conta", "leggere-dati-piattaforme",
    "interpretare-senza-ingannarsi", "trasformare-dati-decisioni"
  ]);
  for (const chapter of normalized.chapters) {
    assert.ok(chapter.objective);
    assert.ok(chapter.sections.length >= 4);
    assert.equal(new Set(chapter.sections.map(section => section.id)).size, chapter.sections.length);
  }
});
```

- [ ] **Step 2: Run the schema test and confirm it fails because the current JSON has 19 chapters**

Run: `node --test tests/lesson-model.test.js`

- [ ] **Step 3: Write failing legacy-resolution and non-destructive aggregation tests**

```js
test("old links resolve to their new macro chapter", () => {
  assert.equal(resolveLegacyChapterId("2-reach-impression-e-views-non-sono-sinonimi"), "leggere-dati-piattaforme");
  assert.equal(resolveLegacyChapterId("10-correlazione-attribuzione-e-causa"), "interpretare-senza-ingannarsi");
});

test("legacy completion is aggregated without mutating original ids", () => {
  const original = ["1-metrica-kpi-e-obiettivo-tre-cose-diverse", "9-vanity-metric-il-problema-non-e-la-metrica-ma-l-uso-che-ne-fai"];
  const result = aggregateLegacyCompletion(model, original);
  assert.deepEqual(original, ["1-metrica-kpi-e-obiettivo-tre-cose-diverse", "9-vanity-metric-il-problema-non-e-la-metrica-ma-l-uso-che-ne-fai"]);
  assert.ok(result.completedMacroChapterIds.includes("misurare-cio-che-conta"));
});
```

- [ ] **Step 4: Implement the explicit compatibility map and safe normalizer**

```js
export const LEGACY_CHAPTER_MAP = Object.freeze({
  "1-metrica-kpi-e-obiettivo-tre-cose-diverse": "misurare-cio-che-conta",
  "2-reach-impression-e-views-non-sono-sinonimi": "leggere-dati-piattaforme",
  "10-correlazione-attribuzione-e-causa": "interpretare-senza-ingannarsi",
  "14-dalla-metrica-alla-decisione-il-metodo-completo": "trasformare-dati-decisioni"
  // The implementation must enumerate every previous SMM-01 chapter id from the committed JSON.
});

export function resolveLegacyChapterId(id) {
  return LEGACY_CHAPTER_MAP[id] ?? id;
}
```

The final map must include all 19 existing IDs, including introduction, completion criterion and source note, routed to the first, fourth or source apparatus as specified by the design.

- [ ] **Step 5: Reshape SMM-01 to the new top-level model while keeping the existing copy available in git history**

Set `editorial.status` to `review`; add top-level `introduction`, `finalAssessment`, `legacyChapterMap`, and four chapters with stable section IDs. At this step blocks can contain the migrated current text; editorial expansion happens in Task 4.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/lesson-model.test.js tests/lesson-compatibility.test.js`

- [ ] **Step 7: Commit**

```bash
git add src/lessons/lesson-model.js src/lessons/lesson-compatibility.js data/lessons/SMM-01.json tests/lesson-model.test.js tests/lesson-compatibility.test.js
git commit -m "feat: model SMM-01 as four macro chapters"
```

### Task 2: Routing, progress and search migration

**Files:**
- Modify: `src/views/lesson-view.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `src/progress/local-progress.js`
- Modify: `src/study/search-index.js`
- Modify: `src/router.js`
- Modify: `data/assessments/SMM-01.json`
- Test: `tests/router.test.js`
- Test: `tests/progress.test.js`
- Test: `tests/search-index.test.js`
- Test: `tests/assessment-links.test.js`

**Interfaces:**
- Consumes: `resolveLegacyChapterId`, `aggregateLegacyCompletion` from Task 1.
- Produces: `calculateMacroProgress(chapters, progressState)`, section-aware search entries, canonical macro-chapter URLs.

- [ ] **Step 1: Write failing route tests for old and current identifiers**

```js
test("a legacy SMM-01 chapter route remains parseable", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01/2-reach-impression-e-views-non-sono-sinonimi"), {
    name: "chapter", params: { lessonId: "SMM-01", chapterId: "2-reach-impression-e-views-non-sono-sinonimi" }
  });
});
```

The view resolves this parsed ID through `resolveLegacyChapterId` and replaces the hash with the canonical URL without adding a history entry.

- [ ] **Step 2: Write failing progress tests distinguishing visited and completed**

```js
test("macro progress distinguishes visited from completed", () => {
  const state = { visited: ["leggere-dati-piattaforme"], completed: ["misurare-cio-che-conta"] };
  assert.equal(calculateMacroProgress(chapters, state), 25);
});
```

- [ ] **Step 3: Extend progress storage without discarding old `completed` arrays**

```js
function emptyProgress() {
  return { completed: [], visited: [], activities: {}, legacyCompleted: [], updatedAt: null };
}
```

On read, retain unknown old IDs in `legacyCompleted`; derive macro completion in memory. Do not rewrite LocalStorage merely by opening the lesson.

- [ ] **Step 4: Render macro progress and canonicalize legacy URLs**

Resolve the requested ID before selecting the visible chapter, show “Capitolo X di 4”, record `visited`, and preserve full-view query parameters.

- [ ] **Step 5: Index section title and section text while returning a macro-chapter URL**

```js
{
  type: "section",
  lessonId,
  chapterId: chapter.id,
  sectionId: section.id,
  title: section.title,
  href: `#/lessons/${lessonId}/${chapter.id}?section=${section.id}`
}
```

- [ ] **Step 6: Replace orphaned assessment chapter IDs with macro-chapter IDs and verify all targets exist**

Run: `node --test tests/router.test.js tests/progress.test.js tests/search-index.test.js tests/assessment-links.test.js`

- [ ] **Step 7: Commit**

```bash
git add src/views/lesson-view.js src/lessons/render-lesson.js src/progress/local-progress.js src/study/search-index.js src/router.js data/assessments/SMM-01.json tests/router.test.js tests/progress.test.js tests/search-index.test.js tests/assessment-links.test.js
git commit -m "feat: migrate SMM-01 navigation and progress safely"
```

### Task 3: Section-aware lesson shell and evidence-based activity cycle

**Files:**
- Create: `src/lessons/render-section.js`
- Create: `src/lessons/chapter-activity.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `styles/lesson.css`
- Test: `tests/render-section.test.js`
- Test: `tests/chapter-activity.test.js`

**Interfaces:**
- Consumes: normalized section blocks from Task 1.
- Produces: `renderSection(section, options)`, `chapterCompletionEligibility(chapter, activityState)`.

- [ ] **Step 1: Write failing tests for section landmarks and active-section links**

```js
test("sections expose stable headings and anchors", () => {
  const node = renderSection({ id: "ctr-denominatori", title: "CTR e denominatori", blocks: [] });
  assert.equal(node.id, "ctr-denominatori");
  assert.equal(node.querySelector("h3").textContent, "CTR e denominatori");
});
```

- [ ] **Step 2: Write failing completion eligibility tests**

```js
test("viewing alone does not complete a macro chapter", () => {
  assert.equal(chapterCompletionEligibility(chapter, { visitedSections: chapter.essentialSectionIds, exerciseAttempted: false }), false);
});

test("essential sections plus attempted application permit completion", () => {
  assert.equal(chapterCompletionEligibility(chapter, { visitedSections: chapter.essentialSectionIds, exerciseAttempted: true }), true);
});
```

- [ ] **Step 3: Implement section rendering in a focused module**

The renderer must support paragraph, list, subheading, example, counterexample, key concept, formula, source reference, micro-question, guided example, application, retrieval synthesis and visualization placeholder. Invalid optional blocks return `null`; invalid core text renders a “Contenuto da verificare” notice.

- [ ] **Step 4: Add the secondary section index and active-section observer**

Use `IntersectionObserver` only for orientation; absence of the API leaves the first section selected and does not affect reading. Links use `?section=<id>` and focus the section heading after navigation.

- [ ] **Step 5: Replace the manual completion toggle with the soft eligibility state**

The student can continue regardless of status. When eligibility is reached, offer “Concludi capitolo”; show the local concepts marked for review before persisting completion.

- [ ] **Step 6: Add responsive three-zone layout hooks without implementing notes yet**

CSS grid areas: `index content notes`; desktop content stays at least `58ch`, intermediate screens collapse notes to overlay, and screens below `820px` stack the index and reserve a bottom-sheet trigger.

- [ ] **Step 7: Run focused and regression tests**

Run: `node --test tests/render-section.test.js tests/chapter-activity.test.js tests/micro-question.test.js tests/reading-controls.test.js`

- [ ] **Step 8: Commit**

```bash
git add src/lessons/render-section.js src/lessons/chapter-activity.js src/lessons/render-lesson.js styles/lesson.css tests/render-section.test.js tests/chapter-activity.test.js
git commit -m "feat: render section-based evidence learning cycle"
```

### Task 4: Full editorial rewrite, sources and assessments

**Files:**
- Modify: `data/lessons/SMM-01.json`
- Modify: `data/assessments/SMM-01.json`
- Modify: `data/path-assessments/smm.json`
- Modify: `src/lessons/sources.js`
- Test: `tests/lesson-content.test.js`
- Test: `tests/lesson-sources.test.js`
- Test: `tests/micro-question.test.js`
- Test: `tests/assessment-schema.test.js`

**Interfaces:**
- Consumes: block and section schema from Tasks 1 and 3.
- Produces: the complete reviewed lesson content, source registry and aligned questions.

- [ ] **Step 1: Write objective structural tests for editorial depth**

```js
test("each macro chapter includes guided practice, retrieval and transfer", () => {
  for (const chapter of model.chapters) {
    const types = chapter.sections.flatMap(section => section.blocks.map(block => block.type));
    assert.ok(types.includes("guided-example"));
    assert.ok(types.includes("micro-question"));
    assert.ok(types.includes("application"));
    assert.ok(types.includes("retrieval-synthesis"));
    assert.ok(chapter.exercise);
  }
});
```

- [ ] **Step 2: Add source integrity tests**

Every important sourced block references an existing source ID. Every source contains `title`, `authorsOrInstitution`, `year`, `url`, `type`, `accessedAt`, `evidenceRole`, and `limitations`. Platform metric definitions must reference official platform documentation.

- [ ] **Step 3: Rewrite macro-chapter 1**

Cover objective/metric/KPI, primary versus diagnostic metrics, contextual vanity metrics, a worked Brainframe decision, a plausible misuse, one retrieval question and one varied application. Explicitly state what a KPI cannot prove.

- [ ] **Step 4: Rewrite macro-chapter 2**

Cover reach/impressions/views, watch time/average duration/retention, interactions, follower attribution and CTR denominators. Use one reconstructed analytics screen and a comparison where a higher raw number does not imply better performance.

- [ ] **Step 5: Rewrite macro-chapter 3**

Cover conversion/engagement/loyalty, correlation/attribution/causality, confounders, fair comparisons and recurring inference errors. Include a commented counterexample and a deliberately flawed report for diagnosis.

- [ ] **Step 6: Rewrite macro-chapter 4 and final assessment**

Cover question, hypothesis, useful test, signal/context/noise, decision and mini-report. The final case requires separate fields for observation, interpretation, limits, decision and next verification.

- [ ] **Step 7: Align micro-questions and assessment items with observable outcomes**

Questions must include explanatory feedback for every option and a second reformulated attempt. At least one item per chapter tests transfer to a new context; no item should be answerable only by matching wording.

- [ ] **Step 8: Keep the lesson in `review`, run content tests and generate an editorial review checklist**

Run: `node --test tests/lesson-content.test.js tests/lesson-sources.test.js tests/micro-question.test.js tests/assessment-schema.test.js`

- [ ] **Step 9: Commit**

```bash
git add data/lessons/SMM-01.json data/assessments/SMM-01.json data/path-assessments/smm.json src/lessons/sources.js tests/lesson-content.test.js tests/lesson-sources.test.js tests/micro-question.test.js tests/assessment-schema.test.js
git commit -m "content: deepen the complete SMM-01 lesson"
```

### Task 5: Structured notes store and legacy note compatibility

**Files:**
- Create: `src/study/note-model.js`
- Modify: `src/study/notes-store.js`
- Test: `tests/notes-store.test.js`
- Test: `tests/note-model.test.js`

**Interfaces:**
- Consumes: `resolveLegacyChapterId` from Task 1.
- Produces: `createNote(input, now)`, `createNotesStore(storage)`, methods `list`, `upsert`, `remove`, `search`, `getLegacyText`.

- [ ] **Step 1: Write failing structured-note tests**

```js
test("a structured note keeps lesson, chapter and section context", () => {
  const note = createNote({ lessonId: "SMM-01", chapterId: "leggere-dati-piattaforme", sectionId: "ctr-denominatori", text: "Controllare sempre il denominatore" }, () => 1000);
  assert.equal(note.createdAt, 1000);
  assert.equal(note.updatedAt, 1000);
  assert.ok(note.id);
});
```

- [ ] **Step 2: Write failing malformed-data and legacy-key tests**

Malformed entries are ignored individually. Existing keys `study-hub-v3:note:SMM-01:<old-id>` remain untouched and are returned as read-only migrated entries assigned to the mapped macro-chapter.

- [ ] **Step 3: Implement a versioned lesson note collection**

```js
{
  version: 2,
  notes: [{ id, lessonId, chapterId, sectionId, text, conceptId, sourceId, blockId, createdAt, updatedAt }]
}
```

Write only to `study-hub-v3:notes:v2:SMM-01`. Do not delete version-1 chapter note keys.

- [ ] **Step 4: Implement filtering and case-insensitive search**

`list({ lessonId, chapterId, sectionId })` scopes notes; `search(query, scope)` searches text, concept label and section title supplied by the caller.

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/notes-store.test.js tests/note-model.test.js tests/notes-preferences.test.js`

```bash
git add src/study/note-model.js src/study/notes-store.js tests/notes-store.test.js tests/note-model.test.js
git commit -m "feat: preserve and structure lesson notes"
```

### Task 6: Responsive right notes panel

**Files:**
- Create: `src/ui/lesson-notes-panel.js`
- Modify: `src/views/lesson-view.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `styles/lesson.css`
- Test: `tests/lesson-notes-panel.test.js`
- Test: `tests/reading-controls.test.js`

**Interfaces:**
- Consumes: structured notes store from Task 5 and current chapter/section context from Task 3.
- Produces: `createLessonNotesPanel({ lessonId, store, getContext, onExport })` with `{ node, open, close, setContext, destroy }`.

- [ ] **Step 1: Write failing behavior tests**

Tests cover opening/closing, contextual prefill, autosave status, section/chapter/all scopes, search, edit, delete confirmation, and restoration of focus to the trigger.

- [ ] **Step 2: Build the accessible panel shell**

Use an `aside` on desktop, dialog-like drawer semantics on intermediate widths and bottom sheet on mobile. Include a persistent “Note” trigger and a visible close button; do not rely on swiping.

- [ ] **Step 3: Add debounced local autosave with explicit state**

Show “Salvataggio…” during the 300 ms debounce and “Salvata sul dispositivo” after persistence. A storage exception shows “Non salvata: copia il testo” while leaving textarea content intact.

- [ ] **Step 4: Link note creation to current section, concept, source or block**

“Aggiungi alle note” on a content block supplies stable IDs and a short context label; it never copies full copyrighted source text.

- [ ] **Step 5: Implement layered Escape and Focus behavior**

Escape closes the note panel first. In Focus, a closed panel remains reopenable from the persistent trigger. Only an Escape with no open overlay exits Focus.

- [ ] **Step 6: Add responsive CSS and run tests**

Run: `node --test tests/lesson-notes-panel.test.js tests/reading-controls.test.js tests/notes-store.test.js`

- [ ] **Step 7: Commit**

```bash
git add src/ui/lesson-notes-panel.js src/views/lesson-view.js src/lessons/render-lesson.js styles/lesson.css tests/lesson-notes-panel.test.js tests/reading-controls.test.js
git commit -m "feat: add contextual lesson notes panel"
```

### Task 7: Free DOCX-compatible note export and text fallback

**Files:**
- Create: `src/study/notes-export.js`
- Create: `src/study/docx-writer.js`
- Modify: `src/ui/lesson-notes-panel.js`
- Test: `tests/notes-export.test.js`
- Test: `tests/docx-writer.test.js`

**Interfaces:**
- Consumes: structured notes and lesson outline.
- Produces: `buildNotesExportModel(lesson, notes)`, `createNotesDocx(exportModel) -> Blob`, `createNotesPlainText(exportModel) -> string`.

- [ ] **Step 1: Write failing export-model tests**

```js
test("export groups notes by the four chapters and sections", () => {
  const output = buildNotesExportModel(lesson, notes);
  assert.equal(output.chapters.length, 4);
  assert.equal(output.chapters[1].sections[0].notes[0].text, "Controllare il denominatore");
});
```

- [ ] **Step 2: Write failing DOCX package tests**

Assert the generated ZIP contains `[Content_Types].xml`, `_rels/.rels`, `word/document.xml` and `word/styles.xml`; extract `document.xml` and verify XML-escaped note text and chapter headings.

- [ ] **Step 3: Implement a minimal local DOCX writer**

Use only a vendored, audited ZIP implementation if the repository lacks one; do not load code from a CDN. Keep the writer limited to headings, paragraphs, hyperlinks and page breaks. If adding a package, pin the exact version and commit its lockfile.

- [ ] **Step 4: Implement plain-text fallback and browser download**

If DOCX generation or download throws, retain notes and expose “Copia tutte le note”; Clipboard API failure falls back to a selectable textarea.

- [ ] **Step 5: Wire “Esporta per Google Docs” into the notes panel with honest wording**

The dialog states that a `.docx` is created locally and can be opened/imported in Google Docs; it must not imply direct Drive upload.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/notes-export.test.js tests/docx-writer.test.js tests/lesson-notes-panel.test.js`

```bash
git add src/study/notes-export.js src/study/docx-writer.js src/ui/lesson-notes-panel.js tests/notes-export.test.js tests/docx-writer.test.js package.json package-lock.json
git commit -m "feat: export lesson notes for Google Docs"
```

Only stage `package-lock.json` if Task 7 actually introduces a pinned package.

### Task 8: Functional visualizations and motion controller

**Files:**
- Create: `src/visualizations/visualization-registry.js`
- Create: `src/visualizations/reach-impressions.js`
- Create: `src/visualizations/watch-retention.js`
- Create: `src/visualizations/causality.js`
- Create: `src/visualizations/test-builder.js`
- Create: `src/visualizations/report-builder.js`
- Modify: `src/lessons/render-section.js`
- Modify: `styles/lesson.css`
- Test: `tests/visualization-registry.test.js`
- Test: `tests/motion-fallback.test.js`

**Interfaces:**
- Produces: `renderVisualization(block, { reducedMotion })`; every visualization controller exposes `{ node, play, pause, reset, destroy }`.
- Unknown or invalid visualization IDs return a static explanatory card, never throw into the lesson renderer.

- [ ] **Step 1: Write failing registry and fallback tests**

```js
test("unknown visualization returns accessible static fallback", () => {
  const node = renderVisualization({ visualizationId: "missing", staticSummary: "Spiegazione disponibile" }, { reducedMotion: false });
  assert.match(node.textContent, /Spiegazione disponibile/);
});
```

- [ ] **Step 2: Implement the shared controller and reduced-motion branch**

Animations start only after user action or when the visualization becomes relevant; they pause when hidden. Reduced mode renders the final state plus step-by-step text and removes autoplay/transitions.

- [ ] **Step 3: Implement reach/impressions and watch-time/retention visualizations**

Use semantic HTML/SVG with labelled controls. Reach/impressions shows unique accounts versus repeated exposures. Watch/retention shows total watch time, average duration and a curve with multiple plausible explanations for drops.

- [ ] **Step 4: Implement causality, test-builder and mini-report visualizations**

Causality reveals confounders and missing tests; test-builder composes question, hypothesis, changed variable, comparison and criterion; report-builder places observation, interpretation, limit, decision and verification in order.

- [ ] **Step 5: Add orientation and feedback motion**

Use short CSS transitions for active section, chapter progress, source expansion, note link and micro-question feedback. Exclude continuous backgrounds, autoscroll, random rewards and confetti.

- [ ] **Step 6: Run motion and accessibility tests**

Run: `node --test tests/visualization-registry.test.js tests/motion-fallback.test.js tests/reading-controls.test.js tests/micro-question.test.js`

- [ ] **Step 7: Commit**

```bash
git add src/visualizations src/lessons/render-section.js styles/lesson.css tests/visualization-registry.test.js tests/motion-fallback.test.js
git commit -m "feat: add learning-focused SMM visualizations"
```

### Task 9: Editorial approval, regression verification and publication

**Files:**
- Modify: `data/lessons/SMM-01.json`
- Modify: `src/**/*.js` import version query strings
- Modify: `index.html`
- Test: all `tests/*.test.js`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: one reviewed, version-coherent GitHub Pages release.

- [ ] **Step 1: Run the full automated suite from a clean process**

Run: `npm test`

Expected: every test passes; record the exact count in the release handoff.

- [ ] **Step 2: Run static safety checks**

Run: `node scripts/check-secrets.mjs`

Run: `rg 'TODO|TBD|Fonte da verificare' data/lessons/SMM-01.json src tests`

Expected: no unresolved production placeholders; test fixtures may contain deliberate missing-source text only when asserted.

- [ ] **Step 3: Perform Matteo's editorial gate before changing `review` to `published`**

Present the four macro-chapters, source register, micro-questions and final case in the local preview. Change only `editorial.status` and review metadata after explicit approval.

- [ ] **Step 4: Verify the local production path in Safari-compatible static serving**

Run: `npm run serve`

Check desktop and mobile widths: four chapters, section index, legacy URL, wrong/correct micro-question, progress, note creation/edit/search/delete, DOCX download/text fallback, one animation and reduced mode, Focus and layered Escape, full view, search result and console.

- [ ] **Step 5: Version the entire module graph consistently**

Update every static import query string and the root script URL to the same release token. Search for the previous token and confirm zero stale module imports remain.

- [ ] **Step 6: Re-run full tests after versioning**

Run: `npm test && node scripts/check-secrets.mjs`

- [ ] **Step 7: Commit the approved release**

```bash
git add data/lessons/SMM-01.json index.html src styles tests
git commit -m "release: publish deep SMM-01 learning experience"
```

- [ ] **Step 8: Publish without rewriting unrelated history and verify GitHub Pages**

Fetch the remote first. If local history differs because the previous release was committed through the GitHub connector, integrate by a non-destructive merge or create the equivalent remote commit through the connector. Never use `reset --hard`, force-push or discard user changes.

- [ ] **Step 9: Verify the public URL in a clean browser session**

Repeat the desktop and mobile smoke checks against GitHub Pages and confirm no application-origin JavaScript errors. Report the exact public URL, release token and automated test count.

