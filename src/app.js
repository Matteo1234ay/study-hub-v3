import { findPath } from "./config/paths.js";
import { startRouter } from "./router.js";
import { element, pageHeader } from "./ui/components.js";
import { renderHomeView } from "./views/home-view.js";
import { renderPathView } from "./views/path-view.js";
import { renderPathsView } from "./views/paths-view.js";

const app = document.querySelector("#app");

function placeholder(title, description) {
  return element("section", { className: "content-page" }, [
    pageHeader("Study Hub V3", title, description),
    element("a", { className: "button primary", text: "Torna ai percorsi", href: "#/paths" })
  ]);
}

function render(route) {
  let view;
  if (route.name === "home") view = renderHomeView();
  else if (route.name === "paths") view = renderPathsView();
  else if (route.name === "path") view = renderPathView(findPath(route.params.pathId));
  else if (route.name === "lesson" || route.name === "chapter") {
    view = placeholder("Lezione in preparazione", "Il renderer didattico verrà collegato nella prossima fase.");
  } else if (route.name === "progress") {
    view = placeholder("Progressi", "La sincronizzazione privata con Google Sheets verrà attivata dopo il renderer.");
  } else {
    view = placeholder("Pagina non trovata", "Controlla l’indirizzo oppure torna alla raccolta dei percorsi.");
  }
  app.replaceChildren(view);
  document.title = `Study Hub V3 · ${route.name}`;
  app.focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

startRouter(render);
