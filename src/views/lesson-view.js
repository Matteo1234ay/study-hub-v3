import { renderLesson } from "../lessons/render-lesson.js";
import { createLessonCache } from "../lessons/lesson-cache.js";
import { element } from "../ui/components.js";
import { calculateLessonProgress, createProgressStore } from "../progress/local-progress.js";

export async function renderLessonView({ lesson, activeChapterId = null }) {
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
  view.querySelector(".lesson-source-state").textContent = fromCache ? `${model.chapters.length} capitoli · copia salvata` : `${model.chapters.length} capitoli · sincronizzato`;
  const store = createProgressStore();
  const progressState = element("span", { className: "lesson-progress-state" });
  view.querySelector(".lesson-meta").prepend(progressState);
  function paintLesson() {
    const saved = store.get(lesson.id);
    const completed = new Set(saved.completed);
    progressState.textContent = `${calculateLessonProgress(model.chapters, completed)}% completato`;
    body.replaceChildren(renderLesson(model, {
      lessonId: lesson.id,
      activeChapterId,
      completedChapterIds: completed,
      onToggleChapter(chapterId) {
        store.toggle(lesson.id, chapterId);
        paintLesson();
      }
    }));
  }
  paintLesson();
  if (activeChapterId) {
    requestAnimationFrame(() => {
      const chapter = document.getElementById(activeChapterId);
      chapter?.scrollIntoView({ block: "start" });
      chapter?.querySelector("h2")?.focus({ preventScroll: true });
    });
  }
  return view;
}
