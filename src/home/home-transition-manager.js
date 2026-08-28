export function normalizeTransitionDuration(value = 650) {
  return Math.min(900, Math.max(400, Number(value) || 650));
}

function defaultWait(milliseconds, signal) {
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

function abortSignal(signal) {
  return new Promise(resolve => signal.addEventListener("abort", resolve, { once: true }));
}

export function createHomeTransitionManager({
  root,
  renderer,
  navigate,
  reducedMotion = false,
  duration = 650,
  wait = defaultWait
}) {
  const transitionDuration = normalizeTransitionDuration(duration);
  let active = null;
  let disposed = false;

  function navigateOnce(record) {
    if (record.navigated) return;
    record.navigated = true;
    navigate(record.station.href);
  }

  function showOverlay(record) {
    const source = root.querySelector(`[data-station-id="${record.station.id}"]`);
    if (!source) return;
    const overlay = source.cloneNode(true);
    overlay.classList.add("home-route-overlay");
    overlay.dataset.stationId = record.station.id;
    const append = () => root.ownerDocument.body.append(overlay);
    try {
      const transition = root.ownerDocument.startViewTransition?.(append);
      if (!transition) append();
    } catch {
      append();
    }
    record.overlay = overlay;
  }

  async function activate(station) {
    if (disposed || active || !station?.href?.startsWith("#/")) return false;
    const record = {
      station,
      controller: new AbortController(),
      navigated: false,
      overlay: null
    };
    active = record;
    root.dataset.homeTransition = station.id;
    try {
      if (reducedMotion) {
        navigateOnce(record);
        await Promise.resolve();
        return true;
      }
      try {
        await Promise.race([
          Promise.resolve(renderer?.focusStation?.(station.id, { duration: transitionDuration })),
          abortSignal(record.controller.signal),
          wait(900, record.controller.signal)
        ]);
      } catch {
        // Rendering failure must never trap navigation.
      }
      if (record.controller.signal.aborted) return true;
      showOverlay(record);
      await wait(120, record.controller.signal);
      navigateOnce(record);
      return true;
    } finally {
      record.overlay?.remove?.();
      if (active === record) active = null;
      delete root.dataset.homeTransition;
    }
  }

  function cancel() {
    if (!active) return false;
    active.controller.abort();
    navigateOnce(active);
    active.overlay?.remove?.();
    return true;
  }

  return {
    activate,
    cancel,
    dispose() {
      disposed = true;
      if (active) active.controller.abort();
      active?.overlay?.remove?.();
      active = null;
      delete root.dataset.homeTransition;
    }
  };
}
