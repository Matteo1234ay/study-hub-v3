function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function smooth(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function rectValue(rect, key, fallback = 0) {
  const value = Number(rect?.[key]);
  return Number.isFinite(value) ? value : fallback;
}

function interpolate(from, to, progress) {
  return from + (to - from) * smooth(progress);
}

function findPortal(documentTarget) {
  return documentTarget?.body?.querySelector?.(".paths-shared-portal") ?? null;
}

export function shouldPreserveCinematicScroll(documentTarget = globalThis.document) {
  const phase = findPortal(documentTarget)?.dataset?.phase;
  return phase === "committed" || phase === "reversing";
}

function createPortal(documentTarget) {
  if (!documentTarget?.body?.append || !documentTarget?.createElement) return null;
  const element = documentTarget.createElement("div");
  element.className = "paths-shared-portal";
  element.dataset.direction = "forward";
  element.dataset.phase = "tracking";
  element.setAttribute?.("aria-hidden", "true");
  documentTarget.body.append(element);
  return element;
}

export function createSharedPathsTransition({
  documentTarget = globalThis.document,
  reducedMotion = false,
  create = true
} = {}) {
  let element = findPortal(documentTarget);
  let committed = element?.dataset?.phase === "committed" || element?.dataset?.phase === "received";
  let reverseStarted = element?.dataset?.direction === "reverse";
  let lastSourceRect = null;

  function ensure(force = false) {
    if (!element) element = findPortal(documentTarget);
    if (!element && (create || force)) element = createPortal(documentTarget);
    if (element) element.dataset.reducedMotion = reducedMotion ? "true" : "false";
    return element;
  }

  function viewportRect() {
    const view = documentTarget?.defaultView ?? globalThis;
    return {
      left: 0,
      top: 0,
      width: Math.max(1, Number(view?.innerWidth) || 1),
      height: Math.max(1, Number(view?.innerHeight) || 1)
    };
  }

  function writeGeometry(node, sourceRect, progress) {
    const viewport = viewportRect();
    const source = {
      left: rectValue(sourceRect, "left"),
      top: rectValue(sourceRect, "top"),
      width: Math.max(1, rectValue(sourceRect, "width", viewport.width)),
      height: Math.max(1, rectValue(sourceRect, "height", viewport.height))
    };
    const amount = reducedMotion ? 1 : clamp01(progress);
    const left = interpolate(source.left, viewport.left, amount);
    const top = interpolate(source.top, viewport.top, amount);
    const width = interpolate(source.width, viewport.width, amount);
    const height = interpolate(source.height, viewport.height, amount);
    node.style?.setProperty?.("--paths-portal-left", `${left}px`);
    node.style?.setProperty?.("--paths-portal-top", `${top}px`);
    node.style?.setProperty?.("--paths-portal-width", `${width}px`);
    node.style?.setProperty?.("--paths-portal-height", `${height}px`);
    node.style?.setProperty?.("--paths-portal-progress", String(clamp01(progress)));
    node.style?.setProperty?.("--paths-portal-opacity", String(reducedMotion ? clamp01(progress) : 1));
  }

  return {
    get element() { return ensure(false); },
    update({ sourceRect, progress = 0 } = {}) {
      if (sourceRect) lastSourceRect = { ...sourceRect };
      const source = sourceRect ?? lastSourceRect;
      if (!source) return false;
      const node = ensure(true);
      if (!node) return false;
      node.dataset.direction = reverseStarted ? "reverse" : "forward";
      if (!committed && !reverseStarted) node.dataset.phase = "tracking";
      writeGeometry(node, source, progress);
      return true;
    },
    commit() {
      const node = ensure(false);
      if (!node) return false;
      committed = true;
      reverseStarted = false;
      node.dataset.phase = "committed";
      node.dataset.direction = "forward";
      node.style?.setProperty?.("--paths-portal-opacity", "1");
      return true;
    },
    receive(root) {
      const node = ensure(false);
      if (!node || (node.dataset.phase !== "committed" && node.dataset.phase !== "received")) return false;
      committed = true;
      node.dataset.phase = "received";
      node.style?.setProperty?.("--paths-portal-opacity", "0");
      root?.classList?.add?.("paths-cinematic-receiver");
      if (root?.dataset) root.dataset.cinematicEntry = "true";
      return true;
    },
    beginReverse() {
      const node = ensure(false);
      if (!node || reverseStarted) return false;
      reverseStarted = true;
      committed = true;
      node.dataset.direction = "reverse";
      node.dataset.phase = "reversing";
      node.style?.setProperty?.("--paths-portal-opacity", "1");
      node.style?.setProperty?.("--paths-portal-progress", "1");
      return true;
    },
    finishReverse() {
      const node = ensure(false);
      if (!node) return false;
      committed = false;
      reverseStarted = false;
      node.remove?.();
      element = null;
      return true;
    },
    dispose() {
      const node = ensure(false);
      if (!node) return;
      if (committed || node.dataset.phase === "committed" || node.dataset.phase === "received" || node.dataset.phase === "reversing") return;
      node.remove?.();
      element = null;
    }
  };
}
