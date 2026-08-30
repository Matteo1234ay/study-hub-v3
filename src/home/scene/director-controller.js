const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smooth(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function findWindow(windows, progress) {
  const value = clamp01(progress);
  return windows.find((window, index) => {
    const last = index === windows.length - 1;
    return value >= window.enter && (last ? value <= window.releaseEnd : value < window.releaseEnd);
  }) ?? windows.at(-1);
}

export function createDirectorController({ timeline, layout = "desktop" } = {}) {
  if (!timeline?.stationWindows) throw new Error("La regia richiede una timeline con finestre semantiche");
  const windows = timeline.stationWindows();
  if (!Array.isArray(windows) || windows.length === 0) throw new Error("La regia richiede almeno una stazione");

  function sample(progress, { scrollVelocity = 0 } = {}) {
    const value = clamp01(progress);
    const window = findWindow(windows, value);
    let phase = "read";
    let phaseProgress = 1;
    let readStrength = 1;

    if (value < window.readStart) {
      phase = "approach";
      phaseProgress = clamp01((value - window.enter) / Math.max(.0001, window.readStart - window.enter));
      readStrength = smooth(phaseProgress);
    } else if (value > window.readEnd) {
      phase = "release";
      phaseProgress = clamp01((value - window.readEnd) / Math.max(.0001, window.releaseEnd - window.readEnd));
      readStrength = 1 - smooth(phaseProgress);
    } else {
      phaseProgress = clamp01((value - window.readStart) / Math.max(.0001, window.readEnd - window.readStart));
    }

    const velocity = Math.min(6, Math.abs(Number(scrollVelocity) || 0));
    const velocityScale = Math.max(.3, 1 - velocity / 8);

    return {
      stationId: window.stationId,
      phase,
      phaseProgress,
      readStrength: clamp01(readStrength),
      captionStrength: phase === "read" ? .45 : .9,
      motionScale: Math.max(.55, velocityScale),
      parallaxScale: clamp01(velocityScale * (phase === "read" ? .65 : 1)),
      lightingScale: phase === "read" ? .9 : 1,
      layout
    };
  }

  return { sample };
}
