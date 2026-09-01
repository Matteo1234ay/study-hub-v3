import { PATHS } from "../config/paths.js?v=20260901-27";
import { element, pageHeader } from "../ui/components.js?v=20260901-27";
import { createCinematicRouteState } from "../home/home-route-state.js?v=20260901-29";
import { createPathsReturnController } from "../home/paths-return-controller.js?v=20260901-29";
import { createSharedPathsTransition } from "../home/home-shared-transition.js?v=20260901-29";

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
    const mediaReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionPreference = document.documentElement.dataset.motion ?? "system";
    const sharedTransition = createSharedPathsTransition({
      documentTarget: root.ownerDocument ?? document,
      reducedMotion: motionPreference === "reduced" || mediaReduced,
      create: false
    });
    const controller = createPathsReturnController({
      routeState: createCinematicRouteState(),
      navigate,
      sharedTransition
    });
    if (!controller.active) {
      sharedTransition.dispose();
      return;
    }
    sharedTransition.receive(root);
    root.dataset.cinematicEntry = "true";
    const observer = new MutationObserver(() => {
      if (root.isConnected) return;
      controller.dispose();
      if (sharedTransition.element?.dataset?.direction === "reverse") sharedTransition.dispose();
      else sharedTransition.finishReverse();
      observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
  return root;
}