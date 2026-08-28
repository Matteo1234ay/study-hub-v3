export const HOME_SHOTS = Object.freeze([
  Object.freeze({
    stationId: "desk",
    enter: 0,
    settleStart: 0,
    settleEnd: .12,
    exit: .25,
    position: [-4.8, 3.15, 7.4],
    target: [0, 1.55, -1.45],
    fov: 42,
    monitorVisible: true,
    chairClearance: .78
  }),
  Object.freeze({
    stationId: "memory",
    enter: .12,
    settleStart: .25,
    settleEnd: .29,
    exit: .47,
    position: [-3.4, 2.7, 4.5],
    target: [-2, 1.9, -2],
    fov: 40
  }),
  Object.freeze({
    stationId: "social",
    enter: .29,
    settleStart: .47,
    settleEnd: .51,
    exit: .64,
    position: [1.4, 2.7, 4.8],
    target: [2, 1.9, -2],
    fov: 39
  }),
  Object.freeze({
    stationId: "assessment",
    enter: .51,
    settleStart: .64,
    settleEnd: .68,
    exit: .81,
    position: [2.5, 2, 3.7],
    target: [1.6, 1.2, -.8],
    fov: 38
  }),
  Object.freeze({
    stationId: "progress",
    enter: .68,
    settleStart: .81,
    settleEnd: .85,
    exit: .96,
    position: [-.8, 2.1, 4],
    target: [-1.2, 1.2, -2.1],
    fov: 39
  }),
  Object.freeze({
    stationId: "future-paths",
    enter: .85,
    settleStart: .96,
    settleEnd: 1,
    exit: 1,
    position: [.8, 3.2, 4],
    target: [.5, 2.6, -2.3],
    fov: 43
  })
]);

const HOME_OVERVIEW = Object.freeze({
  position: [-4.65, 3.45, 7.8],
  target: [0, 1.65, -1.75],
  fov: 48,
  stationId: "overview",
  settled: true,
  monitorVisible: true,
  chairClearance: .78
});

function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));
}

function smoothstep(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function interpolateVector(from, to, value) {
  const t = smoothstep(value);
  return from.map((item, index) => item + (to[index] - item) * t);
}

function interpolateNumber(from, to, value) {
  const t = smoothstep(value);
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

export function createCameraTimeline({ shots = HOME_SHOTS } = {}) {
  if (!Array.isArray(shots) || shots.length === 0) throw new Error("La timeline richiede almeno un'inquadratura");

  function sample(progress) {
    const value = clamp01(progress);
    const settledShot = shots.find(shot => value >= shot.settleStart && value <= shot.settleEnd);
    if (settledShot) return snapshot(settledShot, true);

    for (let index = 0; index < shots.length - 1; index += 1) {
      const current = shots[index];
      const next = shots[index + 1];
      if (value > current.settleEnd && value < next.settleStart) {
        const amount = (value - current.settleEnd) / Math.max(.0001, next.settleStart - current.settleEnd);
        return {
          position: interpolateVector(current.position, next.position, amount),
          target: interpolateVector(current.target, next.target, amount),
          fov: interpolateNumber(current.fov, next.fov, amount),
          stationId: amount < .5 ? current.stationId : next.stationId,
          settled: false,
          monitorVisible: amount < .5 && current.stationId === "desk",
          chairClearance: interpolateNumber(current.chairClearance ?? 1, next.chairClearance ?? 1, amount)
        };
      }
    }
    return value <= shots[0].settleStart ? snapshot(shots[0]) : snapshot(shots.at(-1));
  }

  function activeStation(progress) {
    return sample(progress).stationId;
  }

  function stationProgress(stationId) {
    const shot = shots.find(item => item.stationId === stationId);
    return shot ? (shot.settleStart + shot.settleEnd) / 2 : 0;
  }

  function overview() {
    return { ...HOME_OVERVIEW, position: [...HOME_OVERVIEW.position], target: [...HOME_OVERVIEW.target] };
  }

  return { sample, activeStation, stationProgress, overview };
}
