import { PATHS, findLesson } from "../config/paths.js?v=20260827-2";
import { element } from "../ui/components.js?v=20260827-2";
import { createStudyStore } from "../study/study-store.js?v=20260827-2";

function makeSphere() {
  return element("div", { className: "knowledge-sphere", attrs: { "aria-hidden": "true" } }, [
    element("div", { className: "sphere-aura" }),
    element("div", { className: "sphere-mesh mesh-a" }),
    element("div", { className: "sphere-mesh mesh-b" }),
    element("div", { className: "sphere-mesh mesh-c" }),
    element("div", { className: "sphere-core" }, [element("span", { text: "STUDY" }), element("strong", { text: "V3" })]),
    element("i", { className: "satellite sat-a" }), element("i", { className: "satellite sat-b" }), element("i", { className: "satellite sat-c" })
  ]);
}

function revealStop(path, index) {
  return element("a", { className: `reveal-stop accent-${path.accent}`, href: `#/paths/${path.id}` }, [
    element("span", { className: "stop-index", text: String(index + 1).padStart(2, "0") }),
    element("div", { className: "stop-copy" }, [
      element("span", { className: "stop-code", text: path.code }),
      element("h2", { text: path.title }),
      element("p", { text: path.description }),
      element("b", { text: path.lessons.length ? `${path.lessons.length} LEZIONE ATTIVA  ↗` : "IN PREPARAZIONE  ↗" })
    ])
  ]);
}

function bindJourney(root) {
  const reduced = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const stage = root.querySelector(".home-stage");
  if (!stage || reduced) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const rect = root.getBoundingClientRect();
    const travel = Math.max(1, root.offsetHeight - innerHeight);
    const journey = Math.min(1, Math.max(0, -rect.top / travel));
    root.style.setProperty("--journey", journey.toFixed(4));
    const stops = [...root.querySelectorAll(".reveal-stop")];
    stops.forEach((stop, i) => {
      const center = (i + 1) / (stops.length + 1);
      const distance = Math.abs(journey - center);
      stop.style.setProperty("--focus", Math.max(0, 1 - distance * 5).toFixed(3));
      stop.classList.toggle("is-active", distance < .105);
    });
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener("pointermove", event => {
    root.style.setProperty("--mx", ((event.clientX / innerWidth - .5) * 2).toFixed(3));
    root.style.setProperty("--my", ((event.clientY / innerHeight - .5) * 2).toFixed(3));
  }, { passive: true });
  update();
}

export function renderHomeView() {
  const last = createStudyStore().getState().lastPosition;
  const recent = last ? findLesson(last.lessonId) : null;
  const continueHref = recent ? `#/lessons/${recent.id}${last.chapterId ? `/${last.chapterId}` : ""}` : "#/lessons/SMM-01";
  const root = element("section", { className: "home-journey", attrs: { "data-motion": "scroll-3d" } });
  const stage = element("div", { className: "home-stage" }, [
    element("div", { className: "stage-noise", attrs: { "aria-hidden": "true" } }),
    element("div", { className: "stage-grid", attrs: { "aria-hidden": "true" } }),
    element("div", { className: "stage-meta meta-top", text: "STUDY HUB / PERSONAL KNOWLEDGE ENGINE" }),
    element("div", { className: "stage-meta meta-side", text: "SCROLL TO NAVIGATE / 00—04" }),
    makeSphere(),
    element("div", { className: "opening-copy" }, [
      element("p", { text: "KNOWLEDGE IS NOT A LIST." }),
      element("h1", {}, [element("span", { text: "CAPISCI." }), element("span", { text: "APPLICA." }), element("span", { text: "DIMOSTRA." })]),
      element("div", { className: "opening-actions" }, [element("a", { href: continueHref, text: recent ? `CONTINUA ${recent.id} ↗` : "INIZIA SMM-01 ↗" })])
    ]),
    element("div", { className: "reveal-world" }, PATHS.map(revealStop)),
    element("div", { className: "journey-progress", attrs: { "aria-hidden": "true" } }, [element("i"), element("span", { text: "SCROLL" })]),
    element("div", { className: "closing-copy" }, [element("span", { text: "READY TO LEARN?" }), element("a", { href: "#/paths", text: "ENTER THE SYSTEM ↗" })])
  ]);
  root.append(stage);
  queueMicrotask(() => bindJourney(root));
  return root;
}
