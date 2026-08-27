import { PATHS, findLesson } from "../config/paths.js?v=20260827-2";
import { element } from "../ui/components.js?v=20260827-2";
import { createStudyStore } from "../study/study-store.js?v=20260827-2";

function decorateHomeMotion(section) {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const scene = section.querySelector(".home-scene");
  const cards = [...section.querySelectorAll(".preview-card")];
  let raf = 0;

  const move = (event) => {
    if (!scene) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - .5) * 2;
      const y = (event.clientY / window.innerHeight - .5) * 2;
      scene.style.setProperty("--mx", x.toFixed(3));
      scene.style.setProperty("--my", y.toFixed(3));
    });
  };
  window.addEventListener("pointermove", move, { passive: true });

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--rx", `${((event.clientY - rect.top) / rect.height - .5) * -8}deg`);
      card.style.setProperty("--ry", `${((event.clientX - rect.left) / rect.width - .5) * 10}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });

  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
  }, { threshold: .14 });
  section.querySelectorAll("[data-reveal]").forEach((node) => reveal.observe(node));
}

export function renderHomeView() {
  const last = createStudyStore().getState().lastPosition;
  const recentLesson = last ? findLesson(last.lessonId) : null;
  const continueHref = recentLesson ? `#/lessons/${recentLesson.id}${last.chapterId ? `/${last.chapterId}` : ""}` : "#/lessons/SMM-01";
  const section = element("section", { className: "home-view immersive-home" });

  const scene = element("div", { className: "home-scene", attrs: { "aria-hidden": "true" } }, [
    element("div", { className: "scene-glow glow-a" }),
    element("div", { className: "scene-glow glow-b" }),
    element("div", { className: "knowledge-object" }, [
      element("div", { className: "crystal crystal-a" }),
      element("div", { className: "crystal crystal-b" }),
      element("div", { className: "crystal crystal-c" }),
      element("div", { className: "knowledge-core" }, [
        element("span", { text: "STUDY" }),
        element("strong", { text: "V3" })
      ]),
      element("div", { className: "orbit orbit-a" }),
      element("div", { className: "orbit orbit-b" }),
      element("div", { className: "orbit orbit-c" })
    ]),
    element("span", { className: "scene-label label-a", text: "01 · LEARN" }),
    element("span", { className: "scene-label label-b", text: "02 · APPLY" }),
    element("span", { className: "scene-label label-c", text: "03 · PROVE" })
  ]);

  const hero = element("section", { className: "hero hero-immersive" }, [
    scene,
    element("div", { className: "hero-copy", attrs: { "data-reveal": "" } }, [
      element("p", { className: "eyebrow hero-kicker", text: "PERSONAL LEARNING SYSTEM · 2026" }),
      element("h1", { className: "hero-title kinetic-title" }, [
        element("span", { text: "CAPISCI." }),
        element("span", { text: "APPLICA." }),
        element("span", { className: "title-accent", text: "DIMOSTRA." })
      ]),
      element("p", { className: "hero-lead", text: "Non una cartella di dispense. Un ambiente vivo che trasforma conoscenza, pratica e verifica in competenza reale." }),
      element("div", { className: "hero-actions" }, [
        element("a", { className: "button primary magnetic", text: "Entra nei percorsi ↗", href: "#/paths" }),
        element("a", { className: "button quiet", text: recentLesson ? `Continua ${recentLesson.id}` : "Continua SMM-01", href: continueHref })
      ]),
      element("div", { className: "hero-status" }, [
        element("span", { className: "status-dot" }),
        element("span", { text: recentLesson ? `Ultima sessione · ${recentLesson.id}` : "Sistema pronto · SMM-01" })
      ])
    ]),
    element("a", { className: "scroll-cue", href: "#home-paths", attrs: { "aria-label": "Scorri ai percorsi" } }, [
      element("span", { text: "SCROLL" }), element("i")
    ])
  ]);

  const cards = element("div", { className: "path-preview cinematic-grid" }, PATHS.map((path, index) =>
    element("a", { className: `preview-card accent-${path.accent}`, href: `#/paths/${path.id}`, attrs: { "data-reveal": "" } }, [
      element("div", { className: "card-sheen" }),
      element("span", { className: "card-index", text: String(index + 1).padStart(2, "0") }),
      element("span", { className: "card-code", text: path.code }),
      element("h2", { text: path.title }),
      element("p", { text: path.description }),
      element("div", { className: "card-footer" }, [
        element("span", { className: "card-meta", text: path.lessons.length ? `${path.lessons.length} lezione disponibile` : "In preparazione" }),
        element("span", { className: "card-arrow", text: "↗" })
      ])
    ])
  ));

  section.append(hero, element("section", { className: "home-paths", attrs: { id: "home-paths" } }, [
    element("div", { className: "section-heading split-heading", attrs: { "data-reveal": "" } }, [
      element("div", {}, [element("p", { className: "eyebrow", text: "I TUOI PERCORSI" }), element("h2", { text: "Impara per livelli. Cresci per prove." })]),
      element("p", { className: "section-manifesto", text: "Ogni percorso collega teoria, applicazione, recupero attivo e valutazione. Quello che studi deve diventare qualcosa che sai usare." })
    ]), cards
  ]));

  queueMicrotask(() => decorateHomeMotion(section));
  return section;
}
