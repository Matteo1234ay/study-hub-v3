import { PATHS } from "../config/paths.js";
import { element, pageHeader } from "../ui/components.js";

export function renderPathsView() {
  return element("section", { className: "content-page" }, [
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
}
