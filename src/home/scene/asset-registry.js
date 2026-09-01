import { GLTFLoader } from "../../../vendor/three/examples/jsm/loaders/GLTFLoader.js?v=20260901-29";

const DESK_LAMP_MODEL = new URL("../../../assets/3d/desk-lamp-arm-01/desk_lamp_arm_01_1k.gltf", import.meta.url).href;
const STUDIO_CORE_MODEL = new URL("../../../assets/3d/studio-core/studio-core.glb", import.meta.url).href;
const HOME_V29_MODEL = new URL("../../../assets/3d/home-v29/study-hub-home-v29.glb", import.meta.url).href;
const DEFAULT_TIMEOUT_MS = 12000;

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

  async function loadGltf(url) {
    if (disposed) return null;
    const finiteTimeout = Math.min(15000, Math.max(1000, Number(timeoutMs) || DEFAULT_TIMEOUT_MS));
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
      return result;
    } catch {
      return null;
    } finally {
      if (timer) globalThis.clearTimeout(timer);
    }
  }

  async function loadModel(url) {
    const result = await loadGltf(url);
    return result?.scene ?? null;
  }

  function loadDeskLamp() {
    return loadModel(DESK_LAMP_MODEL);
  }

  function loadStudioCore() {
    return loadModel(STUDIO_CORE_MODEL);
  }

  async function loadHomeV29() {
    const result = await loadGltf(HOME_V29_MODEL);
    if (!result?.scene) return null;
    return {
      scene: result.scene,
      animations: Array.isArray(result.animations) ? result.animations : []
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const object of tracked) disposeObject(object);
    tracked.clear();
  }

  return { loadDeskLamp, loadStudioCore, loadHomeV29, dispose };
}
