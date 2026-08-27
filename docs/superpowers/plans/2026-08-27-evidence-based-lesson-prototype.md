# Evidence-Based Lesson Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trasformare SMM-01 in un prototipo editoriale dinamico che mostra un capitolo alla volta, offre vista completa, fonti strutturate e micro-domande a controllo morbido senza perdere progressi, note, preferiti o compatibilità con le lezioni esistenti.

**Architecture:** Il JSON della lezione viene esteso in modo retrocompatibile e validato da funzioni pure. Il renderer resta responsabile del DOM, ma delega fonti, micro-domande e stato di ripasso a moduli focalizzati. La modalità della lezione viene espressa nell'URL tramite query string, mentre preferenze e concetti da riprendere restano in `localStorage` con chiavi dedicate.

**Tech Stack:** JavaScript ES modules, DOM API, CSS, Node.js built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-26-evidence-based-lesson-experience-design.md`

## Global Constraints

- Il sito resta statico e gratuito: nessun backend, nessuna API a pagamento e nessuna nuova dipendenza.
- Il modello JSON resta retrocompatibile; progressi, note e preferiti esistenti non vengono migrati o cancellati.
- Solo lezioni `published` compaiono normalmente agli studenti; l'assenza di `editorial` mantiene il comportamento esistente.
- Le micro-domande non bloccano mai la prosecuzione e gli errori vengono riproposti nel ripasso.
- Le fonti sono visibili su due livelli e una fonte mancante non interrompe il rendering.
- Il movimento deve avere funzione informativa, rispettare `prefers-reduced-motion` ed essere riducibile dall'utente.
- Focus resta sempre reversibile tramite pulsante visibile e tasto Escape.

---

### Task 1: Modello retrocompatibile e stato editoriale

**Files:**
- Create: `src/lessons/lesson-model.js`
- Create: `tests/lesson-model.test.js`
- Modify: `src/views/path-view.js`
- Modify: `tests/catalog.test.js`

**Interfaces:**
- Produces: `normalizeLessonExperience(model)` che restituisce un modello con `editorial`, `sources`, `chapters[].objective` e blocchi invariati quando i nuovi campi mancano.
- Produces: `isStudentVisibleLesson(model)` che restituisce `true` per modelli legacy e per `editorial.status === "published"`.

- [ ] **Step 1: Scrivere i test fallenti del modello**

```js
test("normalizes a legacy lesson without changing chapters", () => {
  const chapters = [{ id: "one", title: "Uno", blocks: [] }];
  const normalized = normalizeLessonExperience({ title: "Legacy", chapters });
  assert.equal(normalized.editorial.status, "published");
  assert.deepEqual(normalized.chapters, chapters);
  assert.deepEqual(normalized.sources, []);
});

test("keeps draft and review lessons out of the student catalog", () => {
  assert.equal(isStudentVisibleLesson({ editorial: { status: "draft" } }), false);
  assert.equal(isStudentVisibleLesson({ editorial: { status: "review" } }), false);
  assert.equal(isStudentVisibleLesson({ editorial: { status: "published" } }), true);
});
```

- [ ] **Step 2: Eseguire i test e verificare il fallimento corretto**

Run: `node --test tests/lesson-model.test.js tests/catalog.test.js`
Expected: FAIL perché `src/lessons/lesson-model.js` non esiste.

- [ ] **Step 3: Implementare normalizzazione e filtro minimi**

```js
const STATUSES = new Set(["draft", "review", "published"]);

export function normalizeLessonExperience(model) {
  const status = STATUSES.has(model?.editorial?.status) ? model.editorial.status : "published";
  return {
    ...model,
    editorial: { ...model?.editorial, status },
    sources: Array.isArray(model?.sources) ? model.sources : [],
    chapters: Array.isArray(model?.chapters) ? model.chapters : []
  };
}

export function isStudentVisibleLesson(model) {
  return normalizeLessonExperience(model).editorial.status === "published";
}
```

- [ ] **Step 4: Applicare il filtro soltanto dove il catalogo dispone del modello editoriale**

Aggiornare `path-view.js` senza cambiare la visibilità delle voci legacy di `src/config/paths.js`; il filtro deve entrare in funzione quando una voce include `editorial.status`.

- [ ] **Step 5: Eseguire i test mirati e l'intera suite**

Run: `node --test tests/lesson-model.test.js tests/catalog.test.js && npm test`
Expected: tutti i test PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lessons/lesson-model.js src/views/path-view.js tests/lesson-model.test.js tests/catalog.test.js
git commit -m "feat: add backward-compatible lesson editorial model"
```

### Task 2: Navigazione ibrida capitolo/vista completa

**Files:**
- Modify: `src/router.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `src/views/lesson-view.js`
- Modify: `tests/router.test.js`
- Modify: `tests/chapter-links.test.js`

**Interfaces:**
- Produces: `lessonHref(lessonId, { chapterId, view })` con `view` pari a `"chapter"` o `"full"`.
- Consumes: `normalizeLessonExperience(model)` da Task 1.
- `renderLesson(model, options)` riceve `viewMode` e rende un solo capitolo in modalità capitolo oppure tutti in modalità completa.

- [ ] **Step 1: Scrivere i test fallenti per URL e selezione capitoli**

```js
test("parses full lesson view without losing the lesson id", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01?view=full"), {
    name: "lesson", params: { lessonId: "SMM-01", view: "full" }
  });
});

test("selects only the requested chapter in chapter mode", () => {
  assert.deepEqual(selectVisibleChapters(model, "two", "chapter").map(c => c.id), ["two"]);
  assert.equal(selectVisibleChapters(model, null, "chapter")[0].id, "one");
  assert.equal(selectVisibleChapters(model, null, "full").length, 2);
});
```

- [ ] **Step 2: Eseguire i test e verificare che falliscano per le API mancanti**

Run: `node --test tests/router.test.js tests/chapter-links.test.js`
Expected: FAIL su `view` e `selectVisibleChapters`.

- [ ] **Step 3: Implementare parsing, URL e selezione puri**

```js
export function selectVisibleChapters(model, activeChapterId, viewMode = "chapter") {
  if (viewMode === "full") return model.chapters;
  const active = model.chapters.find(chapter => chapter.id === activeChapterId);
  return active ? [active] : model.chapters.slice(0, 1);
}
```

- [ ] **Step 4: Rendere il selettore di vista e un solo capitolo per impostazione predefinita**

Il controllo deve avere due link reali, `aria-current` sulla vista attiva e non deve modificare i dati di progresso. Un capitolo inesistente deve mostrare un avviso con link al primo capitolo, non una pagina vuota.

- [ ] **Step 5: Aggiornare focus, scroll e navigazione precedente/successiva**

Al cambio hash il titolo del capitolo riceve focus programmatico; i link precedente/successivo continuano a puntare agli ID stabili esistenti.

- [ ] **Step 6: Eseguire test mirati e suite completa**

Run: `node --test tests/router.test.js tests/chapter-links.test.js && npm test`
Expected: tutti i test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/router.js src/lessons/render-lesson.js src/views/lesson-view.js tests/router.test.js tests/chapter-links.test.js
git commit -m "feat: add chapter and full lesson views"
```

### Task 3: Fonti su due livelli

**Files:**
- Create: `src/lessons/sources.js`
- Create: `tests/lesson-sources.test.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `data/lessons/SMM-01.json`
- Modify: `styles/lesson.css`

**Interfaces:**
- Produces: `resolveSourceRefs(block, sources)` che restituisce `{ resolved, missing }` senza lanciare eccezioni.
- Produces: `renderSourceRefs(block, sources, { editorialMode })` con richiami compatti e `<details>` accessibili.

- [ ] **Step 1: Scrivere i test fallenti per fonti risolte e mancanti**

```js
test("resolves source references in block order", () => {
  const result = resolveSourceRefs({ sourceRefs: ["meta-help"] }, [{ id: "meta-help", title: "Meta Help" }]);
  assert.equal(result.resolved[0].title, "Meta Help");
  assert.deepEqual(result.missing, []);
});

test("reports a missing source without throwing", () => {
  const result = resolveSourceRefs({ sourceRefs: ["missing"] }, []);
  assert.deepEqual(result.missing, ["missing"]);
});
```

- [ ] **Step 2: Eseguire il test e osservare il fallimento**

Run: `node --test tests/lesson-sources.test.js`
Expected: FAIL perché il modulo non esiste.

- [ ] **Step 3: Implementare risoluzione e rendering accessibile**

La scheda espansa mostra titolo, autori/ente, anno, tipo, consultazione, qualità, limiti, nota editoriale pubblica e link esterno con `rel="noreferrer"`. “Fonte da verificare” appare solo per riferimenti mancanti e non blocca gli altri blocchi.

- [ ] **Step 4: Curare fonti e riferimenti nei primi tre capitoli SMM-01**

Inserire esclusivamente fonti ufficiali di piattaforma o fonti accademiche già verificate editorialmente. Ogni record deve avere `id`, `title`, `authors`, `year`, `url`, `type`, `accessedAt`, `evidenceQuality` e `limitations`.

- [ ] **Step 5: Aggiungere stile discreto e testare la retrocompatibilità**

Run: `node --test tests/lesson-sources.test.js tests/chapter-links.test.js tests/build-lesson.test.js && npm test`
Expected: tutti i test PASS e i blocchi senza `sourceRefs` restano invariati.

- [ ] **Step 6: Commit**

```bash
git add src/lessons/sources.js src/lessons/render-lesson.js data/lessons/SMM-01.json styles/lesson.css tests/lesson-sources.test.js
git commit -m "feat: add contextual lesson source cards"
```

### Task 4: Micro-domande a controllo morbido e ripasso locale

**Files:**
- Create: `src/lessons/micro-question.js`
- Create: `src/study/review-concepts-store.js`
- Create: `tests/micro-question.test.js`
- Create: `tests/review-concepts-store.test.js`
- Modify: `src/lessons/render-lesson.js`
- Modify: `data/lessons/SMM-01.json`
- Modify: `styles/lesson.css`

**Interfaces:**
- Produces: `validateMicroQuestion(block)` e `evaluateMicroQuestion(block, optionId, attempt)`.
- Produces: `createReviewConceptsStore(storage)` con `markForReview`, `clear`, `list`.
- `renderLesson` riceve `onReviewConcept(lessonId, question)` e `onConsolidateConcept(lessonId, question)`.

- [ ] **Step 1: Scrivere i test fallenti per validazione e valutazione**

```js
test("wrong first attempt returns explanatory feedback and a retry", () => {
  const result = evaluateMicroQuestion(question, "views", 1);
  assert.equal(result.correct, false);
  assert.equal(result.canRetry, true);
  assert.equal(result.feedback, question.options[0].feedback);
});

test("a correct answer consolidates the concept", () => {
  const result = evaluateMicroQuestion(question, "conversion", 1);
  assert.deepEqual(result, { correct: true, canRetry: false, feedback: question.options[1].feedback });
});
```

- [ ] **Step 2: Scrivere i test fallenti del negozio di ripasso**

```js
test("stores one stable review record per lesson and concept", () => {
  const store = createReviewConceptsStore(memoryStorage());
  store.markForReview("SMM-01", { id: "kpi-choice", concept: "Scelta KPI" });
  store.markForReview("SMM-01", { id: "kpi-choice", concept: "Scelta KPI" });
  assert.equal(store.list().length, 1);
});
```

- [ ] **Step 3: Eseguire entrambi i test e osservare i fallimenti corretti**

Run: `node --test tests/micro-question.test.js tests/review-concepts-store.test.js`
Expected: FAIL perché moduli e funzioni non esistono.

- [ ] **Step 4: Implementare logica pura e persistenza locale**

La chiave deve essere `study-hub-v3:review-concepts`; input non validi non devono essere salvati. Il secondo errore mantiene il concetto nel ripasso; una risposta corretta lo rimuove.

- [ ] **Step 5: Renderizzare il componente accessibile e non bloccante**

Usare `fieldset`, `legend`, pulsante di conferma e regione feedback con `aria-live="polite"`. Dopo il primo errore, mostrare `retryPrompt` e riordinare o sostituire le opzioni definite nel blocco. Il link al capitolo successivo resta sempre disponibile.

- [ ] **Step 6: Inserire micro-domande curate nei primi tre capitoli**

Ogni domanda deve avere `id`, `concept`, `prompt`, opzioni con feedback esplicativo, `retryPrompt`, `retryOptions` e `reviewOnError: true`.

- [ ] **Step 7: Eseguire test mirati e suite completa**

Run: `node --test tests/micro-question.test.js tests/review-concepts-store.test.js tests/chapter-links.test.js && npm test`
Expected: tutti i test PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lessons/micro-question.js src/study/review-concepts-store.js src/lessons/render-lesson.js data/lessons/SMM-01.json styles/lesson.css tests/micro-question.test.js tests/review-concepts-store.test.js
git commit -m "feat: add soft-control lesson micro questions"
```

### Task 5: Movimento controllato, stato visivo e regressioni Focus

**Files:**
- Modify: `src/study/preferences.js`
- Modify: `src/views/progress-view.js`
- Modify: `src/views/lesson-view.js`
- Modify: `src/app.js`
- Modify: `styles/lesson.css`
- Modify: `tests/notes-preferences.test.js`
- Modify: `tests/reading-controls.test.js`

**Interfaces:**
- La preferenza `motion` accetta `"system"` o `"reduced"` e applica `data-motion` al root.
- Escape disattiva Focus soltanto quando Focus è attivo e restituisce il focus a un controllo sensato.

- [ ] **Step 1: Scrivere test fallenti per preferenza movimento ed Escape**

```js
test("accepts only controlled motion preferences", () => {
  const store = createPreferencesStore(memoryStorage());
  assert.equal(store.update({ motion: "reduced" }).motion, "reduced");
  assert.equal(store.update({ motion: "unsafe" }).motion, "system");
});
```

Il test strutturale di `app.js` deve cercare un listener `keydown`, il controllo di `event.key === "Escape"` e l'aggiornamento `{ focus: false }`.

- [ ] **Step 2: Eseguire i test e osservare i fallimenti**

Run: `node --test tests/notes-preferences.test.js tests/reading-controls.test.js`
Expected: FAIL su `motion` e listener Escape.

- [ ] **Step 3: Implementare preferenza, controllo UI ed Escape**

La scelta “Segui il dispositivo” resta predefinita. “Riduci movimento” elimina transizioni non essenziali; `prefers-reduced-motion: reduce` produce lo stesso risultato senza richiedere configurazione.

- [ ] **Step 4: Aggiungere avanzamento e transizioni funzionali**

Mostrare il numero del capitolo attivo e una barra di avanzamento con testo equivalente. Animare solo cambio capitolo, apertura feedback e variazione della barra. Nessuna animazione continua.

- [ ] **Step 5: Verificare Focus e controlli di lettura senza regressioni**

Run: `node --test tests/notes-preferences.test.js tests/reading-controls.test.js && npm test`
Expected: tutti i test PASS, incluso il test del pulsante fisso `.focus-exit`.

- [ ] **Step 6: Commit**

```bash
git add src/study/preferences.js src/views/progress-view.js src/views/lesson-view.js src/app.js styles/lesson.css tests/notes-preferences.test.js tests/reading-controls.test.js
git commit -m "feat: add controlled lesson motion and focus escape"
```

### Task 6: Verifica integrata e pubblicazione controllata

**Files:**
- Modify: `README.md`
- Modify: `index.html`
- Modify: `src/app.js`
- Test: all files under `tests/`

**Interfaces:**
- Nessuna nuova API; questo task consolida e verifica le interfacce precedenti.

- [ ] **Step 1: Documentare il prototipo e il flusso editoriale**

Descrivere vista capitolo/completa, stati `draft/review/published`, fonti, micro-domande e ripasso locale; specificare che account e backend non fanno parte del prototipo.

- [ ] **Step 2: Aggiornare il cache-busting degli asset coerentemente**

Usare un unico identificatore di rilascio su tutti gli import statici e dinamici già versionati, preservando la protezione Safari introdotta nella correzione corrente.

- [ ] **Step 3: Eseguire la suite pulita**

Run: `npm test`
Expected: tutti i test PASS, zero failure e zero warning inattesi.

- [ ] **Step 4: Avviare il server e verificare manualmente desktop/mobile**

Run: `npm run serve`

Verificare: apertura SMM-01; primo capitolo soltanto; vista completa; indice; precedente/successivo; fonti; primo errore e secondo tentativo; ripasso persistente; note; preferito; completamento; Focus con pulsante ed Escape; testo, larghezza e movimento; larghezza 390 px; console senza errori.

- [ ] **Step 5: Controllare modifiche e segreti**

Run: `git diff --check && node scripts/check-secrets.mjs && git status --short`
Expected: nessun errore di whitespace, nessun segreto e solo file del prototipo/modifiche Safari già preservate.

- [ ] **Step 6: Commit finale**

```bash
git add README.md index.html src/app.js
git commit -m "docs: document evidence-based lesson prototype"
```

- [ ] **Step 7: Pubblicare soltanto dopo verifica locale**

Integrare il branch in `main`, effettuare push e verificare la GitHub Pages pubblica. Se qualunque controllo fallisce, non pubblicare e riportare il blocco.

## Self-review

- Copertura specifica: modello editoriale, vista ibrida, fonti, micro-domande, ripasso, movimento, Focus, preferenze, errori e retrocompatibilità sono assegnati a task verificabili.
- Nessun placeholder: ogni comportamento ha file, interfaccia, test, comando e risultato atteso.
- Coerenza tipi: `editorial.status`, `viewMode`, `sourceRefs`, `micro-question`, `motion` e la chiave `study-hub-v3:review-concepts` restano invariati tra i task.

