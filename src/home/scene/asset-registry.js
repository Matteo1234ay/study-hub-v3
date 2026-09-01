import { GLTFLoader } from "../../../vendor/three/examples/jsm/loaders/GLTFLoader.js?v=20260901-26";

const DESK_LAMP_MODEL = new URL("../../../assets/3d/desk-lamp-arm-01/desk_lamp_arm_01_1k.gltf", import.meta.url).href;
const STUDIO_CORE_MODEL = new URL("../../../assets/3d/studio-core/studio-core.glb", import.meta.url).href;
const DEFAULT_TIMEOUT_MS = 6000;

function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture) value.dispose?.();
  }
  material.dispose?.();
}

function disposeObject(object) {
  object?.traverse?.(child => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach(disposeMaterial);
    else disposeMaterial(child.material);
  });
}

export function createAssetRegistry({ THREE, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!THREE) throw new Error("Three.js non disponibile per il registro asset");
  const loader = new GLTFLoader();
  const tracked = new Set();
  let disposed = false;

  async function loadModel(url) {
    if (disposed) return null;
    const finiteTimeout = Math.min(6000, Math.max(500, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
    let timer = 0;
    try {
      const loadPromise = loader.loadAsync(url).catch(() => null);
      const timeoutPromise = new Promise(resolve => {
        timer = globalThis.setTimeout(() => resolve(null), finiteTimeout);
      });
      const result = await Promise.race([loadPromise, timeoutPromise]);
      const object = result?.scene ?? null;
      if (!object) return null;
      if (disposed) {
        disposeObject(object);
        return null;
      }
      tracked.add(object);
      return object;
    } catch {
      return null;
    } finally {
      if (timer) globalThis.clearTimeout(timer);
    }
  }

  function loadDeskLamp() {
    return loadModel(DESK_LAMP_MODEL);
  }

  function loadStudioCore() {
    return loadModel(STUDIO_CORE_MODEL);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const object of tracked) disposeObject(object);
    tracked.clear();
  }

  return { loadDeskLamp, loadStudioCore, dispose };
}
