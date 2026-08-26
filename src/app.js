import { findLesson, findPath } from "./config/paths.js?v=20260826-3";
import { startRouter } from "./router.js?v=20260826-3";
import { element, pageHeader } from "./ui/components.js?v=20260826-3";
import { renderHomeView } from "./views/home-view.js?v=20260826-3";
import { renderPathView } from "./views/path-view.js?v=20260826-3";
import { renderPathsView } from "./views/paths-view.js?v=20260826-3";
import { renderLessonView } from "./views/lesson-view.js?v=20260826-3";
import { renderProgressView } from "./views/progress-view.js?v=20260826-3";
import { renderSearchView } from "./views/search-view.js?v=20260826-3";
import { renderReviewView } from "./views/review-view.js?v=20260826-3";
import { renderAssessmentView } from "./views/assessment-view.js?v=20260826-3";
import { renderPathAssessmentView } from "./views/path-assessment-view.js?v=20260826-3";
import { createPreferencesStore } from "./study/preferences.js?v=20260826-3";

const app = document.querySelector("#app");
const preferences = createPreferencesStore();
preferences.applyTo(document.documentElement);

const focusExit = document.querySelector(".focus-exit");
focusExit?.addEventListener("click", () => {
  preferences.update({ focus: false });
  preferences.applyTo(document.documentElement);
  document.querySelector(".site-header a")?.focus();
});

function placeholder(title, description) {
  return element("section", { className: "content-page" }, [
    pageHeader("Study Hub V3", title, description),
    element("a", { className: "button primary", text: "Torna ai percorsi", href: "#/paths" })
  ]);
}

let renderSequence = 0;

async function render(route) {
  const sequence = ++renderSequence;
  let view;
  if (route.name === "home") view = renderHomeView();
  else if (route.name === "paths") view = renderPathsView();
  else if (route.name === "path") view = renderPathView(findPath(route.params.pathId));
  else if (route.name === "path-assessment" || route.name === "path-final-exam") {
    view = await renderPathAssessmentView({
      path: findPath(route.params.pathId),
      mode: route.name === "path-final-exam" ? "final" : "progressive"
    });
  }
  else if (route.name === "lesson" || route.name === "chapter") {
    view = await renderLessonView({
      lesson: findLesson(route.params.lessonId),
      activeChapterId: route.params.chapterId ?? null
    });
  } else if (route.name === "progress") {
    view = await renderProgressView();
  } else if (route.name === "search") {
    view = await renderSearchView(route.params.query);
  } else if (route.name === "review") {
    view = await renderReviewView();
  } else if (route.name === "assessment" || route.name === "chapter-assessment") {
    view = await renderAssessmentView({
      lesson: findLesson(route.params.lessonId),
      chapterId: route.params.chapterId ?? null
    });
  } else {
    view = placeholder("Pagina non trovata", "Controlla l’indirizzo oppure torna alla raccolta dei percorsi.");
  }
  if (sequence !== renderSequence) return;
  app.replaceChildren(view);
  document.title = `Study Hub V3 · ${route.name}`;
  app.focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

startRouter(render);
