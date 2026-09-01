const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smoothRange(value, start, end) {
  const t = clamp01((value - start) / Math.max(.0001, end - start));
  return t * t * (3 - 2 * t);
}

function scatterFor(name = "") {
  let hash = 2166136261;
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return {
    x: ((hash & 255) / 255 - .5) * 2,
    y: (((hash >>> 8) & 255) / 255 - .5) * 2,
    z: (((hash >>> 16) & 255) / 255 - .5) * 2
  };
}

const LAYERS = Object.freeze([
  Object.freeze({ match: /^(Paper_|Book_)/, start: .45, end: .76, mass: .18, travel: 2.1 }),
  Object.freeze({ match: /^(LampRoot|ChairRoot|PulloutShelf|CabinetDoor)$/, start: .56, end: .84, mass: .48, travel: 1.45 }),
  Object.freeze({ match: /^(CabinetRoot|MonitorRoot)$/, start: .62, end: .90, mass: .70, travel: 1.10 }),
  Object.freeze({ match: /^(DeskRoot)$/, start: .66, end: .93, mass: .90, travel: .82 }),
  Object.freeze({ match: /^(Floor|BackWall|LeftWall|WallPanelRoot)$/, start: .70, end: .95, mass: 1.0, travel: .58 })
]);

export function createHomeV29Disassembly({ THREE, root, reducedMotion = false } = {}) {
  if (!THREE || !root) return null;
  const entries = [];
  const seen = new Set();

  for (const layer of LAYERS) {
    root.traverse(object => {
      if (seen.has(object) || !layer.match.test(object.name ?? "")) return;
      seen.add(object);
      entries.push({
        object,
        layer,
        scatter: scatterFor(object.name),
        basePosition: object.position.clone(),
        baseRotation: object.rotation.clone(),
        baseScale: object.scale.clone()
      });
    });
  }

  function reset() {
    for (const entry of entries) {
      entry.object.position.copy(entry.basePosition);
      entry.object.rotation.copy(entry.baseRotation);
      entry.object.scale.copy(entry.baseScale);
    }
  }

  function captureAnimatedBases() {
    for (const entry of entries) {
      entry.basePosition.copy(entry.object.position);
      entry.baseRotation.copy(entry.object.rotation);
      entry.baseScale.copy(entry.object.scale);
    }
  }

  function apply(progress, state = {}) {
    const archive = clamp01(state.archive);
    const handoff = clamp01(state.handoff);
    for (const entry of entries) {
      const amount = smoothRange(progress, entry.layer.start, entry.layer.end);
      if (amount <= .0001) continue;
      const mobility = 1.12 - entry.layer.mass * .58;
      const motion = (reducedMotion ? amount * .18 : amount) * mobility;
      const { object, scatter } = entry;
      object.position.x += scatter.x * entry.layer.travel * motion;
      object.position.y += (.18 + Math.abs(scatter.y)) * entry.layer.travel * motion * .72;
      object.position.z += scatter.z * entry.layer.travel * motion * .68;
      object.rotation.x += scatter.z * motion * .25;
      object.rotation.y += scatter.x * motion * .34;
      object.rotation.z += scatter.y * motion * .18;
      const disappearance = clamp01(amount * .78 + archive * .28 + handoff * .35);
      const scale = Math.max(.035, 1 - disappearance * .92);
      object.scale.multiplyScalar(scale);
    }
  }

  function audit() {
    return entries.map(({ object, layer }) => ({
      name: object.name,
      start: layer.start,
      end: layer.end,
      mass: layer.mass
    }));
  }

  return { reset, captureAnimatedBases, apply, audit };
}
