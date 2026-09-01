import { createStationScreen } from "./screen-ui.js?v=20260901-26";
import { RoundedBoxGeometry } from "../../../vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js?v=20260901-26";

const OPENING_CAMERA = Object.freeze({
  position: [-5.6, 3.05, 5.75],
  target: [-.05, 1.92, -1.02],
  fov: 39
});

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function smoothRange(value, start, end) {
  const x = clamp01((value - start) / Math.max(.0001, end - start));
  return x * x * (3 - 2 * x);
}

function setRevealScale(object, amount, axis = "y") {
  const scale = .04 + .96 * clamp01(amount);
  if (axis === "x") object.scale.set(scale, 1, 1);
  else object.scale.set(1, scale, 1);
}

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

function roundedBox(THREE, size, material, name, position, rotation = [0, 0, 0], radius = .045, segments = 2) {
  const value = mesh(THREE, new RoundedBoxGeometry(size[0], size[1], size[2], segments, radius), material, name, position, rotation);
  value.userData.silhouetteRefined = true;
  return value;
}

function cylinder(THREE, radius, height, material, name, position, rotation = [0, 0, 0], segments = 28) {
  return mesh(THREE, new THREE.CylinderGeometry(radius, radius, height, segments), material, name, position, rotation);
}

function cylinderBetween(THREE, radius, start, end, material, name, segments = 24) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const length = Math.max(.001, direction.length());
  const value = mesh(THREE, new THREE.CylinderGeometry(radius, radius, length, segments), material, name, [0, 0, 0]);
  value.position.copy(from).add(to).multiplyScalar(.5);
  value.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  value.userData.start = [...start];
  value.userData.end = [...end];
  value.userData.curvedSilhouette = true;
  return value;
}

function curvedTube(THREE, points, radius, material, name, tubularSegments = 24, radialSegments = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)), false, "centripetal");
  const value = mesh(THREE, new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false), material, name, [0, 0, 0]);
  value.userData.curvedSilhouette = true;
  value.userData.silhouetteRefined = true;
  return value;
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
  const top = roundedBox(THREE, [3.5, .18, 1.55], materials.wood, "desk-top", [0, 1.05, -.35], [0, 0, 0], .07, 3);
  const keyboard = roundedBox(THREE, [1.25, .08, .38], materials.paintedMetal, "keyboard", [-.15, 1.18, .12], [-.08, 0, 0], .035, 3);
  const mouse = roundedBox(THREE, [.26, .1, .4], materials.paintedMetal, "mouse", [.9, 1.18, .14], [0, 0, 0], .07, 4);
  group.add(
    top,
    roundedBox(THREE, [.16, 1.75, 1.18], materials.paintedMetal, "desk-leg-left", [-1.45, .15, -.35], [0, 0, 0], .035),
    roundedBox(THREE, [.16, 1.75, 1.18], materials.paintedMetal, "desk-leg-right", [1.45, .15, -.35], [0, 0, 0], .035),
    keyboard,
    mouse
  );

  const mug = mesh(THREE, new THREE.CylinderGeometry(.18, .165, .38, 36, 1, true), materials.ceramic, "ceramic-mug", [1.3, 1.34, -.55]);
  mug.userData.functionalProp = "study-break";
  mug.userData.curvedSilhouette = true;
  mug.userData.silhouetteRefined = true;
  const mugBase = cylinder(THREE, .165, .025, materials.ceramic, "mug-base", [1.3, 1.16, -.55], [0, 0, 0], 36);
  const handle = curvedTube(THREE, [
    [1.43, 1.48, -.55],
    [1.57, 1.47, -.55],
    [1.64, 1.39, -.55],
    [1.64, 1.29, -.55],
    [1.57, 1.21, -.55],
    [1.43, 1.2, -.55]
  ], .034, materials.ceramic, "mug-handle", 28, 10);
  group.add(mug, mugBase, handle);
  return group;
}

function buildErgonomicChair(THREE, materials) {
  const group = new THREE.Group();
  group.name = "ergonomic-chair";
  group.userData.silhouetteRefined = true;
  const seat = roundedBox(THREE, [.92, .2, .85], materials.fabric, "chair-seat", [2.35, .7, 1.28], [-.08, -.12, 0], .11, 4);
  const back = roundedBox(THREE, [.82, 1.22, .17], materials.fabric, "chair-back", [2.52, 1.48, 1.55], [-.1, -.12, 0], .12, 4);
  seat.userData.curvedSilhouette = true;
  back.userData.curvedSilhouette = true;
  const lumbar = roundedBox(THREE, [.7, .07, .08], materials.paintedMetal, "chair-lumbar-frame", [2.48, 1.25, 1.42], [-.08, -.12, 0], .035, 3);
  const column = cylinder(THREE, .085, .72, materials.metal, "chair-column", [2.35, .25, 1.28]);
  const hub = cylinder(THREE, .16, .08, materials.metal, "chair-hub", [2.35, -.08, 1.28]);
  group.add(seat, back, lumbar, column, hub);
  for (let index = 0; index < 5; index += 1) {
    const angle = index / 5 * Math.PI * 2;
    const end = [2.35 + Math.cos(angle) * .54, -.11, 1.28 + Math.sin(angle) * .54];
    group.add(cylinderBetween(THREE, .035, [2.35, -.08, 1.28], end, materials.metal, `chair-spoke-${index + 1}`, 14));
    const casterFork = cylinderBetween(THREE, .025, [end[0], -.11, end[2]], [end[0], -.19, end[2]], materials.paintedMetal, `chair-caster-fork-${index + 1}`, 12);
    const wheel = cylinder(THREE, .065, .045, materials.paintedMetal, `chair-wheel-${index + 1}`, [end[0], -.2, end[2]], [Math.PI / 2, 0, -angle], 20);
    wheel.userData.curvedSilhouette = true;
    wheel.userData.silhouetteRefined = true;
    group.add(casterFork, wheel);
  }
  return group;
}

function buildArticulatedLamp(THREE, materials) {
  const group = new THREE.Group();
  group.name = "articulated-desk-lamp";
  const base = [1.45, 1.2, -.58];
  const lowerStart = [1.45, 1.25, -.58];
  const elbow = [1.68, 1.82, -.64];
  const upperEnd = [1.48, 2.16, -.74];
  const shadePosition = [1.4, 2.16, -.8];
  const elbowJoint = mesh(THREE, new THREE.SphereGeometry(.095, 20, 16), materials.metal, "lamp-elbow-joint", elbow);
  const shade = mesh(THREE, new THREE.CylinderGeometry(.12, .25, .34, 32, 1, true), materials.paintedMetal, "lamp-shade", shadePosition, [0, .1, Math.PI / 2 + .18]);
  shade.userData.silhouetteRefined = true;
  shade.userData.curvedSilhouette = true;
  const inner = mesh(THREE, new THREE.CircleGeometry(.115, 28), new THREE.MeshStandardMaterial({ color: 0xffe7c6, roughness: .75, emissive: 0x33200f, emissiveIntensity: .16 }), "lamp-diffuser", [1.29, 2.14, -.81], [0, Math.PI / 2, 0]);
  group.add(
    cylinder(THREE, .25, .07, materials.paintedMetal, "lamp-base", base),
    cylinderBetween(THREE, .042, lowerStart, elbow, materials.metal, "lamp-lower-arm"),
    elbowJoint,
    cylinderBetween(THREE, .038, elbow, upperEnd, materials.metal, "lamp-upper-arm"),
    shade,
    inner
  );
  return group;
}

function buildMainMonitor(THREE, materials) {
  const group = new THREE.Group();
  group.name = "main-monitor";
  group.userData.silhouetteRefined = true;
  const frame = roundedBox(THREE, [1.85, 1.12, .12], materials.paintedMetal, "main-monitor-frame", [0, 1.95, -1.02], [0, 0, 0], .07, 4);
  const screen = roundedBox(THREE, [1.68, .94, .035], materials.glassOff.clone(), "main-monitor-screen", [0, 1.95, -.948], [0, 0, 0], .035, 3);
  screen.userData.silhouetteRefined = true;
  group.add(
    frame,
    screen,
    cylinder(THREE, .065, .58, materials.metal, "monitor-neck", [0, 1.35, -1.05]),
    roundedBox(THREE, [.62, .08, .44], materials.paintedMetal, "monitor-foot", [0, 1.18, -.98], [0, 0, 0], .04, 3)
  );
  group.userData.screen = screen;
  return group;
}

function buildMemoryWall(THREE, materials) {
  const group = new THREE.Group();
  group.name = "memory-board";
  const board = roundedBox(THREE, [2.15, 1.35, .12], materials.wood, "note-board-frame", [-3.35, 2.35, -2.86], [0, 0, 0], .045, 2);
  group.add(board);
  group.userData.screen = board;
  const paperColors = [0xd3b566, 0xb7c8d8, 0xc7b9d8, 0xd7d0ba];
  for (let index = 0; index < 6; index += 1) {
    const paper = new THREE.MeshStandardMaterial({ color: paperColors[index % paperColors.length], roughness: .92, metalness: 0 });
    group.add(roundedBox(THREE, [.5, .34, .018], paper, `review-card-${index + 1}`, [-3.72 + (index % 3) * .48, 2.68 - Math.floor(index / 3) * .48, -2.78], [0, 0, (index % 2 ? 1 : -1) * .045], .012, 2));
  }
  for (let shelf = 0; shelf < 2; shelf += 1) {
    group.add(roundedBox(THREE, [2.2, .12, .52], materials.wood, `memory-shelf-${shelf + 1}`, [-3.35, 1.22 - shelf * .72, -2.42], [0, 0, 0], .035, 2));
    for (let book = 0; book < 5; book += 1) {
      const width = .2 + (book % 3) * .025;
      const height = .51 + (book % 2) * .055;
      group.add(roundedBox(THREE, [width, height, .39], book % 2 ? materials.fabric : materials.wall, `study-binder-${shelf + 1}-${book + 1}`, [-4.08 + book * .36, 1.55 - shelf * .72 + (height - .51) / 2, -2.48], [0, 0, (book - 2) * .018], .018, 2));
    }
  }
  return group;
}

function buildSocialDisplay(THREE, materials) {
  const group = new THREE.Group();
  group.name = "social-display";
  const screen = roundedBox(THREE, [1.5, 2.05, .06], materials.glassOff.clone(), "social-screen", [3.35, 2.1, -2.78], [0, 0, 0], .045, 3);
  group.add(roundedBox(THREE, [1.7, 2.25, .14], materials.paintedMetal, "social-display-frame", [3.35, 2.1, -2.87], [0, 0, 0], .08, 3), screen);
  group.userData.screen = screen;
  return group;
}

function buildAssessmentConsole(THREE, materials) {
  const group = new THREE.Group();
  group.name = "assessment-console";
  const screen = roundedBox(THREE, [1.48, .78, .07], materials.glassOff.clone(), "assessment-screen", [2.55, .95, -.6], [-.5, 0, 0], .04, 3);
  group.add(
    roundedBox(THREE, [1.7, .95, .16], materials.paintedMetal, "assessment-tablet-frame", [2.55, .92, -.66], [-.5, 0, 0], .065, 3),
    screen,
    roundedBox(THREE, [.16, 1.0, .3], materials.paintedMetal, "assessment-stand", [2.55, .42, -.96], [-.25, 0, 0], .035, 2)
  );
  group.userData.screen = screen;
  return group;
}

function buildProgressDisplay(THREE, materials) {
  const group = new THREE.Group();
  group.name = "progress-display";
  const screen = roundedBox(THREE, [1.85, 1.1, .06], materials.glassOff.clone(), "progress-screen", [-.95, 1.05, -2.8], [0, 0, 0], .045, 3);
  group.add(roundedBox(THREE, [2.05, 1.3, .14], materials.paintedMetal, "progress-display-frame", [-.95, 1.05, -2.89], [0, 0, 0], .07, 3), screen);
  group.userData.screen = screen;
  return group;
}

function buildFutureArchive(THREE, materials) {
  const group = new THREE.Group();
  group.name = "future-archive";
  group.add(
    roundedBox(THREE, [3.0, 1.8, .48], materials.wood, "archive-cabinet", [.75, 3.18, -2.72], [0, 0, 0], .07, 3),
    roundedBox(THREE, [2.32, 1.28, .11], materials.paintedMetal, "future-directory-frame", [.75, 3.26, -2.43], [0, 0, 0], .06, 3)
  );
  const screen = roundedBox(THREE, [2.14, 1.1, .035], materials.glassOff.clone(), "future-directory-screen", [.75, 3.26, -2.362], [0, 0, 0], .035, 3);
  group.add(screen);
  for (let index = 0; index < 3; index += 1) {
    group.add(roundedBox(THREE, [.44 + index * .025, .3 + (index % 2) * .035, .3], materials.fabric, `future-binder-${index + 1}`, [-.05 + index * .8, 2.38, -2.48], [0, 0, (index - 1) * .02], .025, 2));
  }
  group.userData.screen = screen;
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
  return { mainMonitorClear: overlapRatio(projectedRect(THREE, monitor, camera), projectedRect(THREE, chair, camera)) < .08 };
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
    box(THREE, [.18, 5.5, 8], materials.wall, "right-wall", [5, 2.2, 0]),
    roundedBox(THREE, [9.62, 5.12, .055], materials.paintedMetal, "back-wall-inset", [0, 2.2, -2.975], [0, 0, 0], .08, 3),
    roundedBox(THREE, [.055, 5.12, 7.62], materials.paintedMetal, "left-wall-inset", [-4.875, 2.2, 0], [0, 0, 0], .08, 3),
    roundedBox(THREE, [.055, 5.12, 7.62], materials.paintedMetal, "right-wall-inset", [4.875, 2.2, 0], [0, 0, 0], .08, 3),
    roundedBox(THREE, [.075, 4.92, .085], materials.metal, "blue-cove-left", [-4.72, 2.2, -2.83], [0, 0, 0], .028, 3),
    roundedBox(THREE, [.075, 4.92, .085], materials.metal, "blue-cove-right", [4.72, 2.2, -2.83], [0, 0, 0], .028, 3),
    roundedBox(THREE, [9.48, .09, .11], materials.metal, "floor-edge-trim", [0, -.34, -2.82], [0, 0, 0], .03, 3)
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
    "future-paths": createHitArea(THREE, [3.1, 2.0, .7], [.75, 3.15, -2.35], "hit-future-paths")
  };
  Object.values(hitAreas).forEach(hitArea => group.add(hitArea));

  const stations = {
    desk: { anchor: monitor, target: new THREE.Vector3(0, 1.9, -1), hitArea: hitAreas.desk, screen: monitor.userData.screen, lights: [] },
    memory: { anchor: memory, target: new THREE.Vector3(-3.35, 2.2, -2.7), hitArea: hitAreas.memory, screen: memory.userData.screen, lights: [] },
    social: { anchor: social, target: new THREE.Vector3(3.35, 2.1, -2.75), hitArea: hitAreas.social, screen: social.userData.screen, lights: [] },
    assessment: { anchor: assessment, target: new THREE.Vector3(2.55, .95, -.58), hitArea: hitAreas.assessment, screen: assessment.userData.screen, lights: [] },
    progress: { anchor: progress, target: new THREE.Vector3(-.95, 1.08, -2.75), hitArea: hitAreas.progress, screen: progress.userData.screen, lights: [] },
    "future-paths": { anchor: future, target: new THREE.Vector3(.75, 3.26, -2.36), hitArea: hitAreas["future-paths"], screen: future.userData.screen, lights: [] }
  };

  const reviewCards = Array.from({ length: 6 }, (_, index) => group.getObjectByName(`review-card-${index + 1}`));
  const futureBinders = Array.from({ length: 3 }, (_, index) => group.getObjectByName(`future-binder-${index + 1}`));
  const lampShade = group.getObjectByName("lamp-shade");
  const lampShadeRest = lampShade.rotation.z;
  const assessmentBaseY = assessment.position.y;
  const progressBaseY = progress.position.y;
  const socialBaseZ = social.position.z;
  const screenHandles = [];
  const parallaxLayers = [
    [group.getObjectByName("review-card-1"), .9],
    [group.getObjectByName("review-card-3"), .72],
    [group.getObjectByName("review-card-5"), .56],
    [group.getObjectByName("ceramic-mug"), .44],
    [group.getObjectByName("keyboard"), .3],
    [group.getObjectByName("mouse"), .24],
    [group.getObjectByName("future-binder-1"), .5],
    [group.getObjectByName("future-binder-2"), .38],
    [group.getObjectByName("future-binder-3"), .28]
  ].filter(([object]) => Boolean(object)).map(([object, depth]) => ({
    object,
    depth,
    baseX: object.position.x,
    baseY: object.position.y
  }));

  const roundedProps = [];
  const curvedProps = [];
  group.traverse(object => {
    if (object.userData?.silhouetteRefined) roundedProps.push(object);
    if (object.userData?.curvedSilhouette) curvedProps.push(object);
  });

  return {
    group,
    stations,
    openingCamera: OPENING_CAMERA,
    occlusionAudit: auditOpeningComposition(THREE, monitor, chair),
    realismAudit: Object.freeze({
      roundedProps: roundedProps.length,
      curvedProps: curvedProps.length
    }),
    parallaxAudit: Object.freeze({
      count: parallaxLayers.length,
      depths: Object.freeze(parallaxLayers.map(layer => layer.depth))
    }),
    setParallax({ x = 0, y = 0 } = {}) {
      const offsetX = Number(x) || 0;
      const offsetY = Number(y) || 0;
      for (const layer of parallaxLayers) {
        layer.object.position.x = layer.baseX + offsetX * layer.depth * 4;
        layer.object.position.y = layer.baseY - offsetY * layer.depth * 2.5;
      }
    },
    setJourney(value) {
      const journey = clamp01(value);
      const chairMove = smoothRange(journey, .135, .225);
      chair.position.x = chairMove * -3.0;
      chair.position.z = chairMove * .4;
      chair.rotation.y = chairMove * .12;

      const lampWork = smoothRange(journey, .02, .11);
      lampShade.rotation.z = lampShadeRest - lampWork * .16;

      setRevealScale(stations.desk.screen, smoothRange(journey, 0, .05), "y");
      reviewCards.forEach((card, index) => {
        const reveal = smoothRange(journey, .15 + index * .012, .215 + index * .012);
        const scale = .72 + reveal * .28;
        card.scale.set(scale, scale, 1);
      });

      const socialReveal = smoothRange(journey, .35, .43);
      social.position.z = socialBaseZ + socialReveal * .07;
      setRevealScale(stations.social.screen, socialReveal, "y");

      const assessmentReveal = smoothRange(journey, .52, .62);
      assessment.position.y = assessmentBaseY + assessmentReveal * .11;
      assessment.rotation.x = -assessmentReveal * .025;
      setRevealScale(stations.assessment.screen, smoothRange(journey, .51, .59), "y");

      const progressReveal = smoothRange(journey, .70, .80);
      progress.position.y = progressBaseY + progressReveal * .09;
      setRevealScale(stations.progress.screen, smoothRange(journey, .68, .76), "x");

      setRevealScale(stations["future-paths"].screen, smoothRange(journey, .84, .91), "y");
      futureBinders.forEach((binder, index) => {
        const reveal = smoothRange(journey, .86 + index * .015, .92 + index * .015);
        const scale = .82 + reveal * .18;
        binder.scale.set(scale, scale, scale);
      });

      group.updateMatrixWorld(true);
      return chairMove;
    },
    attachScreens({ stationDefinitions = [], dataByStation = {}, canvasFactory } = {}) {
      for (const definition of stationDefinitions) {
        const physical = stations[definition.id];
        if (!physical?.screen) continue;
        const handle = createStationScreen({ station: definition, data: dataByStation[definition.id], canvasFactory });
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
          material.normalMap?.dispose?.();
          material.dispose?.();
        }
      });
    }
  };
}
