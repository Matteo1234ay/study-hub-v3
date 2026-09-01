import { HOME_V30_CLIPS, HOME_V30_NODES, HOME_V30_WINDOWS } from "./home-v30-contract.js?v=20260901-29";

const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smoothstep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function resolveV30ClipProgress(progress, window) {
  const [start, end] = window;
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return smoothstep((progress - start) / Math.max(.0001, end - start));
}

export function createHomeV30Controller({ THREE, root, animations = [] } = {}) {
  if (!THREE?.AnimationMixer) throw new Error("AnimationMixer Three.js non disponibile");
  if (!root) throw new Error("Root Blender V30 non disponibile");

  const mixer = new THREE.AnimationMixer(root);
  const clips = new Map(animations.map(clip => [clip.name, clip]));
  const actions = new Map();
  const nodes = new Map();

  for (const name of HOME_V30_NODES) {
    const node = root.getObjectByName?.(name) ?? null;
    if (node) nodes.set(name, node);
  }

  for (const name of HOME_V30_CLIPS) {
    const clip = clips.get(name);
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = true;
    action.setEffectiveWeight(1);
    action.play();
    action.paused = true;
    action.time = 0;
    actions.set(name, { action, clip });
  }
  mixer.update(0);

  let progress = 0;
  function update(value) {
    progress = clamp01(value);
    for (const [name, entry] of actions) {
      const local = resolveV30ClipProgress(progress, HOME_V30_WINDOWS[name]);
      entry.action.time = local * Math.max(.0001, entry.clip.duration || 0);
    }
    mixer.update(0);
  }

  function getNode(name) {
    return nodes.get(name) ?? root.getObjectByName?.(name) ?? null;
  }

  function getArchiveOrigins() {
    return HOME_V30_NODES
      .filter(name => name.startsWith("ArchiveOrigin_"))
      .map(name => ({ name, object: getNode(name) }))
      .filter(entry => Boolean(entry.object));
  }

  function audit() {
    return {
      progress,
      clips: [...actions.keys()],
      nodes: [...nodes.keys()],
      missingClips: HOME_V30_CLIPS.filter(name => !actions.has(name)),
      missingNodes: HOME_V30_NODES.filter(name => !getNode(name))
    };
  }

  function dispose() {
    for (const { action } of actions.values()) action.stop();
    actions.clear();
    nodes.clear();
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
  }

  return { update, getNode, getArchiveOrigins, audit, dispose };
}
