const DESKTOP_KEYS = Object.freeze([
  { p: 0.00, stationId: "desk", position: [-5.85, 3.35, 6.25], target: [-.15, 1.42, -.35], fov: 39 },
  { p: 0.12, stationId: "desk", position: [-4.55, 2.72, 4.30], target: [.05, 1.48, -.32], fov: 36 },
  { p: 0.27, stationId: "desk", position: [3.25, 1.85, 2.65], target: [1.02, .82, -.24], fov: 33 },
  { p: 0.45, stationId: "memory", position: [-4.55, 2.45, 2.95], target: [-2.90, 1.18, -2.05], fov: 34 },
  { p: 0.60, stationId: "social", position: [-1.75, 3.25, 5.25], target: [-.15, 1.72, -1.05], fov: 38 },
  { p: 0.78, stationId: "progress", position: [.25, 4.45, 7.65], target: [0, 1.95, -1.55], fov: 43 },
  { p: 0.94, stationId: "future-paths", position: [1.58, 3.42, 3.05], target: [.55, 2.12, -2.32], fov: 34 },
  { p: 1.00, stationId: "future-paths", position: [.62, 2.63, .52], target: [.38, 2.08, -2.36], fov: 29 }
]);

const MOBILE_KEYS = Object.freeze([
  { p: 0.00, stationId: "desk", position: [-5.1, 3.15, 5.35], target: [-.05, 1.45, -.35], fov: 49 },
  { p: 0.12, stationId: "desk", position: [-4.2, 2.72, 4.25], target: [.08, 1.48, -.34], fov: 47 },
  { p: 0.27, stationId: "desk", position: [3.65, 2.05, 3.20], target: [1.02, .85, -.24], fov: 47 },
  { p: 0.45, stationId: "memory", position: [-4.9, 2.55, 3.55], target: [-2.9, 1.2, -2.05], fov: 48 },
  { p: 0.60, stationId: "social", position: [-2.15, 3.15, 5.35], target: [-.1, 1.75, -1.05], fov: 50 },
  { p: 0.78, stationId: "progress", position: [.1, 4.15, 6.55], target: [0, 1.95, -1.55], fov: 52 },
  { p: 0.94, stationId: "future-paths", position: [1.55, 3.35, 3.75], target: [.5, 2.1, -2.32], fov: 49 },
  { p: 1.00, stationId: "future-paths", position: [.72, 2.72, 1.05], target: [.38, 2.08, -2.36], fov: 44 }
]);

const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));
const smooth = value => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpVector(a, b, t) { return a.map((value, index) => lerp(value, b[index], t)); }

function sampleKeys(keys, progress) {
  const p = clamp01(progress);
  if (p <= keys[0].p) return { ...keys[0], position: [...keys[0].position], target: [...keys[0].target], settled: true };
  for (let index = 0; index < keys.length - 1; index += 1) {
    const from = keys[index];
    const to = keys[index + 1];
    if (p > to.p) continue;
    const local = smooth((p - from.p) / Math.max(.0001, to.p - from.p));
    return {
      position: lerpVector(from.position, to.position, local),
      target: lerpVector(from.target, to.target, local),
      fov: lerp(from.fov, to.fov, local),
      stationId: local < .62 ? from.stationId : to.stationId,
      settled: Math.abs(p - to.p) < .012,
      monitorVisible: p < .33,
      chairClearance: p < .12 ? 1 : 1.08
    };
  }
  const last = keys.at(-1);
  return { ...last, position: [...last.position], target: [...last.target], settled: true };
}

export function createHomeV29CameraTimeline({ layout = "desktop" } = {}) {
  const keys = layout === "mobile" ? MOBILE_KEYS : DESKTOP_KEYS;

  function sample(progress) { return sampleKeys(keys, progress); }
  function exit(progress) {
    const value = clamp01(progress);
    const base = sample(1);
    return {
      ...base,
      position: lerpVector(base.position, [base.position[0] * .78, base.position[1] - .08, base.position[2] - .72], smooth(value)),
      fov: lerp(base.fov, Math.max(25, base.fov - 3), smooth(value)),
      settled: false
    };
  }
  function activeStation(progress) { return sample(progress).stationId; }
  function stationProgress(stationId) {
    const candidates = keys.filter(key => key.stationId === stationId);
    if (!candidates.length) return 0;
    return candidates.reduce((sum, item) => sum + item.p, 0) / candidates.length;
  }
  function stationWindows() {
    return [
      { stationId: "desk", enter: 0, readStart: .08, readEnd: .30, releaseEnd: .34 },
      { stationId: "memory", enter: .30, readStart: .34, readEnd: .47, releaseEnd: .51 },
      { stationId: "social", enter: .47, readStart: .50, readEnd: .62, releaseEnd: .66 },
      { stationId: "assessment", enter: .57, readStart: .60, readEnd: .70, releaseEnd: .74 },
      { stationId: "progress", enter: .64, readStart: .68, readEnd: .82, releaseEnd: .87 },
      { stationId: "future-paths", enter: .82, readStart: .88, readEnd: 1, releaseEnd: 1 }
    ];
  }
  function overview() {
    return layout === "mobile"
      ? { position: [-4.8, 3.25, 5.8], target: [0, 1.65, -.8], fov: 52, stationId: "overview", settled: true }
      : { position: [-5.2, 3.55, 7.1], target: [0, 1.65, -.8], fov: 46, stationId: "overview", settled: true };
  }

  return { sample, exit, activeStation, stationProgress, stationWindows, overview, layout };
}
