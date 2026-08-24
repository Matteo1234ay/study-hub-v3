import { element, emptyState, pageHeader } from "../ui/components.js";

export function renderPathView(path) {
  if (!path) {
    return element("section", { className: "content-page" }, [
      pageHeader("Errore 404", "Percorso non trovato", "Il percorso richiesto non esiste."),
      element("a", { className: "button primary", text: "Torna ai percorsi", href: "#/paths" })
    ]);
  }
  const lessons = path.lessons.length
    ? element("div", { className: "lesson-grid" }, path.lessons.map((lesson) =>
        element("a", { className: "lesson-card", href: `#/lessons/${lesson.id}` }, [
          element("div", { className: "lesson-topline" }, [
            element("span", { className: "card-code", text: lesson.id }),
            element("span", { className: "lesson-level", text: lesson.level })
          ]),
          element("h2", { text: lesson.title }),
          element("p", { text: lesson.description }),
          element("span", { className: "card-meta", text: `${lesson.estimated} · Apri la lezione →` })
        ])
      ))
    : emptyState();
  return element("section", { className: "content-page" }, [
    element("nav", { className: "breadcrumbs", attrs: { "aria-label": "Breadcrumb" } }, [
      element("a", { text: "Percorsi", href: "#/paths" }),
      element("span", { text: "/" }),
      element("span", { text: path.title, attrs: { "aria-current": "page" } })
    ]),
    pageHeader(`${path.code} · Percorso`, path.title, path.description),
    lessons
  ]);
}
