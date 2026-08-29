export function projectStationScreenToCss({ THREE, canvas, camera, stations, stationId }) {
  const screen = stations[stationId]?.screen;
  if (!screen) return null;
  screen.updateWorldMatrix(true, false);
  camera.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(screen);
  const points = [];
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
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  };
}