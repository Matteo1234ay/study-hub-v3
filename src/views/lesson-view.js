import { renderLesson } from "../lessons/render-lesson.js?v=20260827-1";
import { createLessonCache } from "../lessons/lesson-cache.js?v=20260827-1";
import { element } from "../ui/components.js?v=20260827-1";
import { calculateLessonProgress, createProgressStore } from "../progress/local-progress.js?v=20260827-1";
import { createStudyStore } from "../study/study-store.js?v=20260827-1";
import { createNotesStore } from "../study/notes-store.js?v=20260827-1";
import { buildPublicChapterContext } from "../assistant/study-assistant.js?v=20260827-1";
import { createChatGptAdapter } from "../assistant/chatgpt-adapter.js?v=20260827-1";
import { createStudyDialog } from "../ui/study-dialog.js?v=20260827-1";
import { normalizeLessonExperience } from "../lessons/lesson-model.js?v=20260827-1";
import { createReviewConceptsStore } from "../study/review-concepts-store.js?v=20260827-1";

export async function renderLessonView({ lesson, activeChapterId = null, viewMode = "chapter" }) {
  if (!lesson) {
    return element("section", { className: "content-page" }, [
      element("p", { className: "eyebrow", text: "Errore 404" }),
      element("h1", { text: "Lezione non trovata" }),
      element("a", { className: "button primary", text: "Torna ai percorsi", href: "#/paths" })
    ]);
  }

  const view = element("section", { className: "lesson-page" });
  view.append(
    element("nav", { className: "breadcrumbs lesson-breadcrumbs", attrs: { "aria-label": "Breadcrumb" } }, [
      element("a", { text: "Percorsi", href: "#/paths" }),
      element("span", { text: "/" }),
      element("a", { text: "Social Media Manager", href: "#/paths/smm" }),
      element("span", { text: "/" }),
      element("span", { text: lesson.id, attrs: { "aria-current": "page" } })
    ]),
    element("header", { className: "lesson-hero" }, [
      element("p", { className: "eyebrow", text: `${lesson.id} · ${lesson.level}` }),
      element("h1", { text: lesson.title }),
      element("p", { className: "page-lead", text: lesson.description }),
      element("div", { className: "lesson-meta" }, [
        element("span", { text: lesson.estimated }),
        element("span", { className: "lesson-source-state", text: "Caricamento fonte…" })
      ])
    ])
  );
  const body = element("div", { className: "lesson-live-region", attrs: { "aria-live": "polite" } });
  view.append(body);
  const cache = createLessonCache();
  let model;
  let fromCache = false;
  try {
    const response = await fetch(lesson.dataUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    model = await response.json();
    if (!Array.isArray(model.chapters) || !model.chapters.length) throw new Error("Invalid lesson model");
    cache.set(lesson.id, model, model.syncedAt ?? null);
  } catch (error) {
    const cached = cache.get(lesson.id);
    if (cached) {
      model = cached.document;
      fromCache = true;
    } else {
      const retry = element("button", { className: "button quiet", text: "Riprova", attrs: { type: "button" } });
      retry.addEventListener("click", () => location.reload());
      body.append(element("section", { className: "error-state", attrs: { role: "alert" } }, [
        element("p", { className: "eyebrow", text: "Fonte temporaneamente non disponibile" }),
        element("h2", { text: "La lezione non è ancora sincronizzata" }),
        element("p", { text: "GitHub sta preparando la versione pubblicata del documento. Riprova tra qualche minuto." }),
        retry
      ]));
      view.querySelector(".lesson-source-state").textContent = "Fonte non disponibile";
      return view;
    }
  }
  model = normalizeLessonExperience(model);
  const requestedChapterMissing = Boolean(activeChapterId && !model.chapters.some(chapter => chapter.id === activeChapterId));
  const effectiveChapterId = activeChapterId ?? model.chapters[0]?.id ?? null;
  if (requestedChapterMissing) {
    activeChapterId = null;
  }
  const resolvedChapterId = requestedChapterMissing ? (model.chapters[0]?.id ?? null) : effectiveChapterId;
  view.querySelector(".lesson-source-state").textContent = fromCache ? `${model.chapters.length} capitoli · copia salvata` : `${model.chapters.length} capitoli · sincronizzato`;
  const store = createProgressStore();
  const studyStore = createStudyStore();
  const notesStore = createNotesStore();
  const reviewConceptsStore = createReviewConceptsStore();
  const assistant = createChatGptAdapter();
  const assistantDialog = createStudyDialog();
  view.append(assistantDialog.node);
  const studyState = studyStore.getState();
  studyStore.recordVisit({ type: "lesson", lessonId: lesson.id, title: lesson.title });
  studyStore.setLastPosition(lesson.id, resolvedChapterId);
  const favorite = element("button", {
    className: `button quiet favorite-button${studyState.favorites.includes(lesson.id) ? " is-active" : ""}`,
    text: studyState.favorites.includes(lesson.id) ? "★ Nei preferiti" : "☆ Aggiungi ai preferiti",
    attrs: { type: "button", "aria-pressed": String(studyState.favorites.includes(lesson.id)) }
  });
  favorite.addEventListener("click", () => {
    const next = studyStore.toggleFavorite(lesson.id).favorites.includes(lesson.id);
    favorite.textContent = next ? "★ Nei preferiti" : "☆ Aggiungi ai preferiti";
    favorite.classList.toggle("is-active", next);
    favorite.setAttribute("aria-pressed", String(next));
  });
  view.querySelector(".lesson-meta").append(favorite);
  if (lesson.assessmentUrl) {
    view.querySelector(".lesson-meta").append(element("a", {
      className: "button primary",
      text: "Esercitazione completa",
      href: `#/lessons/${lesson.id}/assessment`
    }));
  }
  const progressState = element("span", { className: "lesson-progress-state" });
  const progressBar = element("progress", { className: "lesson-progress-bar", attrs: { max: "100", value: "0", "aria-label": "Avanzamento della lezione" } });
  view.querySelector(".lesson-meta").prepend(progressState);
  view.querySelector(".lesson-hero").append(progressBar);
  const missingNotice = requestedChapterMissing
    ? element("div", { className: "chapter-missing", attrs: { role: "status" } }, [
      element("b", { text: "Il capitolo richiesto non esiste più." }),
      element("span", { text: " Ti mostro il primo capitolo disponibile." })
    ])
    : null;
  function paintLesson() {
    const saved = store.get(lesson.id);
    const completed = new Set(saved.completed);
    const bookmarks = new Set(studyStore.getState().bookmarks[lesson.id] ?? []);
    const percentage = calculateLessonProgress(model.chapters, completed);
    progressState.textContent = `${percentage}% completato`;
    progressBar.value = percentage;
    const lessonNode = renderLesson(model, {
      lessonId: lesson.id,
      assessmentEnabled: Boolean(lesson.assessmentUrl),
      activeChapterId: resolvedChapterId,
      viewMode,
      completedChapterIds: completed,
      bookmarkedChapterIds: bookmarks,
      noteForChapter: chapterId => notesStore.get(lesson.id, chapterId),
      onToggleChapter(chapterId) {
        store.toggle(lesson.id, chapterId);
        studyStore.recordVisit({ type: "complete", lessonId: lesson.id, chapterId });
        paintLesson();
      },
      onToggleBookmark(chapterId) {
        studyStore.toggleBookmark(lesson.id, chapterId);
        paintLesson();
      },
      onNote(chapterId, text) {
        notesStore.set(lesson.id, chapterId, text);
      },
      onDeepen(chapter) {
        assistantDialog.open(assistant.prepare(buildPublicChapterContext({ lesson, chapter })));
      },
      onReviewConcept(lessonId, question) {
        reviewConceptsStore.markForReview(lessonId, question);
      },
      onConsolidateConcept(lessonId, question) {
        reviewConceptsStore.clear(lessonId, question.id);
      }
    });
    body.replaceChildren(...[missingNotice, lessonNode].filter(Boolean));
  }
  paintLesson();
  if (resolvedChapterId) {
    const active = model.chapters.find(chapter => chapter.id === resolvedChapterId);
    studyStore.recordVisit({ type: "chapter", lessonId: lesson.id, chapterId: resolvedChapterId, title: active?.title ?? resolvedChapterId });
    requestAnimationFrame(() => {
      const chapter = document.getElementById(resolvedChapterId);
      chapter?.scrollIntoView({ block: "start" });
      chapter?.querySelector("h2")?.focus({ preventScroll: true });
    });
  }
  return view;
}
