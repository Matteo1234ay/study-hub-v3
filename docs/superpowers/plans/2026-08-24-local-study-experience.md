# Local Study Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere ricerca, preferiti, segnalibri, ripresa, ripasso, cronologia, note, preferenze di lettura e approfondimento ChatGPT manuale senza API o servizi a pagamento.

**Architecture:** Moduli JavaScript puri gestiscono dati namespaced in `localStorage` e vengono collegati alle viste esistenti. L’assistente prepara esclusivamente un prompt basato sul contenuto pubblico; copia e apertura di ChatGPT restano azioni esplicite dell’utente. Tutte le funzionalità degradano in modo sicuro se storage, clipboard o una lezione non sono disponibili.

**Tech Stack:** HTML5, CSS, JavaScript ES modules, Web Storage, Clipboard API opzionale, Node built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-24-local-study-experience-design.md`

## Global Constraints

- Nessuna API, chiave, login applicativo, backend, database remoto, prova gratuita o servizio fatturabile.
- Tutti i dati personali restano nel browser e usano il prefisso `study-hub-v3:`.
- Il prompt di approfondimento usa solo contenuto pubblico della lezione.
- Nessuna dipendenza runtime o pacchetto di terze parti.
- La Content Security Policy non deve consentire script remoti.
- La cronologia conserva al massimo 500 eventi.

---

### Task 1: Archivio locale di studio

**Files:**
- Create: `src/study/study-store.js`
- Create: `tests/study-store.test.js`

**Interfaces:**
- Produces: `createStudyStore(storage, now)` con `getState()`, `toggleFavorite(lessonId)`, `toggleBookmark(lessonId, chapterId)`, `recordVisit(event)`, `setLastPosition(lessonId, chapterId)`, `clearHistory()`.
- State: `{ favorites: string[], bookmarks: Record<string,string[]>, lastPosition: object|null, history: object[] }`.

- [ ] **Step 1: Scrivere i test fallenti**

```js
test("toggles favorites and bookmarks without duplicates", () => {
  const store = createStudyStore(memoryStorage(), () => 1000);
  store.toggleFavorite("SMM-01");
  store.toggleFavorite("SMM-01");
  store.toggleBookmark("SMM-01", "retention");
  assert.deepEqual(store.getState().favorites, []);
  assert.deepEqual(store.getState().bookmarks, { "SMM-01": ["retention"] });
});

test("caps history at 500 newest events", () => {
  const store = createStudyStore(memoryStorage(), () => 1000);
  for (let i = 0; i < 510; i += 1) store.recordVisit({ type: "chapter", id: String(i) });
  assert.equal(store.getState().history.length, 500);
  assert.equal(store.getState().history.at(-1).id, "509");
});
```

- [ ] **Step 2: Eseguire il test e verificare RED**

Run: `node --test tests/study-store.test.js`  
Expected: FAIL `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementare parsing sicuro e mutazioni immutabili**

```js
const KEY = "study-hub-v3:study";
const EMPTY = { favorites: [], bookmarks: {}, lastPosition: null, history: [] };

export function createStudyStore(storage = localStorage, now = Date.now) {
  const read = () => {
    try {
      const value = JSON.parse(storage.getItem(KEY));
      return value && Array.isArray(value.favorites) && Array.isArray(value.history)
        ? { ...EMPTY, ...value }
        : structuredClone(EMPTY);
    } catch { return structuredClone(EMPTY); }
  };
  const write = (state) => (storage.setItem(KEY, JSON.stringify(state)), state);
  // Implementare i metodi dichiarati; recordVisit usa [...history, event].slice(-500).
  return { getState: read, toggleFavorite, toggleBookmark, recordVisit, setLastPosition, clearHistory };
}
```

- [ ] **Step 4: Eseguire il test e verificare GREEN**

Run: `node --test tests/study-store.test.js`  
Expected: 2 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/study/study-store.js tests/study-store.test.js
git commit -m "feat: add local study activity store"
```

### Task 2: Note e preferenze di lettura

**Files:**
- Create: `src/study/notes-store.js`
- Create: `src/study/preferences.js`
- Create: `tests/notes-preferences.test.js`

**Interfaces:**
- Produces: `createNotesStore(storage)` con `get`, `set`, `remove`.
- Produces: `createPreferencesStore(storage)` con `get`, `update`, `applyTo(root)`.

- [ ] **Step 1: Scrivere i test fallenti**

```js
test("keeps notes separate by lesson and chapter", () => {
  const store = createNotesStore(memoryStorage());
  store.set("SMM-01", "reach", "Nota reach");
  assert.equal(store.get("SMM-01", "reach"), "Nota reach");
  assert.equal(store.get("SMM-01", "retention"), "");
});

test("accepts only controlled reading preferences", () => {
  const store = createPreferencesStore(memoryStorage());
  assert.deepEqual(store.update({ fontSize: "large", width: "narrow", focus: true, unsafe: "x" }), {
    fontSize: "large", width: "narrow", focus: true
  });
});
```

- [ ] **Step 2: Verificare RED**

Run: `node --test tests/notes-preferences.test.js`  
Expected: FAIL per moduli mancanti.

- [ ] **Step 3: Implementare storage separato e allowlist**

```js
const NOTE_PREFIX = "study-hub-v3:note:";
const DEFAULTS = { fontSize: "normal", width: "comfortable", focus: false };
const ALLOWED = { fontSize: new Set(["small", "normal", "large"]), width: new Set(["comfortable", "narrow"]) };
```

`applyTo(root)` imposta soltanto `data-font-size`, `data-reading-width` e `data-focus-mode`.

- [ ] **Step 4: Verificare GREEN**

Run: `node --test tests/notes-preferences.test.js`  
Expected: 2 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/study tests/notes-preferences.test.js
git commit -m "feat: add local notes and reading preferences"
```

### Task 3: Indice di ricerca client-side

**Files:**
- Create: `src/study/search-index.js`
- Create: `tests/search-index.test.js`
- Modify: `src/router.js`
- Modify: `tests/router.test.js`

**Interfaces:**
- Consumes: catalogo `PATHS` e modelli lezione `{ chapters }`.
- Produces: `buildSearchIndex(catalog, lessonDocuments)` e `searchStudyIndex(index, query, limit = 20)`.
- Nuova route: `#/search?q=retention` → `{ name: "search", params: { query: "retention" } }`.

- [ ] **Step 1: Scrivere test per normalizzazione, ranking e route**

```js
test("finds accents-insensitively and ranks titles first", () => {
  const index = buildSearchIndex(catalog, documents);
  const results = searchStudyIndex(index, "metrica");
  assert.equal(results[0].chapterId, "metrica-kpi");
});

test("parses search query", () => {
  assert.deepEqual(parseRoute("#/search?q=retention"), { name: "search", params: { query: "retention" } });
});
```

- [ ] **Step 2: Verificare RED**

Run: `node --test tests/search-index.test.js tests/router.test.js`.

- [ ] **Step 3: Implementare indice in memoria**

Normalizzare con `text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()`. Salvare excerpt massimo 180 caratteri. Non indicizzare note personali.

- [ ] **Step 4: Verificare GREEN**

Run: `node --test tests/search-index.test.js tests/router.test.js`.

- [ ] **Step 5: Commit**

```bash
git add src/study/search-index.js src/router.js tests/search-index.test.js tests/router.test.js
git commit -m "feat: add client-side lesson search"
```

### Task 4: Assistente di studio e adattatore ChatGPT manuale

**Files:**
- Create: `src/assistant/study-assistant.js`
- Create: `src/assistant/chatgpt-adapter.js`
- Create: `tests/study-assistant.test.js`

**Interfaces:**
- Produces: `buildPublicChapterContext({ lesson, chapter })`.
- Produces: `createChatGptAdapter()` con `{ id, prepare(context), destination }`.
- `prepare` restituisce testo; non chiama `fetch`, clipboard o `window.open`.

- [ ] **Step 1: Scrivere test privacy fallenti**

```js
test("builds a prompt only from public chapter content", () => {
  const prompt = createChatGptAdapter().prepare(buildPublicChapterContext({ lesson, chapter }));
  assert.match(prompt, /Retention/);
  assert.doesNotMatch(prompt, /nota privata|history|progress/i);
});

test("uses the stable ChatGPT home as destination", () => {
  assert.equal(createChatGptAdapter().destination, "https://chatgpt.com/");
});
```

- [ ] **Step 2: Verificare RED**

Run: `node --test tests/study-assistant.test.js`.

- [ ] **Step 3: Implementare contratto e prompt**

```js
export function buildPublicChapterContext({ lesson, chapter }) {
  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    chapterTitle: chapter.title,
    text: chapter.blocks.flatMap(block => block.items ?? block.text ?? []).join("\n")
  };
}
```

Il prompt chiede definizione, funzionamento, esempio, errori comuni, limiti delle conclusioni e applicazione pratica, restando aderente al testo fornito.

- [ ] **Step 4: Verificare GREEN**

Run: `node --test tests/study-assistant.test.js`.

- [ ] **Step 5: Commit**

```bash
git add src/assistant tests/study-assistant.test.js
git commit -m "feat: prepare privacy-safe study prompts"
```

### Task 5: Controlli nella pagina lezione

**Files:**
- Modify: `src/lessons/render-lesson.js`
- Modify: `src/views/lesson-view.js`
- Create: `src/ui/study-dialog.js`
- Modify: `styles/lesson.css`
- Modify: `styles/components.css`
- Modify: `tests/render-lesson.test.js`

**Interfaces:**
- Consumes: store di Task 1–2 e adattatore di Task 4.
- `renderLesson` accetta callback `onToggleBookmark`, `onNote`, `onDeepen` e set `bookmarkedChapterIds`.

- [ ] **Step 1: Estendere i test di presentazione**

```js
test("chapter actions never include private content in external URLs", () => {
  assert.equal(createChatGptAdapter().destination.includes("?"), false);
});
```

- [ ] **Step 2: Verificare RED**

Run: `node --test tests/render-lesson.test.js tests/study-assistant.test.js`.

- [ ] **Step 3: Aggiungere UI accessibile**

Ogni capitolo riceve:

- pulsante segnalibro con `aria-pressed`;
- area note con label esplicita e autosalvataggio su `input`;
- pulsante Approfondisci;
- dialogo con textarea readonly, “Copia richiesta” e link ChatGPT `target="_blank" rel="noopener noreferrer"`;
- messaggio alternativo se `navigator.clipboard.writeText` fallisce.

- [ ] **Step 4: Registrare visite e ultima posizione**

All’apertura della lezione registrare un solo evento; quando si raggiunge un capitolo esplicito aggiornare `lastPosition`. Un completamento registra un evento `complete` dopo la mutazione del progress store.

- [ ] **Step 5: Verificare suite interessata**

Run: `node --test tests/render-lesson.test.js tests/study-assistant.test.js tests/study-store.test.js tests/notes-preferences.test.js`.

- [ ] **Step 6: Commit**

```bash
git add src/lessons src/views/lesson-view.js src/ui/study-dialog.js styles tests
git commit -m "feat: add bookmarks notes and deepen controls"
```

### Task 6: Ricerca, ripasso e navigazione principale

**Files:**
- Create: `src/views/search-view.js`
- Create: `src/views/review-view.js`
- Modify: `src/views/home-view.js`
- Modify: `src/app.js`
- Modify: `index.html`
- Modify: `styles/layout.css`
- Modify: `styles/components.css`

**Interfaces:**
- Consumes: `PATHS`, `buildSearchIndex`, `searchStudyIndex`, `createStudyStore`.
- Nuove destinazioni: `#/search`, `#/review`; la home usa `lastPosition`.

- [ ] **Step 1: Aggiungere route ripasso con test fallente**

```js
test("parses review route", () => {
  assert.deepEqual(parseRoute("#/review"), { name: "review", params: {} });
});
```

- [ ] **Step 2: Verificare RED e implementare route**

Run: `node --test tests/router.test.js`; quindi aggiungere `review` e verificare PASS.

- [ ] **Step 3: Costruire ricerca**

Il form usa GET sull’hash senza inviare richieste di rete. Caricare ogni `dataUrl` con `Promise.allSettled`; mostrare risultati disponibili e un conteggio delle fonti non caricate.

- [ ] **Step 4: Costruire ripasso e ripresa**

La vista ripasso mostra capitoli segnalibrati e capitoli incompleti delle lezioni disponibili. Se vuota, mostra un’azione verso i Percorsi. La home mostra la posizione recente solo se ancora presente nel catalogo.

- [ ] **Step 5: Verifica manuale locale**

Run: `python3 -m http.server 8080`; verificare tastiera, ricerca senza risultati, risultato diretto, ripasso vuoto e ripresa.

- [ ] **Step 6: Commit**

```bash
git add src/views src/app.js src/router.js index.html styles tests/router.test.js
git commit -m "feat: add search review and resume navigation"
```

### Task 7: Dashboard, cronologia e preferenze

**Files:**
- Modify: `src/views/progress-view.js`
- Modify: `src/app.js`
- Modify: `styles/components.css`

**Interfaces:**
- Consumes: study store, preferences store e backup esistente.
- Non introduce nuove chiavi fuori dal namespace esistente.

- [ ] **Step 1: Rendere la dashboard informativa**

Mostrare: percentuali, preferiti, segnalibri, ultime 20 attività e controlli di lettura. Il pulsante “Cancella cronologia” richiede conferma nativa prima di `clearHistory()`; non cancella note o progressi.

- [ ] **Step 2: Applicare preferenze all’avvio**

In `app.js`, chiamare `preferences.applyTo(document.documentElement)` prima del primo render e dopo ogni modifica.

- [ ] **Step 3: Aggiungere CSS controllato**

Usare selettori come `[data-font-size="large"]`, `[data-reading-width="narrow"]` e `[data-focus-mode="true"]`; nessuno stile inline.

- [ ] **Step 4: Verifica manuale**

Verificare refresh, cambio dimensione, modalità concentrazione, cancellazione cronologia e persistenza delle note.

- [ ] **Step 5: Commit**

```bash
git add src/views/progress-view.js src/app.js styles/components.css
git commit -m "feat: expand local study dashboard"
```

### Task 8: Backup, sicurezza e pubblicazione

**Files:**
- Modify: `tests/backup.test.js`
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `scripts/check-secrets.mjs` solo se i test mostrano un falso positivo reale.

**Interfaces:**
- Consumes: `exportLocalData`, `importLocalData`; il prefisso già include automaticamente i nuovi dati.

- [ ] **Step 1: Estendere il test backup**

```js
test("exports study history notes and preferences", () => {
  const storage = memoryStorage({
    "study-hub-v3:study": '{"history":[]}',
    "study-hub-v3:note:SMM-01:reach": "nota",
    "study-hub-v3:preferences": '{"fontSize":"large"}'
  });
  assert.equal(Object.keys(exportLocalData(storage, now).entries).length, 3);
});
```

- [ ] **Step 2: Eseguire suite completa e scanner**

Run: `node --test && node scripts/check-secrets.mjs`  
Expected: tutti i test PASS e `Nessun possibile segreto rilevato.`

- [ ] **Step 3: Aggiornare documentazione**

Documentare dati locali, limite 500 eventi, backup, assenza di sincronizzazione, comportamento Approfondisci e futura sostituibilità con IA locale.

- [ ] **Step 4: Verificare sito con server statico**

Verificare home, Percorsi, SMM-01, ricerca, ripasso, Progressi, note, backup e dialogo Approfondisci. Controllare console senza errori provenienti dal sito.

- [ ] **Step 5: Commit e pubblicazione**

```bash
git add .
git commit -m "docs: document zero-cost study features"
git push origin main
```

- [ ] **Step 6: Verifica GitHub Pages**

Aprire `https://matteo1234ay.github.io/study-hub-v3/`, ripetere il percorso critico e confermare il commit effettivamente pubblicato prima di dichiarare il lavoro completato.
