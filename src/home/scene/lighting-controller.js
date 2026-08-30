function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));
}

function ramp(progress, start, end) {
  const value = clamp01((progress - start) / Math.max(.0001, end - start));
  return value * value * (3 - 2 * value);
}

const ACTIVATION = Object.freeze({
  desk: [.02, .09],
  memory: [.14, .22],
  social: [.35, .43],
  assessment: [.51, .59],
  progress: [.68, .76],
  future: [.84, .91],
  room: [.94, 1]
});

const LIGHTING = Object.freeze({
  ambient: .5,
  roomBase: .28,
  roomLift: .25,
  peripheralFloor: .14,
  focusBoost: .52,
  zoneRange: .78,
  guideBase: 1.1,
  guideFocus: .52
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
      ambient: LIGHTING.ambient,
      desk: ramp(value, ...ACTIVATION.desk),
      memory: ramp(value, ...ACTIVATION.memory),
      social: ramp(value, ...ACTIVATION.social),
      assessment: ramp(value, ...ACTIVATION.assessment),
      progress: ramp(value, ...ACTIVATION.progress),
      future: ramp(value, ...ACTIVATION.future),
      room: LIGHTING.roomBase + ramp(value, ...ACTIVATION.room) * LIGHTING.roomLift,
      peripheralFloor: LIGHTING.peripheralFloor,
      focusStation: focus,
      focusBoost: focus ? LIGHTING.focusBoost : 0
    };
  }

  function apply(progress, context = {}) {
    const state = sample(progress, context.focusStation);
    if (!lightRig) return state;
    const directionScale = .82 + clamp01(context.lightingScale ?? 1) * .18;
    const readScale = .94 + clamp01(context.readStrength ?? 0) * .06;
    if (lightRig.ambient) lightRig.ambient.intensity = state.ambient;
    if (lightRig.room) lightRig.room.intensity = state.room;

    for (const key of ZONE_KEYS) {
      const zone = lightRig[key];
      const focused = state.focusStation === key;
      const screenPower = state[key];
      const persistentLight = state.peripheralFloor + screenPower * LIGHTING.zoneRange;
      if (zone?.light) {
        zone.light.intensity = persistentLight * directionScale + (focused ? state.focusBoost * readScale : 0);
      }
      if (zone?.screen?.material) {
        if (zone.screen.material.color?.setScalar) {
          zone.screen.material.color.setScalar(.035 + screenPower * .965);
        }
        zone.screen.material.emissiveIntensity = screenPower * (focused ? 1.14 : .82);
      }
    }

    const target = Array.isArray(context.target) ? context.target : null;
    const cameraPosition = Array.isArray(context.cameraPosition) ? context.cameraPosition : null;
    if (lightRig.guide?.light && target) {
      const light = lightRig.guide.light;
      light.intensity = (LIGHTING.guideBase + (state.focusStation ? LIGHTING.guideFocus : 0)) * directionScale;
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