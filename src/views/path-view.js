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
  const assessment = path.assessmentManifestUrl
    ? element("section", { className: "path-assessment-panel" }, [
        element("p", { className: "eyebrow", text: "Verifica riassuntiva" }),
        element("h2", { text: "Controlla ciò che hai imparato finora" }),
        element("p", { text: "Il test intermedio usa tutti i capitoli e tutte le lezioni attualmente presenti. Quando aggiungeremo una nuova lezione con le sue domande, verrà inclusa automaticamente." }),
        element("div", { className: "hero-actions" }, [
          element("a", { className: "button primary", text: "Avvia verifica riassuntiva", href: `#/paths/${path.id}/assessment` }),
          element("a", { className: "button quiet", text: "Esame finale · non ancora disponibile", href: `#/paths/${path.id}/final-exam` })
        ]),
        element("small", { text: "Gratis, senza API: risultati e cronologia rimangono in questo browser." })
      ])
    : null;
  return element("section", { className: "content-page" }, [
    element("nav", { className: "breadcrumbs", attrs: { "aria-label": "Breadcrumb" } }, [
      element("a", { text: "Percorsi", href: "#/paths" }),
      element("span", { text: "/" }),
      element("span", { text: path.title, attrs: { "aria-current": "page" } })
    ]),
    pageHeader(`${path.code} · Percorso`, path.title, path.description),
    lessons,
    assessment
  ]);
}
