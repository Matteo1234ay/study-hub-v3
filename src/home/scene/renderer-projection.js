export function projectObjectToCss({ THREE, canvas, camera, object, minimumSize = 1 }) {
  if (!object) return null;
  object.updateWorldMatrix?.(true, true);
  camera.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const points = [];

  if (bounds.isEmpty?.()) {
    const center = object.getWorldPosition(new THREE.Vector3()).project(camera);
    if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) return null;
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(minimumSize, Math.min(rect.width, rect.height) * .14);
    const x = rect.left + (center.x + 1) * .5 * rect.width;
    const y = rect.top + (1 - center.y) * .5 * rect.height;
    return { left: x - size / 2, top: y - size / 2, right: x + size / 2, bottom: y + size / 2, width: size, height: size };
  }

  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        points.push(new THREE.Vector3(x, y, z).project(camera));
      }
    }
  }
  if (!points.length || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return null;
  const minX = Math.min(...points.map(point => point.x));
  const maxX = Math.max(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const maxY = Math.max(...points.map(point => point.y));
  const rect = canvas.getBoundingClientRect();
  const left = rect.left + (minX + 1) * .5 * rect.width;
  const right = rect.left + (maxX + 1) * .5 * rect.width;
  const top = rect.top + (1 - maxY) * .5 * rect.height;
  const bottom = rect.top + (1 - minY) * .5 * rect.height;
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(minimumSize, right - left),
    height: Math.max(minimumSize, bottom - top)
  };
}

export function projectStationScreenToCss({ THREE, canvas, camera, stations, stationId }) {
  const screen = stations[stationId]?.screen;
  return projectObjectToCss({ THREE, canvas, camera, object: screen });
}
