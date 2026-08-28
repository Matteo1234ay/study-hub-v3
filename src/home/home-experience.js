function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function resolveHomeMotionMode({ preference, mediaReduced, width, webgl }) {
  if (!webgl) return "dom";
  if (preference === "reduced" || mediaReduced) return "static-3d";
  return "cinematic";
}

export async function mountHomeExperience(root, { stations = [], navigate } = {}) {
  if (!root?.isConnected || !Array.isArray(stations) || stations.length === 0) {
    return () => {};
  }

  root.dataset.homeState = "fallback";
  root.dataset.journeyStarted = "false";
  const canvas = root.querySelector(".study-room-canvas");
  const mediaReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const webgl = typeof WebGL2RenderingContext !== "undefined";
  const mode = resolveHomeMotionMode({
    preference: document.documentElement.dataset.motion ?? "system",
    mediaReduced,
    width: innerWidth,
    webgl
  });

  function syncImmersiveChrome() {
    if (mode === "cinematic" && innerWidth <= 760) document.body.dataset.homeImmersive = "true";
    else delete document.body.dataset.homeImmersive;
  }

  if (mode === "dom") {
    root.dataset.homeState = "dom";
    delete document.body.dataset.homeImmersive;
    return () => {};
  }
  syncImmersiveChrome();

  const reducedMotion = mode === "static-3d";
  let disposed = false;
  let frameId = 0;
  let transitionManager = null;
  let renderer = null;
  const removalObserver = new MutationObserver(() => {
    if (!root.isConnected) cleanup();
  });
  removalObserver.observe(document.documentElement, { childList: true, subtree: true });
  const { createStudyRoomRenderer } = await import("./scene/study-room-renderer.js?v=20260828-19");
  if (disposed || !root.isConnected) {
    cleanup();
    return cleanup;
  }
  const { createHomeTransitionManager } = await import("./home-transition-manager.js?v=20260828-19");
  if (disposed || !root.isConnected) {
    cleanup();
    return cleanup;
  }
  const captions = [...root.querySelectorAll("[data-station-id]")];
  const progressMeter = root.querySelector(".home-progress progress");
  const go = typeof navigate === "function"
    ? navigate
    : href => { location.hash = href.slice(1); };
  let warned = false;
  function useDomFallback(error) {
    if (disposed) return;
    root.dataset.homeState = "dom";
    delete document.body.dataset.homeImmersive;
    renderer?.dispose();
    if (!warned) {
      warned = true;
      console.warn("La stanza 3D non è disponibile; la navigazione resta completa.", error);
    }
  }
  try {
    renderer = await createStudyRoomRenderer({
      canvas,
      stations,
      reducedMotion,
      onFailure: useDomFallback,
      onActivate(id) {
        const station = stations.find(item => item.id === id);
        if (station) transitionManager?.activate(station);
      }
    });
    if (disposed || !root.isConnected) {
      renderer.dispose();
      renderer = null;
      cleanup();
      return cleanup;
    }
  } catch (error) {
    if (disposed || !root.isConnected) {
      cleanup();
      return cleanup;
    }
    useDomFallback(error);
    return () => {};
  }
  transitionManager = createHomeTransitionManager({
    root,
    renderer,
    navigate: go,
    reducedMotion
  });

  function onStationClick(event) {
    const anchor = event.target.closest?.("a[data-station-id]");
    if (!anchor || event.button !== 0 || event.defaultPrevented
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || anchor.target === "_blank") return;
    const station = stations.find(item => item.id === anchor.dataset.stationId);
    if (!station) return;
    event.preventDefault();
    transitionManager.activate(station);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") transitionManager.cancel();
  }

  function setActive(progress) {
    const activeId = reducedMotion ? "desk" : renderer.getActiveStation(progress);
    if (progressMeter) progressMeter.value = Math.round(clamp01(progress) * 100);
    root.dataset.activeStation = activeId;
    root.dataset.journeyStarted = progress > .025 ? "true" : "false";
    captions.forEach(caption => caption.classList.toggle("is-active", caption.dataset.stationId === activeId));
  }

  function updateJourney() {
    frameId = 0;
    if (disposed || !root.isConnected) return;
    const rect = root.getBoundingClientRect();
    const distance = Math.max(1, root.offsetHeight - innerHeight);
    const progress = reducedMotion ? 1 : clamp01(-rect.top / distance);
    setActive(progress);
    renderer.setJourney(progress);
  }

  function onScroll() {
    if (!frameId) frameId = requestAnimationFrame(updateJourney);
  }

  function onResize() {
    syncImmersiveChrome();
    onScroll();
  }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize, { passive: true });
  root.addEventListener("click", onStationClick);
  addEventListener("keydown", onKeyDown);
  root.dataset.homeState = mode === "static-3d" ? "static-3d" : "ready";
  updateJourney();

  function cleanup() {
    if (disposed) return;
    disposed = true;
    if (frameId) cancelAnimationFrame(frameId);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onResize);
    root.removeEventListener("click", onStationClick);
    removeEventListener("keydown", onKeyDown);
    removalObserver.disconnect();
    transitionManager?.dispose();
    renderer?.dispose();
    delete document.body.dataset.homeImmersive;
  }

  return cleanup;
}