import { createStationScreen } from "./screen-ui.js?v=20260828-17";

const OPENING_CAMERA = Object.freeze({
  position: [-5.6, 3.05, 5.75],
  target: [-.05, 1.92, -1.02],
  fov: 39
});

function mesh(THREE, geometry, material, name, position, rotation = [0, 0, 0]) {
  const value = new THREE.Mesh(geometry, material);
  value.name = name;
  value.position.set(...position);
  value.rotation.set(...rotation);
  value.castShadow = true;
  value.receiveShadow = true;
  return value;
}

function box(THREE, size, material, name, position, rotation) {
  return mesh(THREE, new THREE.BoxGeometry(...size), material, name, position, rotation);
}

function cylinder(THREE, radius, height, material, name, position, rotation = [0, 0, 0]) {
  return mesh(
    THREE,
    new THREE.CylinderGeometry(radius, radius, height, 20),
    material,
    name,
    position,
    rotation
  );
}

function createHitArea(THREE, size, position, name) {
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: .001, depthWrite: false });
  const hitArea = box(THREE, size, material, name, position);
  hitArea.userData.interactive = true;
  hitArea.castShadow = false;
  hitArea.receiveShadow = false;
  return hitArea;
}

function buildDesk(THREE, materials) {
  const group = new THREE.Group();
  group.name = "main-desk";
  group.add(
    box(THREE, [3.5, .18, 1.55], materials.wood, "desk-top", [0, 1.05, -.35]),
    box(THREE, [.16, 1.75, 1.18], materials.metal, "desk-leg-left", [-1.45, .15, -.35]),
    box(THREE, [.16, 1.75, 1.18], materials.metal, "desk-leg-right", [1.45, .15, -.35]),
    box(THREE, [1.25, .08, .38], materials.metal, "keyboard", [-.15, 1.18, .12], [-.08, 0, 0]),
    box(THREE, [.26, .1, .4], materials.metal, "mouse", [.9, 1.18, .14])
  );
  const mug = cylinder(THREE, .18, .38, materials.wall, "ceramic-mug", [1.3, 1.34, -.55]);
  mug.userData.functionalProp = "study-break";
  group.add(mug);
  return group;
}

function buildErgonomicChair(THREE, materials) {
  const group = new THREE.Group();
  group.name = "ergonomic-chair";
  group.add(
    box(THREE, [.92, .22, .85], materials.fabric, "chair-seat", [2.35, .7, 1.28], [-.08, -.12, 0]),
    box(THREE, [.88, 1.28, .2], materials.fabric, "chair-back", [2.52, 1.48, 1.55], [-.1, -.12, 0]),
    cylinder(THREE, .1, .72, materials.metal, "chair-column", [2.35, .25, 1.28]),
    cylinder(THREE, .08, 1.15, materials.metal, "chair-base", [2.35, -.08, 1.28], [0, 0, Math.PI / 2])
  );
  return group;
}

function buildArticulatedLamp(THREE, materials) {
  const group = new THREE.Group();
  group.name = "articulated-desk-lamp";
  group.add(
    cylinder(THREE, .25, .07, materials.metal, "lamp-base", [-1.25, 1.2, -.45]),
    cylinder(THREE, .045, .85, materials.metal, "lamp-lower-arm", [-1.25, 1.6, -.45], [0, 0, -.22]),
    cylinder(THREE, .04, .72, materials.metal, "lamp-upper-arm", [-1.08, 2.15, -.55], [0, 0, .75]),
    box(THREE, [.42, .22, .34], materials.metal, "lamp-shade", [-.78, 2.38, -.65], [0, 0, -.35])
  );
  return group;
}

function buildMainMonitor(THREE, materials) {
  const group = new THREE.Group();
  group.name = "main-monitor";
  const frame = box(THREE, [1.85, 1.12, .12], materials.metal, "main-monitor-frame", [0, 1.95, -1.02]);
  const screen = box(THREE, [1.68, .94, .035], materials.glassOff.clone(), "main-monitor-screen", [0, 1.95, -.948]);
  group.add(
    frame,
    screen,
    cylinder(THREE, .07, .58, materials.metal, "monitor-neck", [0, 1.35, -1.05]),
    box(THREE, [.62, .08, .44], materials.metal, "monitor-foot", [0, 1.18, -.98])
  );
  group.userData.screen = screen;
  return group;
}

function buildMemoryWall(THREE, materials) {
  const group = new THREE.Group();
  group.name = "memory-board";
  const board = box(THREE, [2.15, 1.35, .12], materials.wood, "note-board-frame", [-3.35, 2.35, -2.86]);
  group.add(board);
  group.userData.screen = board;
  const paperColors = [0xd3b566, 0xb7c8d8, 0xc7b9d8, 0xd7d0ba];
  for (let index = 0; index < 6; index += 1) {
    const paper = new THREE.MeshStandardMaterial({ color: paperColors[index % paperColors.length], roughness: .9 });
    group.add(box(
      THREE,
      [.5, .34, .018],
      paper,
      `review-card-${index + 1}`,
      [-3.72 + (index % 3) * .48, 2.68 - Math.floor(index / 3) * .48, -2.78],
      [0, 0, (index % 2 ? 1 : -1) * .045]
    ));
  }
  for (let shelf = 0; shelf < 2; shelf += 1) {
    group.add(box(THREE, [2.2, .12, .52], materials.wood, `memory-shelf-${shelf + 1}`, [-3.35, 1.22 - shelf * .72, -2.42]));
    for (let book = 0; book < 5; book += 1) {
      group.add(box(
        THREE,
        [.22 + (book % 2) * .05, .55, .4],
        book % 2 ? materials.fabric : materials.wall,
        `study-binder-${shelf + 1}-${book + 1}`,
        [-4.08 + book * .36, 1.55 - shelf * .72, -2.48],
        [0, 0, (book - 2) * .018]
      ));
    }
  }
  return group;
}

function buildSocialDisplay(THREE, materials) {
  const group = new THREE.Group();
  group.name = "social-display";
  const screen = box(THREE, [1.5, 2.05, .06], materials.glassOff.clone(), "social-screen", [3.35, 2.1, -2.78]);
  group.add(
    box(THREE, [1.7, 2.25, .14], materials.metal, "social-display-frame", [3.35, 2.1, -2.87]),
    screen
  );
  group.userData.screen = screen;
  return group;
}

function buildAssessmentConsole(THREE, materials) {
  const group = new THREE.Group();
  group.name = "assessment-console";
  const screen = box(THREE, [1.48, .78, .07], materials.glassOff.clone(), "assessment-screen", [2.55, .95, -.6], [-.5, 0, 0]);
  group.add(
    box(THREE, [1.7, .95, .16], materials.metal, "assessment-tablet-frame", [2.55, .92, -.66], [-.5, 0, 0]),
    screen,
    box(THREE, [.16, 1.0, .3], materials.metal, "assessment-stand", [2.55, .42, -.96], [-.25, 0, 0])
  );
  group.userData.screen = screen;
  return group;
}

function buildProgressDisplay(THREE, materials) {
  const group = new THREE.Group();
  group.name = "progress-display";
  const screen = box(THREE, [1.85, 1.1, .06], materials.glassOff.clone(), "progress-screen", [-.95, 1.05, -2.8]);
  group.add(
    box(THREE, [2.05, 1.3, .14], materials.metal, "progress-display-frame", [-.95, 1.05, -2.89]),
    screen
  );
  group.userData.screen = screen;
  return group;
}

function buildFutureArchive(THREE, materials) {
  const group = new THREE.Group();
  group.name = "future-archive";
  group.add(box(THREE, [2.7, 1.55, .5], materials.wood, "archive-cabinet", [.75, 3.25, -2.62]));
  for (let index = 0; index < 3; index += 1) {
    group.add(
      box(THREE, [.72, .92, .38], materials.fabric, `future-binder-${index + 1}`, [-.05 + index * .8, 3.25, -2.28]),
      box(THREE, [.42, .1, .02], materials.metal, `future-label-${index + 1}`, [-.05 + index * .8, 3.25, -2.07])
    );
  }
  group.userData.screen = group.getObjectByName("future-label-2");
  return group;
}

function projectedRect(THREE, object, camera) {
  const bounds = new THREE.Box3().setFromObject(object);
  const corners = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) corners.push(new THREE.Vector3(x, y, z).project(camera));
    }
  }
  return {
    left: Math.min(...corners.map(point => point.x)),
    right: Math.max(...corners.map(point => point.x)),
    top: Math.max(...corners.map(point => point.y)),
    bottom: Math.min(...corners.map(point => point.y))
  };
}

function overlapRatio(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom));
  const area = Math.max(.0001, (a.right - a.left) * (a.top - a.bottom));
  return width * height / area;
}

function auditOpeningComposition(THREE, monitor, chair) {
  const camera = new THREE.PerspectiveCamera(OPENING_CAMERA.fov, 16 / 9, .1, 100);
  camera.position.set(...OPENING_CAMERA.position);
  camera.lookAt(new THREE.Vector3(...OPENING_CAMERA.target));
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  monitor.updateWorldMatrix(true, true);
  chair.updateWorldMatrix(true, true);
  return {
    mainMonitorClear: overlapRatio(projectedRect(THREE, monitor, camera), projectedRect(THREE, chair, camera)) < .08
  };
}

export function buildStudyRoom({ THREE, materials }) {
  const group = new THREE.Group();
  group.name = "semantic-study-room";
  const shell = new THREE.Group();
  shell.name = "room-shell";
  shell.add(
    box(THREE, [10, .16, 8], materials.floor, "floor", [0, -.48, 0]),
    box(THREE, [10, 5.5, .18], materials.wall, "back-wall", [0, 2.2, -3.1]),
    box(THREE, [.18, 5.5, 8], materials.wall, "left-wall", [-5, 2.2, 0]),
    box(THREE, [.18, 5.5, 8], materials.wall, "right-wall", [5, 2.2, 0])
  );

  const desk = buildDesk(THREE, materials);
  const chair = buildErgonomicChair(THREE, materials);
  const lamp = buildArticulatedLamp(THREE, materials);
  const monitor = buildMainMonitor(THREE, materials);
  const memory = buildMemoryWall(THREE, materials);
  const social = buildSocialDisplay(THREE, materials);
  const assessment = buildAssessmentConsole(THREE, materials);
  const progress = buildProgressDisplay(THREE, materials);
  const future = buildFutureArchive(THREE, materials);
  group.add(shell, desk, chair, lamp, monitor, memory, social, assessment, progress, future);
  group.updateMatrixWorld(true);

  const hitAreas = {
    desk: createHitArea(THREE, [2.2, 1.45, .45], [0, 1.85, -.7], "hit-desk"),
    memory: createHitArea(THREE, [2.5, 2.7, .35], [-3.35, 1.75, -2.6], "hit-memory"),
    social: createHitArea(THREE, [2.0, 2.6, .35], [3.35, 2.1, -2.6], "hit-social"),
    assessment: createHitArea(THREE, [2.0, 1.4, .7], [2.55, .9, -.4], "hit-assessment"),
    progress: createHitArea(THREE, [2.3, 1.6, .35], [-.95, 1.05, -2.6], "hit-progress"),
    "future-paths": createHitArea(THREE, [3.1, 1.9, .7], [.75, 3.25, -2.4], "hit-future-paths")
  };
  Object.values(hitAreas).forEach(hitArea => group.add(hitArea));

  const stations = {
    desk: { anchor: monitor, target: new THREE.Vector3(0, 1.85, -1), hitArea: hitAreas.desk, screen: monitor.userData.screen, lights: [] },
    memory: { anchor: memory, target: new THREE.Vector3(-3.35, 2, -2.7), hitArea: hitAreas.memory, screen: memory.userData.screen, lights: [] },
    social: { anchor: social, target: new THREE.Vector3(3.35, 2.1, -2.75), hitArea: hitAreas.social, screen: social.userData.screen, lights: [] },
    assessment: { anchor: assessment, target: new THREE.Vector3(2.55, .9, -.55), hitArea: hitAreas.assessment, screen: assessment.userData.screen, lights: [] },
    progress: { anchor: progress, target: new THREE.Vector3(-.95, 1.05, -2.75), hitArea: hitAreas.progress, screen: progress.userData.screen, lights: [] },
    "future-paths": { anchor: future, target: new THREE.Vector3(.75, 3.25, -2.6), hitArea: hitAreas["future-paths"], screen: future.userData.screen, lights: [] }
  };

  const screenHandles = [];

  return {
    group,
    stations,
    openingCamera: OPENING_CAMERA,
    occlusionAudit: auditOpeningComposition(THREE, monitor, chair),
    attachScreens({ stationDefinitions = [], dataByStation = {}, canvasFactory } = {}) {
      for (const definition of stationDefinitions) {
        const physical = stations[definition.id];
        if (!physical?.screen) continue;
        const handle = createStationScreen({
          station: definition,
          data: dataByStation[definition.id],
          canvasFactory
        });
        const texture = new THREE.CanvasTexture(handle.canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        physical.screen.material = physical.screen.material.clone();
        physical.screen.material.map = texture;
        physical.screen.material.emissiveMap = texture;
        physical.screen.material.emissive.setHex(0xffffff);
        physical.screen.material.emissiveIntensity = 0;
        physical.screen.material.needsUpdate = true;
        physical.screenHandle = handle;
        screenHandles.push({ handle, texture });
      }
      return screenHandles.map(({ handle }) => handle);
    },
    dispose() {
      for (const { handle, texture } of screenHandles) {
        handle.dispose();
        texture.dispose();
      }
      const disposedMaterials = new Set();
      group.traverse(object => {
        object.geometry?.dispose?.();
        const values = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of values.filter(Boolean)) {
          if (disposedMaterials.has(material)) continue;
          disposedMaterials.add(material);
          material.map?.dispose?.();
          material.roughnessMap?.dispose?.();
          material.dispose?.();
        }
      });
    }
  };
}
