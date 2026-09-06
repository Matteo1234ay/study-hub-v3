import { HOME_V30_NODES } from "./home-v30-contract.js?v=20260906-33";

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
    for (const material of (Array.isArray(child.material) ? child.material : [child.material])) {
      if (!material) continue;
      if (["ScreenUI_Accent", "StudyHub_Information_Screen"].includes(material.name)) material.color?.set("#10002F");
      if (material.name === "Paper_Ivory") {material.color?.set("#f7f6f2");material.roughness=.92;}
      if (material.name === "Graphite_Powdercoat") material.roughness=.72;
    }
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
