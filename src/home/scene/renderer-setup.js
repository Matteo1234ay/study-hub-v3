import { createAssetRegistry } from "./asset-registry.js?v=20260901-27";
import { createRoomMaterials } from "./materials.js?v=20260901-26";
import { buildStudyRoom } from "./build-room.js?v=20260901-26";
import { createInteractionController } from "./interaction-controller.js?v=20260901-26";
import { createQualityController } from "./quality-controller.js?v=20260901-26";
import { RoomEnvironment } from "../../../vendor/three/examples/jsm/environments/RoomEnvironment.js?v=20260901-26";

export function configureStudyRenderer(THREE, renderer, quality) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = quality?.profile === "high";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = quality?.profile !== "low";
  return renderer;
}

export function resolveCameraLayout(width, height) {
  return width <= 760 || height > width * 1.12 ? "mobile" : "desktop";
}

export function sharpenScreenTextures(THREE, renderer, room) {
  const maxAnisotropy = Math.max(1, Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  for (const station of Object.values(room.stations)) {
    const texture = station.screen?.material?.map;
    if (!texture) continue;
    texture.anisotropy = maxAnisotropy;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }
}

export function createRoomParallaxLayers(room) {
  const definitions = [
    ["review-card-1", "memory-notes", "light", 1, 10, { x: .055, y: .035 }, { x: .018, y: .028 }],
    ["review-card-3", "memory-notes", "light", .82, 9, { x: .048, y: .03 }, { x: .015, y: .023 }],
    ["review-card-5", "memory-notes", "light", .68, 8, { x: .042, y: .027 }, { x: .013, y: .02 }],
    ["ceramic-mug", "desk-break", "medium", .58, 7.5, { x: .037, y: .022 }, { x: .011, y: .016 }],
    ["future-binder-1", "future-library", "heavy", .5, 7, { x: .032, y: .021 }, { x: .009, y: .014 }],
    ["future-binder-2", "future-library", "heavy", .4, 6, { x: .027, y: .018 }, { x: .007, y: .011 }],
    ["future-binder-3", "future-library", "heavy", .32, 5.5, { x: .023, y: .016 }, { x: .006, y: .009 }],
    ["keyboard", "desk-input", "heavy", .24, 5, { x: .018, y: .012 }, { x: .004, y: .007 }],
    ["mouse", "desk-input", "medium", .18, 4.2, { x: .014, y: .01 }, { x: .003, y: .006 }]
  ];
  return definitions.map(([name, cluster, weight, depth, damping, translation, rotation]) => ({
    object: room.group.getObjectByName(name), cluster, weight, depth, damping, translation, rotation
  })).filter(layer => Boolean(layer.object));
}

function mountLoadedLamp({ THREE, room, loadedLamp }) {
  if (!loadedLamp) return false;
  const proceduralLamp = room.group.getObjectByName("articulated-desk-lamp");
  if (!proceduralLamp?.parent) return false;

  loadedLamp.updateMatrixWorld(true);
  const initialBounds = new THREE.Box3().setFromObject(loadedLamp);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(initialSize.y) || initialSize.y <= .001) return false;

  loadedLamp.scale.multiplyScalar(.98 / initialSize.y);
  loadedLamp.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(loadedLamp);
  const center = bounds.getCenter(new THREE.Vector3());
  loadedLamp.position.x += 1.48 - center.x;
  loadedLamp.position.y += 1.18 - bounds.min.y;
  loadedLamp.position.z += -.68 - center.z;
  loadedLamp.name = "articulated-desk-lamp";
  loadedLamp.userData = { ...proceduralLamp.userData, ...loadedLamp.userData, sourceAsset: "desk-lamp-arm-01" };
  loadedLamp.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });

  proceduralLamp.name = "articulated-desk-lamp-fallback";
  proceduralLamp.visible = false;
  proceduralLamp.parent.add(loadedLamp);
  return true;
}

const STUDIO_FALLBACK_NAMES = Object.freeze([
  "desk-top", "desk-leg-left", "desk-leg-right", "desk-crossbar",
  "keyboard", "mouse", "ceramic-mug", "mug-base", "mug-handle",
  "chair-seat", "chair-back", "chair-column", "chair-hub",
  "monitor-frame", "monitor-neck", "monitor-foot"
]);

export function applyStudioCoreAxisCorrection(loadedStudio) {
  if (!loadedStudio?.rotation) return loadedStudio;
  loadedStudio.rotation.x += Math.PI / 2;
  loadedStudio.userData = {
    ...(loadedStudio.userData ?? {}),
    axisCorrection: "blender-z-up-to-authored-three-y-up"
  };
  loadedStudio.updateMatrixWorld?.(true);
  return loadedStudio;
}

function mountStudioCore({ room, loadedStudio }) {
  if (!loadedStudio) return false;
  applyStudioCoreAxisCorrection(loadedStudio);
  loadedStudio.name = "studio-core-asset";
  loadedStudio.userData.sourceAsset = "studio-core";
  loadedStudio.userData.archiveBase = {
    position: loadedStudio.position.clone(),
    rotation: loadedStudio.rotation.clone(),
    scale: loadedStudio.scale.clone()
  };
  loadedStudio.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.name === "studio-monitor-screen") child.visible = false;
  });

  const hiddenFallback = [];
  for (const name of STUDIO_FALLBACK_NAMES) {
    const object = room.group.getObjectByName(name);
    if (!object || object.name === "main-monitor-screen") continue;
    object.visible = false;
    hiddenFallback.push(object);
  }
  loadedStudio.userData.hiddenFallback = hiddenFallback;
  room.heroAsset = loadedStudio;
  room.group.add(loadedStudio);
  return true;
}

function createLightRig(THREE, room) {
  const ambient = new THREE.HemisphereLight(0xb9d8ff, 0x06112f, .58);
  const roomLight = new THREE.PointLight(0xddeaff, 0, 20, 1.35);
  roomLight.position.set(0, 4.8, 1.2);
  const positions = {
    desk: [-.7, 2.75, -.1], memory: [-3.15, 3.3, -1.55], social: [3.2, 3.4, -1.65],
    assessment: [2.55, 2.15, .15], progress: [-.9, 2.45, -1.75], future: [.8, 4.45, -1.75]
  };
  const colors = { desk: 0xffcf9a, memory: 0xefc98d, social: 0x8fc8ff, assessment: 0xa5cbff, progress: 0x9de1b7, future: 0xcbd3dc };
  const target = new THREE.Object3D();
  const guide = new THREE.SpotLight(0xbcd7ff, 0, 13, Math.PI / 5, .58, 1.45);
  guide.target = target;
  const rig = { ambient, room: roomLight, guide: { light: guide, target } };
  for (const [key, position] of Object.entries(positions)) {
    const light = new THREE.PointLight(colors[key], 0, 7.5, 1.5);
    light.position.set(...position);
    rig[key] = { light, screen: room.stations[key === "future" ? "future-paths" : key]?.screen };
  }
  return rig;
}

export function initializeStudyRoom({ THREE, canvas, stations, reducedMotion, onActivate }) {
  let renderer = null, room = null, interaction = null, environmentTarget = null, assetRegistry = null;
  try {
    const rect = canvas.getBoundingClientRect();
    const compact = resolveCameraLayout(rect.width || globalThis.innerWidth || 1440, rect.height || globalThis.innerHeight || 900) === "mobile";
    const quality = createQualityController({ devicePixelRatio: globalThis.devicePixelRatio ?? 1, reducedMotion, initialProfile: compact ? "balanced" : undefined });
    renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.profile !== "low", alpha: false, powerPreference: "high-performance" });
    configureStudyRenderer(THREE, renderer, quality);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071536);
    scene.fog = new THREE.Fog(0x071536, 13, 27);
    const environmentScene = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    environmentTarget = pmremGenerator.fromScene(environmentScene, .04);
    scene.environment = environmentTarget.texture;
    if ("environmentIntensity" in scene) scene.environmentIntensity = compact ? .58 : .7;
    environmentScene.dispose();
    pmremGenerator.dispose();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 50);
    room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
    room.attachScreens({ stationDefinitions: stations, dataByStation: Object.fromEntries(stations.map(station => [station.id, station.screenData ?? {}])) });
    sharpenScreenTextures(THREE, renderer, room);
    scene.add(room.group);

    assetRegistry = createAssetRegistry({ THREE });
    const lampPromise = assetRegistry.loadDeskLamp().then(loadedLamp => {
      if (loadedLamp) mountLoadedLamp({ THREE, room, loadedLamp });
      return loadedLamp;
    });
    const studioCorePromise = assetRegistry.loadStudioCore().then(loadedStudio => {
      if (loadedStudio) mountStudioCore({ room, loadedStudio });
      return loadedStudio;
    });
    const heroAssetPromise = Promise.allSettled([lampPromise, studioCorePromise]);

    const lightRig = createLightRig(THREE, room);
    scene.add(lightRig.ambient, lightRig.room, lightRig.guide.light, lightRig.guide.target);
    for (const key of ["desk", "memory", "social", "assessment", "progress", "future"]) scene.add(lightRig[key].light);
    const keyLight = new THREE.DirectionalLight(0xe5f0ff, 1.02);
    keyLight.position.set(-4, 6, 5);
    keyLight.castShadow = quality.profile === "high";
    const shadowSize = quality.profile === "high" ? 1024 : 512;
    keyLight.shadow.mapSize.set(shadowSize, shadowSize);
    keyLight.shadow.bias = -.00035;
    keyLight.shadow.normalBias = .025;
    const fillLight = new THREE.DirectionalLight(0x7aa8ff, .4);
    fillLight.position.set(4, 3.5, 4.5);
    scene.add(keyLight, fillLight);
    interaction = createInteractionController({ THREE, canvas, camera, stations: room.stations, onActivate });
    return { renderer, room, interaction, quality, scene, camera, lightRig, environmentTarget, assetRegistry, heroAssetPromise };
  } catch (error) {
    interaction?.dispose();
    assetRegistry?.dispose();
    room?.dispose();
    environmentTarget?.dispose?.();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    throw error;
  }
}