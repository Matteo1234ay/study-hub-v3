export function setProceduralHeroVisible(room, visible) {
  if (!room?.group) return;
  room.group.visible = Boolean(visible);
}

export function prepareHomeV29({ THREE, room, scene, result } = {}) {
  if (!result?.scene || !scene || !room) return null;
  const root = result.scene;
  root.name = "study-hub-home-v29";
  root.userData = {
    ...(root.userData ?? {}),
    sourceAsset: "study-hub-home-v29",
    blenderFirst: true
  };
  root.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = !/Paper_|MonitorScreenSurface/.test(child.name ?? "");
    child.receiveShadow = true;
    const material = child.material;
    if (material && "envMapIntensity" in material) {
      if (/Glass|Aluminum|Graphite/i.test(material.name ?? "")) material.envMapIntensity = 0.88;
      else material.envMapIntensity = 0.52;
    }
  });
  root.updateMatrixWorld?.(true);

  const bounds = THREE?.Box3 ? new THREE.Box3().setFromObject(root) : null;
  if (bounds && (bounds.isEmpty?.() || !Number.isFinite(bounds.min.x))) return null;

  setProceduralHeroVisible(room, false);
  scene.add(root);
  room.heroAsset = root;
  room.homeV29 = {
    root,
    animations: result.animations ?? [],
    screenAnchor: root.getObjectByName?.("MonitorScreenAnchor") ?? null
  };
  return room.homeV29;
}

export function removeHomeV29({ room, scene } = {}) {
  const homeV29 = room?.homeV29;
  if (!homeV29?.root) return;
  scene?.remove?.(homeV29.root);
  if (room.heroAsset === homeV29.root) room.heroAsset = null;
  room.homeV29 = null;
}
