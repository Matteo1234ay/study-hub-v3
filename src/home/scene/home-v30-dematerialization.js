const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smoothRange(value, start, end) {
  const t = clamp01((clamp01(value) - start) / Math.max(.0001, end - start));
  return t * t * (3 - 2 * t);
}

function hashUnit(name, salt = 0) {
  let hash = 2166136261 ^ salt;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 9999;
}

const PHYSICAL_NODES = Object.freeze([
  "Chair_Master",
  "Lamp_Base",
  "MonitorBank_Master",
  "SecondaryDisplay_Master",
  "ArchiveWall_Master",
  "BinderSet_Master",
  "BookStack_Master",
  "PathsHandoff_Master"
]);

export function createHomeV30Dematerialization({ THREE, root } = {}) {
  if (!THREE?.Vector3 || !THREE?.Quaternion || !root) {
    throw new Error("La dematerializzazione V30 richiede Three.js e il root Blender");
  }

  const records = PHYSICAL_NODES.map((name, index) => {
    const object = root.getObjectByName?.(name) ?? null;
    if (!object) return null;
    const basePosition = object.position.clone();
    const baseQuaternion = object.quaternion.clone();
    const baseScale = object.scale.clone();
    const sign = index % 2 === 0 ? -1 : 1;
    const x = (hashUnit(name, 11) * .7 + .28) * sign;
    const y = .08 + hashUnit(name, 23) * .28;
    const z = (hashUnit(name, 37) - .5) * .42;
    const drift = new THREE.Vector3(x, y, z);
    const twist = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      (hashUnit(name, 41) - .5) * .08,
      (hashUnit(name, 53) - .5) * .22,
      (hashUnit(name, 67) - .5) * .10
    ));
    return { name, object, basePosition, baseQuaternion, baseScale, drift, twist };
  }).filter(Boolean);

  let progress = 0;
  let phase = "settled";

  function update(value) {
    progress = clamp01(value);
    const unbind = smoothRange(progress, .54, .78);
    const handoff = smoothRange(progress, .78, 1);
    phase = handoff > .01 ? "handoff" : unbind > .01 ? "unbinding" : "settled";

    if (unbind <= 0) return;
    for (const record of records) {
      const { name, object, drift, twist } = record;
      const animatedPosition = object.position.clone();
      const animatedQuaternion = object.quaternion.clone();
      const animatedScale = object.scale.clone();
      const isPaths = name === "PathsHandoff_Master";
      const strength = isPaths ? unbind * .18 : unbind * (1 - handoff * .22);

      if (isPaths) {
        object.position.copy(animatedPosition).addScaledVector(drift, strength * .12);
        object.quaternion.copy(animatedQuaternion).slerp(animatedQuaternion.clone().multiply(twist), strength * .12);
        object.scale.copy(animatedScale).multiplyScalar(1 + handoff * .075);
      } else {
        object.position.copy(animatedPosition).addScaledVector(drift, strength);
        object.quaternion.copy(animatedQuaternion).slerp(animatedQuaternion.clone().multiply(twist), strength);
        object.scale.copy(animatedScale).multiplyScalar(1 - handoff * .055);
      }
    }
  }

  function audit() {
    return {
      progress,
      phase,
      nodes: records.map(record => record.name),
      missingNodes: PHYSICAL_NODES.filter(name => !records.some(record => record.name === name))
    };
  }

  function dispose() {
    for (const { object, basePosition, baseQuaternion, baseScale } of records) {
      object.position.copy(basePosition);
      object.quaternion.copy(baseQuaternion);
      object.scale.copy(baseScale);
    }
  }

  return { update, audit, dispose };
}
