import { PATHS } from "../config/paths.js";
import { element } from "../ui/components.js";

export function renderHomeView() {
  const section = element("section", { className: "home-view" });
  const hero = element("section", { className: "hero" }, [
    element("div", { className: "hero-copy" }, [
      element("p", { className: "eyebrow", text: "Percorso personale · Study Hub V3" }),
      element("h1", { className: "hero-title", text: "Capisci. Applica. Dimostra." }),
      element("p", { className: "hero-lead", text: "Uno spazio in cui i documenti diventano lezioni, le lezioni diventano competenze e il ripasso non richiede più di cercare dentro una dispensa." }),
      element("div", { className: "hero-actions" }, [
        element("a", { className: "button primary", text: "Esplora i percorsi", href: "#/paths" }),
        element("a", { className: "button quiet", text: "Continua SMM-01", href: "#/lessons/SMM-01" })
      ])
    ]),
    element("div", { className: "hero-orbit", attrs: { "aria-hidden": "true" } }, [
      element("div", { className: "orbit-ring ring-one" }),
      element("div", { className: "orbit-ring ring-two" }),
      element("div", { className: "orbit-core", text: "V3" })
    ])
  ]);
  const cards = element("div", { className: "path-preview" }, PATHS.map((path, index) =>
    element("a", { className: `preview-card accent-${path.accent}`, href: `#/paths/${path.id}` }, [
      element("span", { className: "card-index", text: String(index + 1).padStart(2, "0") }),
      element("span", { className: "card-code", text: path.code }),
      element("h2", { text: path.title }),
      element("p", { text: path.description }),
      element("span", { className: "card-meta", text: path.lessons.length ? `${path.lessons.length} lezione disponibile` : "In preparazione" })
    ])
  ));
  section.append(hero, element("section", { className: "home-paths" }, [
    element("div", { className: "section-heading" }, [
      element("p", { className: "eyebrow", text: "Percorsi" }),
      element("h2", { text: "Una struttura che cresce con te." })
    ]), cards
  ]));
  return section;
}
