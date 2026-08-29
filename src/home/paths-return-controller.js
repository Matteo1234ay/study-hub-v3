const WHEEL_THRESHOLD = 42;
const TOUCH_THRESHOLD = 56;

export function createPathsReturnController({
  routeState,
  navigate,
  windowTarget = globalThis,
  top = () => Number(windowTarget.scrollY ?? windowTarget.document?.documentElement?.scrollTop ?? 0)
} = {}) {
  const entry = routeState?.consumePathsEntry?.();
  if (!entry || typeof navigate !== "function") return { active: false, dispose() {} };

  let active = true;
  let wheelDistance = 0;
  let touchStart = null;

  function dispose() {
    if (!active) return;
    active = false;
    windowTarget.removeEventListener?.("wheel", onWheel);
    windowTarget.removeEventListener?.("touchstart", onTouchStart);
    windowTarget.removeEventListener?.("touchmove", onTouchMove);
  }

  function restoreHome() {
    if (!active || top() > 4) return false;
    routeState.markReturn?.({ resumeProgress: entry.resumeProgress });
    dispose();
    navigate("#/home");
    return true;
  }

  function onWheel(event) {
    if (top() > 4 || Number(event.deltaY) >= 0) {
      wheelDistance = 0;
      return;
    }
    wheelDistance += Math.abs(Number(event.deltaY) || 0);
    if (wheelDistance >= WHEEL_THRESHOLD) restoreHome();
  }

  function onTouchStart(event) {
    touchStart = top() <= 4 ? Number(event.touches?.[0]?.clientY) : null;
  }

  function onTouchMove(event) {
    if (!Number.isFinite(touchStart) || top() > 4) return;
    const current = Number(event.touches?.[0]?.clientY);
    if (Number.isFinite(current) && current - touchStart >= TOUCH_THRESHOLD) restoreHome();
  }

  windowTarget.addEventListener?.("wheel", onWheel, { passive: true });
  windowTarget.addEventListener?.("touchstart", onTouchStart, { passive: true });
  windowTarget.addEventListener?.("touchmove", onTouchMove, { passive: true });

  return {
    get active() { return active; },
    dispose
  };
}
