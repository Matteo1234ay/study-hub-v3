import { HOME_V30_NODES } from "./home-v30-contract.js?v=20260901-29";

function finiteVector(vector) {
  return vector && [vector.x, vector.y, vector.z].every(Number.isFinite);
}

export function prepareHomeV30({ THREE, scene, result } = {}) {
  if (!THREE?.Box3 || !scene || result?.status !== "ok" || !result.scene) return null;
  const root = result.scene;
  const missingNodes = HOME_V30_NODES.filter(name => !root.getObjectByName?.(name));
  if (missingNodes.length) return null;

  root.updateMatrixWorld?.(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  if (!finiteVector(size) || !finiteVector(center) || Math.max(size.x, size.y, size.z) < .5) return null;

  root.name = "study-hub-home-v30";
  root.userData = {
    ...(root.userData ?? {}),
    sourceAsset: "study-hub-home-v30",
    nativeAxis: "gltf-y-up"
  };
  root.traverse?.(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  scene.add(root);
  return {
    root,
    animations: Array.isArray(result.animations) ? result.animations : [],
    bounds,
    center,
    size
  };
}
