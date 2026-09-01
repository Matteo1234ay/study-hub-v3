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

const DESKTOP_SHOTS = Object.freeze([
  Object.freeze({ stationId: "desk", settleStart: 0, settleEnd: .105, position: [7.7, 6.15, 9.4], target: [0, 1.25, -.1], fov: 39, chairClearance: 1.08 }),
  Object.freeze({ stationId: "memory", settleStart: .205, settleEnd: .29, position: [-4.65, 3.45, 5.75], target: [-2.05, 1.52, -1.15], fov: 37, chairClearance: 1.06 }),
  Object.freeze({ stationId: "social", settleStart: .37, settleEnd: .455, position: [4.8, 3.35, 5.5], target: [2.1, 1.5, -1.2], fov: 37, chairClearance: 1.06 }),
  Object.freeze({ stationId: "assessment", settleStart: .53, settleEnd: .615, position: [3.75, 3.05, 4.35], target: [1.62, 1.25, -1.7], fov: 36, chairClearance: 1.04 }),
  Object.freeze({ stationId: "progress", settleStart: .685, settleEnd: .765, position: [-3.25, 3.25, 4.75], target: [-.72, 1.55, -1.95], fov: 37, chairClearance: 1.04 }),
  Object.freeze({ stationId: "future-paths", settleStart: .845, settleEnd: 1, position: [2.9, 4.05, 5.8], target: [0, 1.95, -2.62], fov: 34, chairClearance: 1.02 })
]);

const MOBILE_SHOTS = Object.freeze([
  Object.freeze({ stationId: "desk", settleStart: 0, settleEnd: .105, position: [7.4, 6.45, 11.2], target: [0, 1.4, -.15], fov: 52, chairClearance: 1.12 }),
  Object.freeze({ stationId: "memory", settleStart: .205, settleEnd: .29, position: [-5.25, 3.75, 6.65], target: [-1.95, 1.62, -1.2], fov: 50, chairClearance: 1.1 }),
  Object.freeze({ stationId: "social", settleStart: .37, settleEnd: .455, position: [5.35, 3.7, 6.4], target: [2.0, 1.58, -1.25], fov: 50, chairClearance: 1.1 }),
  Object.freeze({ stationId: "assessment", settleStart: .53, settleEnd: .615, position: [4.5, 3.45, 5.85], target: [1.55, 1.35, -1.65], fov: 50, chairClearance: 1.08 }),
  Object.freeze({ stationId: "progress", settleStart: .685, settleEnd: .765, position: [-4.05, 3.6, 5.9], target: [-.7, 1.6, -1.95], fov: 50, chairClearance: 1.08 }),
  Object.freeze({ stationId: "future-paths", settleStart: .845, settleEnd: 1, position: [2.4, 4.25, 7.2], target: [0, 2.0, -2.62], fov: 48, chairClearance: 1.06 })
]);

const DESKTOP_EXIT = Object.freeze([
  Object.freeze({ position: [2.9, 4.05, 5.8], target: [0, 1.95, -2.62], fov: 34 }),
  Object.freeze({ position: [1.9, 3.55, 3.45], target: [0, 1.95, -2.72], fov: 31 }),
  Object.freeze({ position: [.72, 2.95, 1.45], target: [0, 1.98, -2.86], fov: 28 })
]);

const MOBILE_EXIT = Object.freeze([
  Object.freeze({ position: [2.4, 4.25, 7.2], target: [0, 2.0, -2.62], fov: 48 }),
  Object.freeze({ position: [1.6, 3.75, 4.4], target: [0, 2.0, -2.74], fov: 45 }),
  Object.freeze({ position: [.55, 3.2, 2.1], target: [0, 2.0, -2.88], fov: 42 })
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
