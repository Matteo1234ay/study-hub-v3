function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function axisMagnitude(value = {}) {
  return Math.max(Math.abs(Number(value.x) || 0), Math.abs(Number(value.y) || 0));
}

function weightScale(weight) {
  if (weight === "heavy") return .34;
  if (weight === "medium") return .62;
  return 1;
}

export function createParallaxRig({ layers = [], maxLayers = 12 } = {}) {
  const selected = layers.filter(layer => layer?.object).slice(0, Math.max(0, maxLayers));
  const states = selected.map(layer => ({
    layer,
    base: {
      px: layer.object.position.x,
      py: layer.object.position.y,
      pz: layer.object.position.z,
      rx: layer.object.rotation.x,
      ry: layer.object.rotation.y,
      rz: layer.object.rotation.z
    },
    x: 0,
    y: 0
  }));
  let targetX = 0;
  let targetY = 0;
  let amplitude = 1;

  function apply(state) {
    const { layer, base } = state;
    const depth = Math.max(0, Number(layer.depth) || 0);
    const semanticScale = amplitude * weightScale(layer.weight);
    const translation = layer.translation ?? {};
    const rotation = layer.rotation ?? {};
    layer.object.position.x = base.px + state.x * (Number(translation.x) || 0) * depth * semanticScale;
    layer.object.position.y = base.py - state.y * (Number(translation.y) || 0) * depth * semanticScale;
    layer.object.position.z = base.pz;
    layer.object.rotation.x = base.rx + state.y * (Number(rotation.x) || 0) * depth * semanticScale;
    layer.object.rotation.y = base.ry + state.x * (Number(rotation.y) || 0) * depth * semanticScale;
    layer.object.rotation.z = base.rz;
  }

  function setTarget({ x = 0, y = 0 } = {}) {
    targetX = clamp(x, -1, 1);
    targetY = clamp(y, -1, 1);
  }

  function setAmplitude(value = 1) {
    amplitude = clamp(value, 0, 1);
    if (amplitude !== 0) return;
    for (const state of states) {
      state.x = 0;
      state.y = 0;
      apply(state);
    }
  }

  function reset() {
    targetX = 0;
    targetY = 0;
  }

  function update(deltaSeconds = 1 / 60) {
    if (amplitude === 0) return;
    const dt = clamp(deltaSeconds, 0, .05);
    for (const state of states) {
      const damping = Math.max(.1, Number(state.layer.damping) || 6);
      const alpha = 1 - Math.exp(-damping * dt);
      state.x += (targetX - state.x) * alpha;
      state.y += (targetY - state.y) * alpha;
      if (Math.abs(state.x) < .00001 && targetX === 0) state.x = 0;
      if (Math.abs(state.y) < .00001 && targetY === 0) state.y = 0;
      apply(state);
    }
  }

  function restoreImmediately() {
    targetX = 0;
    targetY = 0;
    for (const state of states) {
      state.x = 0;
      state.y = 0;
      apply(state);
    }
  }

  function audit() {
    return {
      count: states.length,
      depths: states.map(state => Number(state.layer.depth) || 0),
      damping: states.map(state => Number(state.layer.damping) || 0),
      weights: states.map(state => state.layer.weight),
      clusters: states.map(state => state.layer.cluster),
      maxTranslation: Math.max(0, ...states.map(state => axisMagnitude(state.layer.translation))),
      maxRotation: Math.max(0, ...states.map(state => axisMagnitude(state.layer.rotation)))
    };
  }

  return { setTarget, setAmplitude, update, reset, restoreImmediately, audit };
}
