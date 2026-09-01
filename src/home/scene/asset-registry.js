import { GLTFLoader } from "../../../vendor/three/examples/jsm/loaders/GLTFLoader.js?v=20260901-30";

const DESK_LAMP_MODEL = new URL("../../../assets/3d/desk-lamp-arm-01/desk_lamp_arm_01_1k.gltf", import.meta.url).href;
const STUDIO_CORE_MODEL = new URL("../../../assets/3d/studio-core/studio-core.glb", import.meta.url).href;
const HOME_V29_MODEL = new URL("../../../assets/3d/home-v29/study-hub-home-v29.glb", import.meta.url).href;
const HOME_V30_MODEL = new URL("../../../assets/3d/home-v30/study-hub-home-v30.glb", import.meta.url).href;
const DEFAULT_TIMEOUT_MS = 12000;
const V30_TIMEOUT_MS = 20000;

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

export function createAssetRegistry({
  THREE,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  v30TimeoutMs = V30_TIMEOUT_MS
} = {}) {
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

  async function loadHomeV30() {
    if (disposed) return { status: "error", error: new Error("Registro asset chiuso") };
    const finiteTimeout = Math.min(30000, Math.max(15000, Number(v30TimeoutMs) || V30_TIMEOUT_MS));
    let timer = 0;
    const timeoutError = new Error("Timeout durante il caricamento della scena V30");
    try {
      const loadPromise = loader.loadAsync(HOME_V30_MODEL)
        .then(result => ({ status: "ok", result }))
        .catch(error => ({ status: "error", error }));
      const timeoutPromise = new Promise(resolve => {
        timer = globalThis.setTimeout(() => resolve({ status: "timeout", error: timeoutError }), finiteTimeout);
      });
      const decision = await Promise.race([loadPromise, timeoutPromise]);
      if (decision.status !== "ok") return decision;
      const object = decision.result?.scene ?? null;
      if (!object) return { status: "error", error: new Error("La scena V30 non contiene un root") };
      if (disposed) {
        disposeObject(object);
        return { status: "error", error: new Error("Registro asset chiuso durante il caricamento V30") };
      }
      tracked.add(object);
      return {
        status: "ok",
        scene: object,
        animations: Array.isArray(decision.result.animations) ? decision.result.animations : []
      };
    } catch (error) {
      return { status: "error", error };
    } finally {
      if (timer) globalThis.clearTimeout(timer);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const object of tracked) disposeObject(object);
    tracked.clear();
  }

  return { loadDeskLamp, loadStudioCore, loadHomeV29, loadHomeV30, dispose };
}
