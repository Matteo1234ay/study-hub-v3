export const HOME_SHOTS = Object.freeze([
  Object.freeze({ stationId: "desk", enter: 0, settleStart: 0, settleEnd: .12, exit: .25, position: [-5.6, 3.05, 5.75], target: [-.05, 1.92, -1.02], fov: 39, monitorVisible: true, chairClearance: 1 }),
  Object.freeze({ stationId: "memory", enter: .12, settleStart: .25, settleEnd: .29, exit: .47, position: [-3.05, 2.65, 3.85], target: [-3.35, 2.15, -2.68], fov: 37 }),
  Object.freeze({ stationId: "social", enter: .29, settleStart: .47, settleEnd: .51, exit: .64, position: [2.15, 2.65, 3.75], target: [3.35, 2.1, -2.75], fov: 35 }),
  Object.freeze({ stationId: "assessment", enter: .51, settleStart: .64, settleEnd: .68, exit: .81, position: [4.1, 1.95, 3.1], target: [2.55, .95, -.58], fov: 34 }),
  Object.freeze({ stationId: "progress", enter: .68, settleStart: .81, settleEnd: .85, exit: .96, position: [-3.1, 1.9, 2.9], target: [-.95, 1.08, -2.75], fov: 34 }),
  Object.freeze({ stationId: "future-paths", enter: .85, settleStart: .96, settleEnd: 1, exit: 1, position: [1.35, 3.45, 2.55], target: [.75, 3.26, -2.36], fov: 34 })
]);

export const MOBILE_HOME_SHOTS = Object.freeze([
  Object.freeze({ stationId: "desk", enter: 0, settleStart: 0, settleEnd: .12, exit: .25, position: [-5.0, 2.95, 5.0], target: [-.08, 1.94, -1.02], fov: 48, monitorVisible: true, chairClearance: 1.08 }),
  Object.freeze({ stationId: "memory", enter: .12, settleStart: .25, settleEnd: .29, exit: .47, position: [-4.5, 2.55, 2.6], target: [-3.35, 2.18, -2.68], fov: 56, chairClearance: 1.05 }),
  Object.freeze({ stationId: "social", enter: .29, settleStart: .47, settleEnd: .51, exit: .64, position: [4.4, 2.55, 2.5], target: [3.35, 2.12, -2.75], fov: 52, chairClearance: 1.05 }),
  Object.freeze({ stationId: "assessment", enter: .51, settleStart: .64, settleEnd: .68, exit: .81, position: [3.8, 2.05, 2.9], target: [2.55, .95, -.58], fov: 50, chairClearance: 1.05 }),
  Object.freeze({ stationId: "progress", enter: .68, settleStart: .81, settleEnd: .85, exit: .96, position: [-2.8, 1.9, 2.8], target: [-.95, 1.08, -2.75], fov: 52, chairClearance: 1.05 }),
  Object.freeze({ stationId: "future-paths", enter: .85, settleStart: .96, settleEnd: 1, exit: 1, position: [-1.2, 3.35, 3.0], target: [.75, 3.26, -2.36], fov: 54, chairClearance: 1.05 })
]);

const HOME_OVERVIEW = Object.freeze({ position: [-4.65, 3.45, 7.8], target: [0, 1.65, -1.75], fov: 48, stationId: "overview", settled: true, monitorVisible: true, chairClearance: 1 });
const MOBILE_OVERVIEW = Object.freeze({ position: [-5.1, 3.15, 6.1], target: [0, 1.75, -1.7], fov: 52, stationId: "overview", settled: true, monitorVisible: true, chairClearance: 1.08 });

function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));
}

function interpolateVector(from, to, value) {
  const t = clamp01(value);
  return from.map((item, index) => item + (to[index] - item) * t);
}

function interpolateNumber(from, to, value) {
  const t = clamp01(value);
  return from + (to - from) * t;
}

function snapshot(shot, settled = true) {
  return {
    position: [...shot.position],
    target: [...shot.target],
    fov: shot.fov,
    stationId: shot.stationId,
    settled,
    monitorVisible: shot.monitorVisible ?? shot.stationId === "desk",
    chairClearance: shot.chairClearance ?? 1
  };
}

export function createCameraTimeline({ shots = null, layout = "desktop" } = {}) {
  const selectedShots = shots ?? (layout === "mobile" ? MOBILE_HOME_SHOTS : HOME_SHOTS);
  const selectedOverview = layout === "mobile" ? MOBILE_OVERVIEW : HOME_OVERVIEW;
  if (!Array.isArray(selectedShots) || selectedShots.length === 0) throw new Error("La timeline richiede almeno un'inquadratura");

  function sample(progress) {
    const value = clamp01(progress);
    const settledShot = selectedShots.find(shot => value >= shot.settleStart && value <= shot.settleEnd);
    if (settledShot) return snapshot(settledShot, true);

    for (let index = 0; index < selectedShots.length - 1; index += 1) {
      const current = selectedShots[index];
      const next = selectedShots[index + 1];
      if (value > current.settleEnd && value < next.settleStart) {
        const amount = (value - current.settleEnd) / Math.max(.0001, next.settleStart - current.settleEnd);
        return {
          position: interpolateVector(current.position, next.position, amount),
          target: interpolateVector(current.target, next.target, amount),
          fov: interpolateNumber(current.fov, next.fov, amount),
          stationId: amount < .72 ? current.stationId : next.stationId,
          settled: false,
          monitorVisible: amount < .72 && current.stationId === "desk",
          chairClearance: interpolateNumber(current.chairClearance ?? 1, next.chairClearance ?? 1, amount)
        };
      }
    }
    return value <= selectedShots[0].settleStart ? snapshot(selectedShots[0]) : snapshot(selectedShots.at(-1));
  }

  function activeStation(progress) { return sample(progress).stationId; }
  function stationProgress(stationId) {
    const shot = selectedShots.find(item => item.stationId === stationId);
    return shot ? (shot.settleStart + shot.settleEnd) / 2 : 0;
  }
  function overview() { return { ...selectedOverview, position: [...selectedOverview.position], target: [...selectedOverview.target] }; }

  return { sample, activeStation, stationProgress, overview, layout };
}
