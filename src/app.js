import { renderNotesView } from "./views/notes-view.js?v=20260906-33";
import { renderSettingsView } from "./views/settings-view.js?v=20260906-33";
import { findLesson, findPath } from "./config/paths.js?v=20260906-33";
import { navigateToHash, startRouter } from "./router.js?v=20260906-33";
import { element, pageHeader } from "./ui/components.js?v=20260906-33";
import { renderHomeView } from "./views/home-view.js?v=20260906-36";
import { renderPathView } from "./views/path-view.js?v=20260906-33";
import { renderPathsView } from "./views/paths-view.js?v=20260906-33";
import { renderLessonView } from "./views/lesson-view.js?v=20260906-33";
import { renderProgressView } from "./views/progress-view.js?v=20260906-33";
import { renderSearchView } from "./views/search-view.js?v=20260906-33";
import { renderReviewView } from "./views/review-view.js?v=20260906-33";
import { renderAssessmentView } from "./views/assessment-view.js?v=20260906-33";
import { renderPathAssessmentView } from "./views/path-assessment-view.js?v=20260906-33";
import { createPreferencesStore } from "./study/preferences.js?v=20260906-33";
import { shouldPreserveCinematicScroll } from "./home/home-shared-transition.js?v=20260906-33";

const app = document.querySelector("#app");
const preferences = createPreferencesStore();
preferences.applyTo(document.documentElement);

const focusExit = document.querySelector(".focus-exit");
function exitFocusMode() {
  preferences.update({ focus: false });
  preferences.applyTo(document.documentElement);
  document.querySelector(".reading-toolbar button[aria-pressed]")?.setAttribute("aria-pressed", "false");
  document.querySelector(".site-header a")?.focus();
}
focusExit?.addEventListener("click", exitFocusMode);
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && preferences.get().focus) exitFocusMode();
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
  app.firstElementChild?.cleanup?.();
  let view;
  if (route.name === "home") view = renderHomeView({ navigate: navigateToHash });
  else if (route.name === "notes") view = renderNotesView();
  else if (route.name === "settings") view = renderSettingsView();
  else if (route.name === "paths") view = renderPathsView({ navigate: navigateToHash });
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
      activeChapterId: route.params.chapterId ?? null,
      activeSectionId: route.params.sectionId ?? null,
      viewMode: route.params.view ?? "chapter"
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
  const labels = { home:"Il tuo spazio", paths:"Percorsi", path:"Percorso", lesson:"Lezione", chapter:"Lezione", notes:"Note", settings:"Impostazioni", progress:"Progressi", search:"Cerca", review:"Ripasso", assessment:"Esercitazione", "chapter-assessment":"Esercitazione", "path-assessment":"Verifica", "path-final-exam":"Esame finale" };
  document.title = `Study Hub · ${labels[route.name] ?? "Pagina non trovata"}`;
  document.body.dataset.route = route.name;
  const navRoute = ["path", "lesson", "chapter", "assessment", "chapter-assessment", "path-assessment", "path-final-exam"].includes(route.name) ? "paths" : route.name;
  document.querySelectorAll(".main-nav a").forEach(link => {
    if (link.getAttribute("href") === `#/${navRoute}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  app.focus({ preventScroll: true });
  const reducedMotion = preferences.get().motion === "reduced" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!shouldPreserveCinematicScroll(document)) {
    scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }
}

startRouter(render);
