function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));
}

function ramp(progress, start, end) {
  const value = clamp01((progress - start) / Math.max(.0001, end - start));
  return value * value * (3 - 2 * value);
}

const ACTIVATION = Object.freeze({
  desk: [.1, .2],
  memory: [.29, .38],
  social: [.44, .54],
  assessment: [.58, .68],
  progress: [.72, .8],
  future: [.84, .91],
  room: [.94, 1]
});

export function createLightingController(lightRig = null) {
  function sample(progress) {
    const value = clamp01(progress);
    return {
      ambient: .24,
      desk: ramp(value, ...ACTIVATION.desk),
      memory: ramp(value, ...ACTIVATION.memory),
      social: ramp(value, ...ACTIVATION.social),
      assessment: ramp(value, ...ACTIVATION.assessment),
      progress: ramp(value, ...ACTIVATION.progress),
      future: ramp(value, ...ACTIVATION.future),
      room: ramp(value, ...ACTIVATION.room)
    };
  }

  function apply(progress) {
    const state = sample(progress);
    if (!lightRig) return state;
    if (lightRig.ambient) lightRig.ambient.intensity = state.ambient;
    if (lightRig.room) lightRig.room.intensity = state.room;
    for (const key of ["desk", "memory", "social", "assessment", "progress", "future"]) {
      const zone = lightRig[key];
      if (zone?.light) zone.light.intensity = state[key];
      if (zone?.screen?.material) zone.screen.material.emissiveIntensity = state[key] * .75;
    }
    return state;
  }

  return { sample, apply };
}
