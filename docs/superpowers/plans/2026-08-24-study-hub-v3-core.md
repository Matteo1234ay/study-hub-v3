# Study Hub V3 Core Platform Implementation Plan

> **Piano parzialmente superato:** i Task 4 e 5 relativi a OAuth e API Google sono sostituiti dal piano [2026-08-24-zero-cost-remaining.md](./2026-08-24-zero-cost-remaining.md). I Task 1–3 restano validi e sono stati completati.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pubblicare Study Hub V3 su GitHub Pages con navigazione scalabile, renderer didattico universale, SMM-01 live da Google Docs e dati privati sincronizzati con Google Sheets senza Apps Script.

**Architecture:** Applicazione statica in HTML, CSS e JavaScript ES Modules con hash router. Google Identity Services fornisce access token temporanei alle API Docs, Drive e Sheets; una pipeline pura normalizza i documenti e costruisce un modello didattico indipendente dalla UI.

**Tech Stack:** HTML5, CSS3, JavaScript ES2022, ES Modules, Node.js built-in test runner, Google Identity Services, Google Docs API v1, Google Drive API v3, Google Sheets API v4, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-24-study-hub-v3-design.md`

## Global Constraints

- Costo totale: **0 €**.
- Nessun Google Apps Script, backend, database o dominio a pagamento.
- Nessun dato personale, risposta, risultato, token o segreto nel repository.
- Nessun access token in `localStorage`, `sessionStorage` o log.
- Repository pubblico e GitHub Pages sul piano Free.
- Google Docs rimane la fonte ufficiale delle lezioni.
- Google Sheets rimane la fonte privata di progresso e valutazioni.
- SMM-01 è una fixture di test, non un’eccezione nel renderer.
- Nessun contenuto inventato per lezioni mancanti.
- Ogni commit deve lasciare `npm test` verde.
- Tutti gli errori devono produrre UI esplicita; nessuna pagina bianca.

---

## File Map

- `index.html`: entry point e contenitore dell’app.
- `404.html`: reindirizzamento sicuro alla root GitHub Pages.
- `.nojekyll`: pubblicazione statica senza Jekyll.
- `package.json`: comandi di test senza dipendenze runtime.
- `src/app.js`: bootstrap e composizione dei servizi.
- `src/router.js`: parsing e navigazione hash.
- `src/config/paths.js`: catalogo pubblico di percorsi e lezioni.
- `src/config/google.js`: ID client e scope pubblici, mai segreti.
- `src/google/auth.js`: token temporaneo in memoria.
- `src/google/docs-client.js`: lettura Docs API.
- `src/google/sheets-client.js`: lettura/scrittura Sheets API.
- `src/lessons/normalize-doc.js`: risposta Docs → blocchi normalizzati.
- `src/lessons/classify-block.js`: classificazione semantica.
- `src/lessons/build-lesson.js`: blocchi → lezione/capitoli.
- `src/lessons/render-lesson.js`: modello → DOM sicuro.
- `src/progress/local-progress.js`: cache e bozze locali.
- `src/progress/progress-sync.js`: record Sheets idempotenti.
- `src/views/*.js`: dashboard, percorsi, lezione e progressi.
- `src/ui/components.js`: componenti DOM condivisi.
- `src/ui/errors.js`: errori tipizzati e azioni di recupero.
- `styles/*.css`: token, fondamenta, layout, componenti e lezione.
- `tests/*.test.js`: test unitari con `node:test`.
- `tests/fixtures/smm-01-doc.json`: risposta Docs ridotta e non privata.

---

### Task 1: Static shell, catalog and router

**Files:**
- Create: `package.json`
- Create: `.nojekyll`
- Create: `index.html`
- Create: `404.html`
- Create: `src/router.js`
- Create: `src/config/paths.js`
- Create: `src/app.js`
- Create: `src/views/home-view.js`
- Create: `src/views/paths-view.js`
- Create: `src/views/path-view.js`
- Create: `src/ui/components.js`
- Create: `styles/tokens.css`
- Create: `styles/base.css`
- Create: `styles/layout.css`
- Create: `styles/components.css`
- Test: `tests/router.test.js`
- Test: `tests/catalog.test.js`

**Interfaces:**
- Produces: `parseRoute(hash): Route`
- Produces: `startRouter(onRoute): () => void`
- Produces: `PATHS: readonly PathDefinition[]`
- Produces: `findPath(pathId): PathDefinition | null`
- Produces: `findLesson(lessonId): LessonDefinition | null`

- [ ] **Step 1: Create package metadata and failing router tests**

```json
{
  "name": "study-hub-v3",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "serve": "python3 -m http.server 4173"
  }
}
```

```js
// tests/router.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute } from "../src/router.js";

test("parses home and paths routes", () => {
  assert.deepEqual(parseRoute("#/home"), { name: "home", params: {} });
  assert.deepEqual(parseRoute("#/paths/smm"), {
    name: "path",
    params: { pathId: "smm" }
  });
});

test("parses lesson and chapter routes", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01"), {
    name: "lesson",
    params: { lessonId: "SMM-01" }
  });
  assert.deepEqual(parseRoute("#/lessons/SMM-01/retention"), {
    name: "chapter",
    params: { lessonId: "SMM-01", chapterId: "retention" }
  });
});

test("unknown routes become not-found", () => {
  assert.deepEqual(parseRoute("#/nonsense"), {
    name: "not-found",
    params: {}
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/router.js`.

- [ ] **Step 3: Implement router and catalog**

```js
// src/router.js
export function parseRoute(hash = "#/home") {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0 || parts[0] === "home") {
    return { name: "home", params: {} };
  }
  if (parts[0] === "paths" && parts.length === 1) {
    return { name: "paths", params: {} };
  }
  if (parts[0] === "paths" && parts.length === 2) {
    return { name: "path", params: { pathId: parts[1] } };
  }
  if (parts[0] === "lessons" && parts.length === 2) {
    return { name: "lesson", params: { lessonId: parts[1] } };
  }
  if (parts[0] === "lessons" && parts.length === 3) {
    return {
      name: "chapter",
      params: { lessonId: parts[1], chapterId: parts[2] }
    };
  }
  if (parts[0] === "progress" && parts.length === 1) {
    return { name: "progress", params: {} };
  }
  return { name: "not-found", params: {} };
}

export function startRouter(onRoute) {
  const dispatch = () => onRoute(parseRoute(location.hash));
  addEventListener("hashchange", dispatch);
  dispatch();
  return () => removeEventListener("hashchange", dispatch);
}
```

`paths.js` must define exactly four paths. Only Social Media Manager contains SMM-01; the other `lessons` arrays are empty. SMM-01 includes `docId: ""` until OAuth setup and never includes lesson body text.

- [ ] **Step 4: Build accessible shell and cinematic home**

Create semantic header, skip link, `<main id="app">`, loading status and navigation. Recreate the V3 palette and typographic hierarchy using CSS variables; use no external analytics or paid fonts. Views must build DOM nodes with `textContent`.

- [ ] **Step 5: Run tests and manual smoke test**

Run: `npm test`  
Expected: all tests PASS.

Run: `npm run serve`  
Open: `http://localhost:4173/#/home`  
Verify: Home, Percorsi and Social Media Manager navigate without reload; empty paths show “Nessuna lezione disponibile”.

- [ ] **Step 6: Commit**

```bash
git add package.json .nojekyll index.html 404.html src styles tests
git commit -m "feat: add Study Hub shell and scalable navigation"
```

---

### Task 2: Universal lesson model and semantic classifier

**Files:**
- Create: `src/lessons/classify-block.js`
- Create: `src/lessons/normalize-doc.js`
- Create: `src/lessons/build-lesson.js`
- Create: `tests/classify-block.test.js`
- Create: `tests/normalize-doc.test.js`
- Create: `tests/build-lesson.test.js`
- Create: `tests/fixtures/smm-01-doc.json`

**Interfaces:**
- Consumes: Google Docs `documents.get` JSON.
- Produces: `classifyBlock(block): ClassifiedBlock`
- Produces: `normalizeDocument(document): NormalizedBlock[]`
- Produces: `buildLesson(document): LessonModel`

- [ ] **Step 1: Write classifier tests**

```js
// tests/classify-block.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { classifyBlock } from "../src/lessons/classify-block.js";

test("classifies controlled semantic prefixes", () => {
  assert.equal(classifyBlock({ kind: "paragraph", text: "Esempio: Un caso" }).type, "example");
  assert.equal(classifyBlock({ kind: "paragraph", text: "ATTENZIONE: limite" }).type, "warning");
  assert.equal(classifyBlock({ kind: "paragraph", text: "Formula: x = y" }).type, "formula");
  assert.equal(classifyBlock({ kind: "paragraph", text: "Domanda diagnostica: perché?" }).type, "diagnostic-question");
});

test("preserves unknown paragraphs", () => {
  assert.deepEqual(
    classifyBlock({ kind: "paragraph", text: "Un testo normale." }),
    { type: "paragraph", text: "Un testo normale." }
  );
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL because lesson modules do not exist.

- [ ] **Step 3: Implement controlled prefix mapping**

```js
const PREFIXES = new Map([
  ["esempio", "example"],
  ["attenzione", "warning"],
  ["errore", "error"],
  ["punto chiave", "key-concept"],
  ["regola", "key-concept"],
  ["nota", "note"],
  ["domanda diagnostica", "diagnostic-question"],
  ["formula", "formula"],
  ["checklist", "checklist"],
  ["checkpoint", "checkpoint"]
]);

export function classifyBlock(block) {
  if (block.kind !== "paragraph") return { ...block, type: block.kind };
  const match = block.text.match(/^\s*([^:]{2,40}):\s*(.*)$/s);
  if (!match) return { type: "paragraph", text: block.text.trim() };
  const key = match[1].trim().toLocaleLowerCase("it");
  const type = PREFIXES.get(key);
  return type
    ? { type, label: match[1].trim(), text: match[2].trim() }
    : { type: "paragraph", text: block.text.trim() };
}
```

- [ ] **Step 4: Normalize Docs paragraphs and lists**

`normalizeDocument` must read `body.content[].paragraph`, combine `textRun.content`, trim terminal newlines, preserve `namedStyleType`, and group adjacent list items by `bullet.listId`. It must ignore empty structural paragraphs but never delete non-empty text.

- [ ] **Step 5: Build deterministic lesson model**

`buildLesson` must map `TITLE` to lesson title, `HEADING_1` to chapters and `HEADING_2`/controlled numbered headings to subsections. Slugs use normalized lowercase ASCII; duplicates become `slug-2`, `slug-3`. Content before the first chapter becomes an “Introduzione” chapter only if it is non-empty.

- [ ] **Step 6: Add reduced SMM-01 fixture and assertions**

The fixture contains representative text already present in the supplied V3: KPI vs metrica, retention, a formula, an error block and a checklist. Assert that no SMM-specific branch exists in production code.

- [ ] **Step 7: Run tests and commit**

Run: `npm test`  
Expected: all tests PASS.

```bash
git add src/lessons tests
git commit -m "feat: add universal Google Docs lesson model"
```

---

### Task 3: Safe lesson renderer and chapter navigation

**Files:**
- Create: `src/lessons/render-lesson.js`
- Create: `src/views/lesson-view.js`
- Create: `styles/lesson.css`
- Modify: `index.html`
- Modify: `src/app.js`
- Modify: `styles/components.css`
- Test: `tests/chapter-links.test.js`

**Interfaces:**
- Consumes: `LessonModel`.
- Produces: `renderLesson(model, options): HTMLElement`
- Produces: `chapterHref(lessonId, chapterId): string`
- Produces: `renderLessonView(context): Promise<HTMLElement>`

- [ ] **Step 1: Write chapter link tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { chapterHref } from "../src/lessons/render-lesson.js";

test("creates direct hash links to chapters", () => {
  assert.equal(
    chapterHref("SMM-01", "retention"),
    "#/lessons/SMM-01/retention"
  );
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `npm test`  
Expected: FAIL because `render-lesson.js` does not exist.

- [ ] **Step 3: Implement safe DOM rendering**

Use only `document.createElement`, `textContent`, `setAttribute` with controlled values and explicit component maps. Do not assign source text to `innerHTML`. Each chapter receives `data-chapter-id`, heading, progress control and previous/next controls.

- [ ] **Step 4: Implement sticky index and direct chapter focus**

The lesson view renders breadcrumb, hero, index and chapter stack. On `chapter` route it scrolls the exact matching chapter after render and moves keyboard focus to its heading using `tabindex="-1"`.

- [ ] **Step 5: Apply calm lesson design**

Use distinct styles for every semantic type, controlled reading width of approximately 72 characters, responsive mobile index, reduced motion and visible keyboard focus. Chapter titles must be visually unmistakable from paragraphs.

- [ ] **Step 6: Test and commit**

Run: `npm test`  
Expected: all tests PASS.

Manual: render the fixture, click every index item and verify the URL changes to the chapter route.

```bash
git add src index.html styles tests
git commit -m "feat: render structured lessons with chapter navigation"
```

---

### Task 4: Google authorization and live Docs loading

**Files:**
- Create: `src/config/google.js`
- Create: `src/google/auth.js`
- Create: `src/google/docs-client.js`
- Create: `src/google/drive-client.js`
- Create: `src/ui/errors.js`
- Create: `src/lessons/lesson-cache.js`
- Modify: `index.html`
- Modify: `src/config/paths.js`
- Modify: `src/views/lesson-view.js`
- Test: `tests/docs-client.test.js`
- Test: `tests/lesson-cache.test.js`

**Interfaces:**
- Produces: `getAccessToken({ interactive }): Promise<string>`
- Produces: `clearAccessToken(): void`
- Produces: `fetchGoogleDoc(docId, token, fetchImpl): Promise<object>`
- Produces: `getCachedLesson(lessonId): CachedLesson | null`
- Produces: `setCachedLesson(lessonId, document, revision): void`

- [ ] **Step 1: Write API client tests with injected fetch**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { fetchGoogleDoc } from "../src/google/docs-client.js";

test("requests a document with bearer authorization", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, json: async () => ({ documentId: "doc-1" }) };
  };
  const doc = await fetchGoogleDoc("doc-1", "token-1", fetchImpl);
  assert.equal(doc.documentId, "doc-1");
  assert.equal(calls[0].init.headers.Authorization, "Bearer token-1");
});

test("maps 403 to document-not-authorized", async () => {
  const fetchImpl = async () => ({ ok: false, status: 403 });
  await assert.rejects(
    fetchGoogleDoc("doc-1", "token-1", fetchImpl),
    { code: "document-not-authorized" }
  );
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL because Google client modules do not exist.

- [ ] **Step 3: Implement memory-only OAuth token client**

Load `https://accounts.google.com/gsi/client`. Initialize a token client with the public OAuth client ID and minimal read scopes. Store the returned access token only in a module variable. Never print the token or persist it.

- [ ] **Step 4: Implement Docs and Drive clients**

Use REST endpoints with injected `fetchImpl` for tests. Convert HTTP 401, 403, 404, 429 and offline failures into typed `StudyHubError` codes used by `errors.js`.

- [ ] **Step 5: Implement cache fallback**

Store only lesson content and revision metadata in IndexedDB or localStorage; never store OAuth tokens. A forced refresh bypasses freshness checks. Offline mode shows “Copia salvata” and its timestamp.

- [ ] **Step 6: Configure SMM-01 live source**

Insert the existing SMM-01 Google Doc ID from the provided V3 reference into `paths.js`: `1A-hkkknz7F4uMnbizJFq53cPu_crfXGLP4Sf42x-O0A`. Keep the ID in configuration only; do not copy the lesson body.

- [ ] **Step 7: One-time manual Google Cloud authorization checkpoint**

Required user action:

1. create/select a Google Cloud project without billing;
2. enable Docs API, Drive API and Sheets API;
3. create a Web OAuth client;
4. add `http://localhost:4173` and the final GitHub Pages origin as authorized JavaScript origins;
5. add the user’s Google account as test user;
6. provide only the public client ID.

No client secret, API key, credential file or token may be shared or committed.

- [ ] **Step 8: Test and commit**

Run: `npm test`  
Expected: all tests PASS.

Manual: authorize, open SMM-01, edit a harmless sentence in the source Doc, refresh and verify the new sentence appears with renderer formatting.

```bash
git add src index.html tests
git commit -m "feat: load live lessons through Google Docs API"
```

---

### Task 5: Local progress, Sheets sync and assessments

**Files:**
- Create: `src/progress/local-progress.js`
- Create: `src/progress/progress-sync.js`
- Create: `src/google/sheets-client.js`
- Create: `src/views/progress-view.js`
- Modify: `src/views/lesson-view.js`
- Modify: `src/app.js`
- Test: `tests/progress.test.js`
- Test: `tests/sheets-client.test.js`

**Interfaces:**
- Produces: `progressKey(lessonId, chapterId): string`
- Produces: `calculateLessonProgress(chapters, completedIds): number`
- Produces: `upsertProgress(record, sheetConfig, token): Promise<void>`
- Produces: `saveDraft(lessonId, answers): void`
- Produces: `clearDraft(lessonId): void`

- [ ] **Step 1: Write progress tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { calculateLessonProgress } from "../src/progress/local-progress.js";

test("calculates chapter completion percentage", () => {
  const chapters = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  assert.equal(calculateLessonProgress(chapters, new Set(["a", "c"])), 50);
});

test("empty lessons have zero progress", () => {
  assert.equal(calculateLessonProgress([], new Set()), 0);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test`  
Expected: FAIL because progress modules do not exist.

- [ ] **Step 3: Implement local progress and drafts**

Namespace keys under `study-hub-v3:`. Store chapter IDs, update timestamps and unsent answer drafts. Provide a visible “Cancella dati locali” action. Never store scores or access tokens unless they are already public UI state.

- [ ] **Step 4: Implement idempotent Sheets records**

Use a stable record ID `${lessonId}:${chapterId}` for progress and a generated submission ID for each assessment. Before append, search the configured ID column; update an existing progress row instead of appending a duplicate.

- [ ] **Step 5: Render progress and assessment states**

The progress view reads the private sheet after authorization and distinguishes loading, empty, partial, completed and unavailable states. Missing values display “Dato non disponibile”, never `0` unless the sheet contains zero.

- [ ] **Step 6: Test and commit**

Run: `npm test`  
Expected: all tests PASS.

Manual: complete two chapters, refresh, confirm local progress, authorize Sheets, sync twice and verify only one row per chapter exists.

```bash
git add src tests
git commit -m "feat: synchronize private learning progress with Sheets"
```

---

### Task 6: Security, accessibility and GitHub Pages release

**Files:**
- Create: `.github/workflows/test.yml`
- Create: `SECURITY.md`
- Modify: `README.md`
- Modify: `index.html`
- Modify: `styles/base.css`
- Modify: `styles/layout.css`
- Modify: `styles/lesson.css`
- Test: all tests

**Interfaces:**
- Consumes: completed application.
- Produces: tested public GitHub Pages deployment.

- [ ] **Step 1: Add zero-cost CI**

```yaml
name: test
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm test
```

Public-repository Actions and Pages are used only within the free service.

- [ ] **Step 2: Add production security controls**

Add a CSP meta policy permitting self, Google Identity Services scripts and required Google API connections. Confirm no token logging. Document OAuth configuration and a secret-response procedure in `SECURITY.md`.

Run:

```bash
rg -n "(client_secret|access_token|refresh_token|BEGIN PRIVATE KEY|AIza[0-9A-Za-z_-]{20,})" .
```

Expected: no committed secrets; source-code property names used in tests may be allowlisted only after manual inspection.

- [ ] **Step 3: Accessibility and responsive QA**

Verify:

- skip link;
- semantic headings;
- keyboard-visible focus;
- 200% zoom;
- mobile widths 320, 375 and 430 px;
- desktop Safari;
- `prefers-reduced-motion`;
- color contrast;
- sticky index does not cover content;
- errors receive `role="alert"`;
- loading status uses `aria-live="polite"`.

- [ ] **Step 4: Run full verification**

Run: `npm test`  
Expected: all tests PASS.

Run: `npm run serve`  
Verify all routes, refresh behavior, direct chapter links, missing lessons, denied authorization, offline cache and Sheets sync.

- [ ] **Step 5: Enable GitHub Pages**

Configure repository Settings → Pages → Deploy from branch → `main` → `/ (root)`. This is the only repository setting that may require user interaction if the connector cannot change Pages settings.

Wait for deployment, then open:

`https://matteo1234ay.github.io/study-hub-v3/`

Verify the published commit and all acceptance criteria from the specification.

- [ ] **Step 6: Commit release documentation**

```bash
git add .github SECURITY.md README.md index.html styles
git commit -m "docs: prepare Study Hub V3 public release"
```

---

## Plan Self-Review Result

- Spec coverage: architecture, navigation, renderer, Google Docs, Google Sheets, privacy, cache, errors, accessibility and free deployment are each mapped to a task.
- Placeholder scan: no unresolved markers or deferred implementation instructions.
- Type consistency: `LessonModel`, `Route`, Google client methods and progress functions have a single stable name across tasks.
- Scope control: later lesson-content improvements remain outside this implementation plan and will modify Google Docs only after the universal renderer is live.
