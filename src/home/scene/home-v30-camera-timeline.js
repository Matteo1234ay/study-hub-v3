const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smooth(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function mixNumber(from, to, amount) {
  return from + (to - from) * clamp01(amount);
}

function mixVector(from, to, amount) {
  const t = clamp01(amount);
  return from.map((value, index) => value + (to[index] - value) * t);
}

function snapshot(shot, settled = true) {
  return {
    position: [...shot.position],
    target: [...shot.target],
    fov: shot.fov,
    stationId: shot.stationId,
    settled,
    monitorVisible: shot.stationId === "desk",
    chairClearance: shot.chairClearance ?? 1
  };
}

function blendShot(from, to, amount, stationId = null, phase = null) {
  const t = smooth(amount);
  return {
    position: mixVector(from.position, to.position, t),
    target: mixVector(from.target, to.target, t),
    fov: mixNumber(from.fov, to.fov, t),
    stationId: stationId ?? (t < .64 ? from.stationId : to.stationId),
    settled: false,
    monitorVisible: (stationId ?? from.stationId) === "desk" && t < .72,
    chairClearance: mixNumber(from.chairClearance ?? 1, to.chairClearance ?? 1, t),
    ...(phase ? { phase } : {})
  };
}

// V30 is intentionally photographed from *inside* the authored Blender room.
// The previous high exterior coordinates exposed the floor/wall cutaway and made
// the scene read like a dollhouse. These shots stay at human eye height and use
// nearby foreground objects to create the close, tactile editorial feel.
const DESKTOP_SHOTS = Object.freeze([
  Object.freeze({ stationId: "desk", settleStart: 0, settleEnd: .105, position: [3.55, 2.45, 4.45], target: [0.0, 1.45, -.15], fov: 42, chairClearance: 1.08 }),
  Object.freeze({ stationId: "memory", settleStart: .205, settleEnd: .29, position: [-1.20, 2.12, 2.45], target: [-2.58, 1.34, -1.72], fov: 40, chairClearance: 1.06 }),
  Object.freeze({ stationId: "social", settleStart: .37, settleEnd: .455, position: [2.85, 2.18, 2.25], target: [1.05, 1.58, -1.72], fov: 40, chairClearance: 1.06 }),
  Object.freeze({ stationId: "assessment", settleStart: .53, settleEnd: .615, position: [2.25, 1.82, 1.70], target: [1.02, .92, -.30], fov: 39, chairClearance: 1.04 }),
  Object.freeze({ stationId: "progress", settleStart: .685, settleEnd: .765, position: [-.95, 2.20, 1.98], target: [-.55, 2.18, -2.55], fov: 39, chairClearance: 1.04 }),
  Object.freeze({ stationId: "future-paths", settleStart: .845, settleEnd: 1, position: [1.42, 2.28, 2.05], target: [.35, 2.25, -2.72], fov: 37, chairClearance: 1.02 })
]);

const MOBILE_SHOTS = Object.freeze([
  Object.freeze({ stationId: "desk", settleStart: 0, settleEnd: .105, position: [3.90, 2.75, 5.55], target: [0.0, 1.48, -.18], fov: 55, chairClearance: 1.12 }),
  Object.freeze({ stationId: "memory", settleStart: .205, settleEnd: .29, position: [-1.32, 2.48, 3.42], target: [-2.52, 1.42, -1.70], fov: 53, chairClearance: 1.10 }),
  Object.freeze({ stationId: "social", settleStart: .37, settleEnd: .455, position: [3.15, 2.55, 3.25], target: [1.10, 1.62, -1.72], fov: 53, chairClearance: 1.10 }),
  Object.freeze({ stationId: "assessment", settleStart: .53, settleEnd: .615, position: [2.60, 2.22, 2.82], target: [1.05, 1.02, -.34], fov: 52, chairClearance: 1.08 }),
  Object.freeze({ stationId: "progress", settleStart: .685, settleEnd: .765, position: [-1.15, 2.58, 2.95], target: [-.55, 2.18, -2.55], fov: 52, chairClearance: 1.08 }),
  Object.freeze({ stationId: "future-paths", settleStart: .845, settleEnd: 1, position: [1.55, 2.68, 3.25], target: [.35, 2.28, -2.72], fov: 50, chairClearance: 1.06 })
]);

const DESKTOP_EXIT = Object.freeze([
  Object.freeze({ position: [1.42, 2.28, 2.05], target: [.35, 2.25, -2.72], fov: 37 }),
  Object.freeze({ position: [1.02, 2.20, .65], target: [.35, 2.28, -2.82], fov: 34 }),
  Object.freeze({ position: [.48, 2.18, -1.05], target: [.35, 2.30, -2.92], fov: 31 })
]);

const MOBILE_EXIT = Object.freeze([
  Object.freeze({ position: [1.55, 2.68, 3.25], target: [.35, 2.28, -2.72], fov: 50 }),
  Object.freeze({ position: [1.05, 2.48, 1.35], target: [.35, 2.30, -2.82], fov: 47 }),
  Object.freeze({ position: [.52, 2.35, -.55], target: [.35, 2.32, -2.92], fov: 44 })
]);

export function createHomeV30CameraTimeline({ layout = "desktop" } = {}) {
  const selectedShots = layout === "mobile" ? MOBILE_SHOTS : DESKTOP_SHOTS;
  const exitShots = layout === "mobile" ? MOBILE_EXIT : DESKTOP_EXIT;

  function sample(progress) {
    const value = clamp01(progress);
    const settled = selectedShots.find(shot => value >= shot.settleStart && value <= shot.settleEnd);
    if (settled) return snapshot(settled, true);
    if (value <= selectedShots[0].settleStart) return snapshot(selectedShots[0], true);

    for (let index = 0; index < selectedShots.length - 1; index += 1) {
      const current = selectedShots[index];
      const next = selectedShots[index + 1];
      if (value > current.settleEnd && value < next.settleStart) {
        const amount = (value - current.settleEnd) / Math.max(.0001, next.settleStart - current.settleEnd);
        return blendShot(current, next, amount);
      }
    }
    return snapshot(selectedShots.at(-1), true);
  }

  function exit(progress) {
    const value = clamp01(progress);
    if (value < .55) return blendShot(exitShots[0], exitShots[1], value / .55, "future-paths", "establish");
    return blendShot(exitShots[1], exitShots[2], (value - .55) / .45, "future-paths", "handoff");
  }

  function activeStation(progress) {
    return sample(progress).stationId;
  }

  function stationProgress(stationId) {
    const shot = selectedShots.find(item => item.stationId === stationId);
    return shot ? (shot.settleStart + shot.settleEnd) / 2 : 0;
  }

  function stationWindows() {
    return selectedShots.map((shot, index) => {
      const previous = selectedShots[index - 1];
      const next = selectedShots[index + 1];
      return {
        stationId: shot.stationId,
        enter: previous ? previous.settleEnd + (shot.settleStart - previous.settleEnd) * .45 : 0,
        readStart: shot.settleStart,
        readEnd: shot.settleEnd,
        releaseEnd: next ? shot.settleEnd + (next.settleStart - shot.settleEnd) * .55 : 1
      };
    });
  }

  function overview() {
    return snapshot(selectedShots[0], true);
  }

  return { sample, exit, activeStation, stationProgress, stationWindows, overview, layout };
}
