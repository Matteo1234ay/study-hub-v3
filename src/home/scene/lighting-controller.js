function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));
}

function ramp(progress, start, end) {
  const value = clamp01((progress - start) / Math.max(.0001, end - start));
  return value * value * (3 - 2 * value);
}

const ACTIVATION = Object.freeze({
  desk: [0, .07],
  memory: [.14, .22],
  social: [.35, .43],
  assessment: [.51, .59],
  progress: [.68, .76],
  future: [.84, .91],
  room: [.94, 1]
});

const ZONE_KEYS = Object.freeze(["desk", "memory", "social", "assessment", "progress", "future"]);

function normalizeFocus(value) {
  if (value === "future-paths") return "future";
  return ZONE_KEYS.includes(value) ? value : null;
}

export function createLightingController(lightRig = null) {
  function sample(progress, focusStation = null) {
    const value = clamp01(progress);
    const focus = normalizeFocus(focusStation);
    return {
      ambient: .38,
      desk: ramp(value, ...ACTIVATION.desk),
      memory: ramp(value, ...ACTIVATION.memory),
      social: ramp(value, ...ACTIVATION.social),
      assessment: ramp(value, ...ACTIVATION.assessment),
      progress: ramp(value, ...ACTIVATION.progress),
      future: ramp(value, ...ACTIVATION.future),
      room: ramp(value, ...ACTIVATION.room),
      focusStation: focus,
      focusBoost: focus ? 2.15 : 1
    };
  }

  function apply(progress, context = {}) {
    const state = sample(progress, context.focusStation);
    if (!lightRig) return state;
    if (lightRig.ambient) lightRig.ambient.intensity = state.ambient;
    if (lightRig.room) lightRig.room.intensity = state.room * 2.2;

    for (const key of ZONE_KEYS) {
      const zone = lightRig[key];
      const focused = state.focusStation === key;
      if (zone?.light) zone.light.intensity = state[key] * 1.45 + (focused ? state.focusBoost : 0);
      if (zone?.screen?.material) {
        zone.screen.material.emissiveIntensity = state[key] * .9 + (focused ? .48 : 0);
      }
    }

    const target = Array.isArray(context.target) ? context.target : null;
    const cameraPosition = Array.isArray(context.cameraPosition) ? context.cameraPosition : null;
    if (lightRig.guide?.light && target) {
      const light = lightRig.guide.light;
      light.intensity = state.focusStation ? 2.6 : 1.25;
      lightRig.guide.target?.position?.set?.(...target);
      lightRig.guide.target?.updateMatrixWorld?.();
      if (cameraPosition && light.position?.set) {
        light.position.set(
          target[0] + (cameraPosition[0] - target[0]) * .28,
          Math.max(target[1] + 2.15, 2.5),
          target[2] + (cameraPosition[2] - target[2]) * .24
        );
      }
    }

    return state;
  }

  return { sample, apply };
}
