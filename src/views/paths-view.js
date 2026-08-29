import { PATHS } from "../config/paths.js?v=20260829-23";
import { element, pageHeader } from "../ui/components.js?v=20260829-23";
import { createCinematicRouteState } from "../home/home-route-state.js?v=20260829-23";
import { createPathsReturnController } from "../home/paths-return-controller.js?v=20260829-23";

export function renderPathsView({ navigate } = {}) {
  const root = element("section", { className: "content-page" }, [
    pageHeader("Archivio didattico", "Percorsi", "Entra in un’area, scegli la lezione e raggiungi direttamente il capitolo che vuoi studiare o ripassare."),
    element("div", { className: "path-grid" }, PATHS.map((path, index) =>
      element("a", { className: `path-card accent-${path.accent}`, href: `#/paths/${path.id}` }, [
        element("span", { className: "card-index", text: String(index + 1).padStart(2, "0") }),
        element("span", { className: "card-code", text: path.code }),
        element("h2", { text: path.title }),
        element("p", { text: path.description }),
        element("span", { className: "card-meta", text: path.lessons.length ? `${path.lessons.length} lezione` : "Nessuna lezione" })
      ])
    ))
  ]);
  queueMicrotask(() => {
    if (!root.isConnected || typeof navigate !== "function") return;
    const controller = createPathsReturnController({
      routeState: createCinematicRouteState(),
      navigate
    });
    if (!controller.active) return;
    root.dataset.cinematicEntry = "true";
    const observer = new MutationObserver(() => {
      if (root.isConnected) return;
      controller.dispose();
      observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
  return root;
}
