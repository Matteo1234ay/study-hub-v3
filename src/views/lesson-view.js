import { renderLesson } from "../lessons/render-lesson.js";
import { element } from "../ui/components.js";

export function renderLessonView({ lesson, model = null, activeChapterId = null }) {
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
        element("span", { text: model ? `${model.chapters.length} capitoli` : "Fonte da collegare" })
      ])
    ])
  );

  if (!model) {
    view.append(element("section", { className: "source-pending", attrs: { "role": "status" } }, [
      element("span", { className: "empty-mark", text: "↗", attrs: { "aria-hidden": "true" } }),
      element("h2", { text: "Contenuto live non ancora collegato" }),
      element("p", { text: "La struttura della lezione è pronta. Il testo comparirà qui esclusivamente dopo il collegamento al Google Doc ufficiale, senza contenuti inventati o duplicati nel codice." })
    ]));
    return view;
  }

  view.append(renderLesson(model, { lessonId: lesson.id, activeChapterId }));
  if (activeChapterId) {
    requestAnimationFrame(() => {
      const chapter = document.getElementById(activeChapterId);
      chapter?.scrollIntoView({ block: "start" });
      chapter?.querySelector("h2")?.focus({ preventScroll: true });
    });
  }
  return view;
}
