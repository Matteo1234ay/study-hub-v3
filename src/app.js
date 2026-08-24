import { findLesson, findPath } from "./config/paths.js";
import { startRouter } from "./router.js";
import { element, pageHeader } from "./ui/components.js";
import { renderHomeView } from "./views/home-view.js";
import { renderPathView } from "./views/path-view.js";
import { renderPathsView } from "./views/paths-view.js";
import { renderLessonView } from "./views/lesson-view.js";

const app = document.querySelector("#app");

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
  else if (route.name === "lesson" || route.name === "chapter") {
    const authorize = new URLSearchParams(location.hash.split("?")[1] ?? "").has("authorize");
    view = await renderLessonView({
      lesson: findLesson(route.params.lessonId),
      activeChapterId: route.params.chapterId ?? null,
      interactive: authorize
    });
  } else if (route.name === "progress") {
    view = placeholder("Progressi", "La sincronizzazione privata con Google Sheets verrà attivata dopo il renderer.");
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
