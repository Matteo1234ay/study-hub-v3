import { renderLesson } from "../lessons/render-lesson.js";
import { buildLesson } from "../lessons/build-lesson.js";
import { createLessonCache } from "../lessons/lesson-cache.js";
import { getAccessToken } from "../google/auth.js";
import { fetchGoogleDoc } from "../google/docs-client.js";
import { element } from "../ui/components.js";
import { renderErrorState, StudyHubError } from "../ui/errors.js";

export async function renderLessonView({ lesson, activeChapterId = null, interactive = false }) {
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
  let document;
  let fromCache = false;
  try {
    const token = await getAccessToken({ interactive });
    document = await fetchGoogleDoc(lesson.docId, token);
    cache.set(lesson.id, document, document.revisionId ?? null);
  } catch (error) {
    const cached = cache.get(lesson.id);
    if (cached && error.code !== "google-not-configured") {
      document = cached.document;
      fromCache = true;
    } else {
      const safeError = error instanceof StudyHubError ? error : new StudyHubError("invalid-google-response", "Errore inatteso.");
      body.append(renderErrorState(safeError, {
        onAuthorize: () => location.assign(`${location.hash}?authorize=1`),
        onRetry: () => location.reload()
      }));
      view.querySelector(".lesson-source-state").textContent = "Fonte non disponibile";
      return view;
    }
  }
  const model = buildLesson(document);
  view.querySelector(".lesson-source-state").textContent = fromCache ? `${model.chapters.length} capitoli · copia salvata` : `${model.chapters.length} capitoli · Google Docs`;
  body.append(renderLesson(model, { lessonId: lesson.id, activeChapterId }));
  if (activeChapterId) {
    requestAnimationFrame(() => {
      const chapter = document.getElementById(activeChapterId);
      chapter?.scrollIntoView({ block: "start" });
      chapter?.querySelector("h2")?.focus({ preventScroll: true });
    });
  }
  return view;
}
