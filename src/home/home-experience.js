import { createCinematicRouteState } from "./home-route-state.js?v=20260901-30";
import { createSharedPathsTransition } from "./home-shared-transition.js?v=20260901-30";

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function smoothRange(value, start, end) {
  const t = clamp01((clamp01(value) - start) / Math.max(.0001, end - start));
  return t * t * (3 - 2 * t);
}

const JOURNEY_EXIT_TRIGGER = .995;

export function resolveJourneyLayout(width = 1440) {
  const mobile = Number(width) <= 760;
  const contentVh = mobile ? 1100 : 600;
  const exitVh = mobile ? 180 : 140;
  const totalVh = contentVh + exitVh;
  return { contentVh, exitVh, totalVh, contentEnd: contentVh / totalVh };
}

export function resolveExitChoreography(exitProgress) {
  const progress = clamp01(exitProgress);
  return {
    establish: smoothRange(progress, 0, .2),
    dolly: smoothRange(progress, .18, .88),
    handoff: smoothRange(progress, .82, 1)
  };
}

export function resolveJourneyPhases(progress, width = 1440) {
  const rawProgress = clamp01(progress);
  const { contentEnd } = resolveJourneyLayout(width);
  const exitProgress = clamp01((rawProgress - contentEnd) / (1 - contentEnd));
  const choreography = resolveExitChoreography(exitProgress);
  return {
    rawProgress,
    sceneProgress: clamp01(rawProgress / contentEnd),
    exitProgress,
    choreography,
    shouldExit: rawProgress >= JOURNEY_EXIT_TRIGGER && choreography.handoff >= .9
  };
}

export function resolveScrollVelocity({ deltaProgress = 0, deltaMs = 16 } = {}) {
  const seconds = Math.max(.016, (Number(deltaMs) || 16) / 1000);
  return Math.min(6, Math.abs(Number(deltaProgress) || 0) / seconds);
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

function rendererErrorCode(error) {
  const message = String(error?.message ?? error ?? "").toLowerCase();
  if (message.includes("timeout")) return "timeout";
  if (message.includes("webgl") || message.includes("contesto")) return "webgl";
  return "load";
}

export async function mountHomeExperience(root, { stations = [], navigate } = {}) {
  if (!root?.isConnected || !Array.isArray(stations) || stations.length === 0) {
    return () => {};
  }

  root.dataset.homeState = "preparing";
  root.dataset.homeRenderer = "poster";
  delete root.dataset.homeRendererError;
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
    root.dataset.homeRenderer = "poster";
    root.dataset.homeRendererError = "webgl";
    delete document.body.dataset.homeImmersive;
    document.body.querySelector?.(".paths-shared-portal")?.remove?.();
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
  let previousRawProgress = null;
  let previousProgressTime = null;
  const sharedTransition = createSharedPathsTransition({
    documentTarget: document,
    reducedMotion,
    create: false
  });
  const removalObserver = new MutationObserver(() => {
    if (!root.isConnected) cleanup();
  });
  removalObserver.observe(document.documentElement, { childList: true, subtree: true });
  const { createStudyRoomRenderer } = await import("./scene/study-room-renderer.js?v=20260901-30");
  if (disposed || !root.isConnected) {
    cleanup();
    return cleanup;
  }
  const { createHomeTransitionManager } = await import("./home-transition-manager.js?v=20260901-30");
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
    root.dataset.homeRenderer = "poster";
    root.dataset.homeRendererError = rendererErrorCode(error);
    delete document.body.dataset.homeImmersive;
    sharedTransition.finishReverse?.();
    renderer?.dispose();
    if (!warned) {
      warned = true;
      console.warn("La scena V30 non è disponibile; il poster e la navigazione restano completi.", error);
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
    const audit = renderer.getAudit?.();
    if (audit?.heroMode !== "v30") throw new Error("Renderer V30 non verificato al primo frame");
    root.dataset.homeRenderer = "webgl-v30";
    delete root.dataset.homeRendererError;
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

  function setActive(sceneProgress, rawProgress, presentation = null) {
    const activeId = presentation?.stationId ?? renderer.getActiveStation(sceneProgress);
    if (progressMeter) progressMeter.value = Math.round(clamp01(rawProgress) * 100);
    root.dataset.activeStation = activeId;
    root.dataset.journeyStarted = rawProgress > .025 ? "true" : "false";
    captions.forEach(caption => caption.classList.toggle("is-active", caption.dataset.stationId === activeId));
  }

  function updateSharedHandoff(phases) {
    const sourceRect = renderer.getPathsProjection?.();
    if (!sourceRect) return;
    if (resume) {
      const { contentEnd } = resolveJourneyLayout(innerWidth);
      const resumeProgress = Math.max(contentEnd + .001, Number(resume.resumeProgress) || .97);
      const reverseProgress = restoring || reentryLocked
        ? 1
        : clamp01((phases.rawProgress - contentEnd) / Math.max(.001, resumeProgress - contentEnd));
      sharedTransition.update({ sourceRect, progress: reverseProgress });
      if (!restoring && !reentryLocked && reverseProgress <= .01) sharedTransition.finishReverse();
      return;
    }
    if (phases.choreography.handoff > 0) {
      sharedTransition.update({ sourceRect, progress: phases.choreography.handoff });
    }
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
      sharedPortal: sharedTransition
    })).then(started => {
      if (!started && !disposed) {
        exitTriggered = false;
        routeState.clear();
        sharedTransition.dispose();
      }
    });
  }

  function updateJourney() {
    frameId = 0;
    if (disposed || !root.isConnected) return;
    const rect = root.getBoundingClientRect();
    const distance = Math.max(1, root.offsetHeight - innerHeight);
    const phases = resolveJourneyPhases(-rect.top / distance, innerWidth);
    const now = performance.now();
    const scrollVelocity = previousRawProgress == null || previousProgressTime == null
      ? 0
      : resolveScrollVelocity({
        deltaProgress: phases.rawProgress - previousRawProgress,
        deltaMs: now - previousProgressTime
      });
    previousRawProgress = phases.rawProgress;
    previousProgressTime = now;
    reentryLocked = resolveReentryLock({
      locked: reentryLocked,
      restoring,
      resumeProgress: resume?.resumeProgress ?? 0,
      rawProgress: phases.rawProgress
    });
    const presentation = renderer.getPresentationState?.(phases.sceneProgress, { scrollVelocity }) ?? null;
    setActive(phases.sceneProgress, phases.rawProgress, presentation);
    renderer.setJourney(phases.sceneProgress, { scrollVelocity });
    renderer.setExitProgress?.(phases.exitProgress);
    if (presentation) root.dataset.homePhase = presentation.phase;
    updateSharedHandoff(phases);
    root.dataset.homeExit = phases.exitProgress > .01 ? "true" : "false";
    root.dataset.homeExitPhase = phases.choreography.handoff > 0
      ? "handoff"
      : phases.choreography.dolly > 0
        ? "dolly"
        : phases.choreography.establish > 0
          ? "establish"
          : "none";
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
        previousRawProgress = null;
        previousProgressTime = null;
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
    sharedTransition.dispose();
    renderer?.dispose();
    delete document.body.dataset.homeImmersive;
  }

  return cleanup;
}
