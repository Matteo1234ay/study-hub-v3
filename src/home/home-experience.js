import { createCinematicRouteState } from "./home-route-state.js?v=20260829-23";

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

const JOURNEY_EXIT_TRIGGER = .995;

export function resolveJourneyLayout(width = 1440) {
  const mobile = Number(width) <= 760;
  const contentVh = mobile ? 1100 : 600;
  const exitVh = mobile ? 180 : 140;
  const totalVh = contentVh + exitVh;
  return { contentVh, exitVh, totalVh, contentEnd: contentVh / totalVh };
}

export function resolveJourneyPhases(progress, width = 1440) {
  const rawProgress = clamp01(progress);
  const { contentEnd } = resolveJourneyLayout(width);
  return {
    rawProgress,
    sceneProgress: clamp01(rawProgress / contentEnd),
    exitProgress: clamp01((rawProgress - contentEnd) / (1 - contentEnd)),
    shouldExit: rawProgress >= JOURNEY_EXIT_TRIGGER
  };
}

export function resolveReentryLock({ locked, restoring, resumeProgress, rawProgress }) {
  if (!locked || restoring) return Boolean(locked);
  const delta = Number(rawProgress) - Number(resumeProgress);
  return delta >= -.01 && delta <= .015;
}

export function resolveHomeMotionMode({ preference, mediaReduced, width, webgl }) {
  if (!webgl) return "dom";
  return "cinematic";
}

export async function mountHomeExperience(root, { stations = [], navigate } = {}) {
  if (!root?.isConnected || !Array.isArray(stations) || stations.length === 0) {
    return () => {};
  }

  root.dataset.homeState = "preparing";
  root.dataset.journeyStarted = "false";
  root.dataset.homeExit = "false";
  const routeState = createCinematicRouteState();
  const resume = routeState.consumeHomeResume();
  const canvas = root.querySelector(".study-room-canvas");
  const mediaReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionPreference = document.documentElement.dataset.motion ?? "system";
  const reducedMotion = motionPreference === "reduced" || mediaReduced;
  const webgl = typeof WebGL2RenderingContext !== "undefined";
  const mode = resolveHomeMotionMode({
    preference: motionPreference,
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

  let disposed = false;
  let frameId = 0;
  let transitionManager = null;
  let renderer = null;
  let exitTriggered = false;
  let restoring = Boolean(resume);
  let reentryLocked = Boolean(resume);
  let restoreFrameId = 0;
  let restoreReleaseFrameId = 0;
  const removalObserver = new MutationObserver(() => {
    if (!root.isConnected) cleanup();
  });
  removalObserver.observe(document.documentElement, { childList: true, subtree: true });
  const { createStudyRoomRenderer } = await import("./scene/study-room-renderer.js?v=20260829-23");
  if (disposed || !root.isConnected) {
    cleanup();
    return cleanup;
  }
  const { createHomeTransitionManager } = await import("./home-transition-manager.js?v=20260829-23");
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
    await renderer.ready;
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

  function setActive(sceneProgress, rawProgress) {
    const activeId = renderer.getActiveStation(sceneProgress);
    if (progressMeter) progressMeter.value = Math.round(clamp01(rawProgress) * 100);
    root.dataset.activeStation = activeId;
    root.dataset.journeyStarted = rawProgress > .025 ? "true" : "false";
    captions.forEach(caption => caption.classList.toggle("is-active", caption.dataset.stationId === activeId));
  }

  function beginAutomaticExit() {
    if (exitTriggered || disposed || reentryLocked || restoring) return;
    const pathsStation = stations.find(item => item.id === "future-paths") ?? {
      id: "future-paths",
      href: "#/paths"
    };
    exitTriggered = true;
    routeState.markExit({ resumeProgress: .97 });
    Promise.resolve(transitionManager.activate(pathsStation, {
      focus: false,
      overlay: false,
      viewTransition: true
    })).then(started => {
      if (!started && !disposed) {
        exitTriggered = false;
        routeState.clear();
      }
    });
  }

  function updateJourney() {
    frameId = 0;
    if (disposed || !root.isConnected) return;
    const rect = root.getBoundingClientRect();
    const distance = Math.max(1, root.offsetHeight - innerHeight);
    const phases = resolveJourneyPhases(-rect.top / distance, innerWidth);
    reentryLocked = resolveReentryLock({
      locked: reentryLocked,
      restoring,
      resumeProgress: resume?.resumeProgress ?? 0,
      rawProgress: phases.rawProgress
    });
    setActive(phases.sceneProgress, phases.rawProgress);
    renderer.setJourney(phases.sceneProgress);
    renderer.setExitProgress?.(phases.exitProgress);
    root.dataset.homeExit = phases.exitProgress > .01 ? "true" : "false";
    if (phases.shouldExit && !reentryLocked && !restoring) beginAutomaticExit();
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
  root.dataset.homeState = "ready";
  root.dataset.reducedMotion = reducedMotion ? "true" : "false";
  updateJourney();
  if (resume) {
    restoreFrameId = requestAnimationFrame(() => {
      const pageTop = scrollY + root.getBoundingClientRect().top;
      const distance = Math.max(1, root.offsetHeight - innerHeight);
      scrollTo({ top: pageTop + distance * resume.resumeProgress, behavior: "auto" });
      restoreReleaseFrameId = requestAnimationFrame(() => {
        restoring = false;
        updateJourney();
      });
    });
  }

  function cleanup() {
    if (disposed) return;
    disposed = true;
    if (frameId) cancelAnimationFrame(frameId);
    if (restoreFrameId) cancelAnimationFrame(restoreFrameId);
    if (restoreReleaseFrameId) cancelAnimationFrame(restoreReleaseFrameId);
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
