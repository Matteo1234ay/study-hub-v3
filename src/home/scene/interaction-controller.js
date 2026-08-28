const MAX_PARALLAX = .012;

export function createInteractionController({ THREE, canvas, camera, stations, onActivate = () => {} }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  const hitAreas = Object.entries(stations).map(([id, station]) => {
    station.hitArea.userData.stationId = id;
    return station.hitArea;
  });
  let hovered = null;
  let parallaxX = 0;
  let parallaxY = 0;

  function setHovered(next) {
    if (hovered === next) return;
    if (hovered?.screen?.material) hovered.screen.material.emissiveIntensity = Math.max(0, hovered.screen.material.emissiveIntensity - .08);
    hovered = next;
    canvas.classList.toggle("is-station-hovered", Boolean(hovered));
    if (hovered?.screen?.material) hovered.screen.material.emissiveIntensity += .08;
  }

  function readPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(1, rect.width);
    const y = (event.clientY - rect.top) / Math.max(1, rect.height);
    pointer.set(x * 2 - 1, -(y * 2 - 1));
    parallaxX = Math.max(-MAX_PARALLAX, Math.min(MAX_PARALLAX, (x - .5) * MAX_PARALLAX * 2));
    parallaxY = Math.max(-MAX_PARALLAX, Math.min(MAX_PARALLAX, (y - .5) * MAX_PARALLAX * 2));
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const first = raycaster.intersectObjects(hitAreas, false)[0]?.object;
    setHovered(first ? stations[first.userData.stationId] : null);
  }

  function onPointerMove(event) {
    readPointer(event);
    pick();
  }

  function onPointerLeave() {
    pointer.set(2, 2);
    parallaxX = 0;
    parallaxY = 0;
    setHovered(null);
  }

  function onClick(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    readPointer(event);
    pick();
    const id = Object.entries(stations).find(([, station]) => station === hovered)?.[0];
    if (id) onActivate(id);
  }

  canvas.addEventListener("pointermove", onPointerMove, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick);

  return {
    update() {
      return { x: parallaxX, y: parallaxY };
    },
    dispose() {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      onPointerLeave();
    }
  };
}
