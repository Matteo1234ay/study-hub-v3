const MAX_PARALLAX = .012;

export function createInertialParallax({ maximum = MAX_PARALLAX, easing = .14 } = {}) {
  const limit = Math.max(0, Number(maximum) || MAX_PARALLAX);
  const amount = Math.min(1, Math.max(.01, Number(easing) || .14));
  const output = { x: 0, y: 0 };
  let targetX = 0;
  let targetY = 0;

  return {
    setTarget(x, y) {
      targetX = Math.min(limit, Math.max(-limit, (Number(x) || 0) * limit));
      targetY = Math.min(limit, Math.max(-limit, (Number(y) || 0) * limit));
    },
    reset() {
      targetX = 0;
      targetY = 0;
    },
    update() {
      output.x += (targetX - output.x) * amount;
      output.y += (targetY - output.y) * amount;
      if (Math.abs(output.x) < .00001 && targetX === 0) output.x = 0;
      if (Math.abs(output.y) < .00001 && targetY === 0) output.y = 0;
      return output;
    }
  };
}

export function createInteractionController({ THREE, canvas, camera, stations, onActivate = () => {} }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  const parallaxTarget = { x: 0, y: 0 };
  const hitAreas = Object.entries(stations).map(([id, station]) => {
    station.hitArea.userData.stationId = id;
    return station.hitArea;
  });
  let hovered = null;
  const cameraParallax = createInertialParallax();

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
    parallaxTarget.x = Math.min(1, Math.max(-1, (x - .5) * 2));
    parallaxTarget.y = Math.min(1, Math.max(-1, (y - .5) * 2));
    cameraParallax.setTarget(parallaxTarget.x, parallaxTarget.y);
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
    parallaxTarget.x = 0;
    parallaxTarget.y = 0;
    cameraParallax.reset();
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
      return cameraParallax.update();
    },
    getParallaxTarget() {
      return parallaxTarget;
    },
    reset() {
      parallaxTarget.x = 0;
      parallaxTarget.y = 0;
      cameraParallax.reset();
    },
    dispose() {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      onPointerLeave();
    }
  };
}
