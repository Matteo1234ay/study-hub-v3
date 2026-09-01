import { createAssetRegistry } from "./asset-registry.js?v=20260901-31";
import { createRoomMaterials } from "./materials.js?v=20260901-31";
import { buildStudyRoom } from "./build-room.js?v=20260901-31";
import { createInteractionController } from "./interaction-controller.js?v=20260901-31";
import { createQualityController } from "./quality-controller.js?v=20260901-31";
import { prepareHomeV30 } from "./home-v30-mount.js?v=20260901-31";
import { RoomEnvironment } from "../../../vendor/three/examples/jsm/environments/RoomEnvironment.js?v=20260901-31";

export function configureStudyRenderer(THREE, renderer, quality) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
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

function createLightRig(THREE, room) {
  const ambient = new THREE.HemisphereLight(0xf1e6dc, 0x2a3038, .50);
  const roomLight = new THREE.PointLight(0xffd7ad, .24, 18, 1.4);
  roomLight.position.set(1.6, 3.0, 1.4);
  const positions = {
    desk: [-.7, 2.75, -.1], memory: [-3.15, 3.3, -1.55], social: [3.2, 3.4, -1.65],
    assessment: [2.55, 2.15, .15], progress: [-.9, 2.45, -1.75], future: [.8, 4.45, -1.75]
  };
  const colors = { desk: 0xffca8b, memory: 0xf0c994, social: 0x9ab8d5, assessment: 0xa9bfd6, progress: 0xa8c7b4, future: 0xcbd3dc };
  const target = new THREE.Object3D();
  const guide = new THREE.SpotLight(0xb9cadb, 0, 13, Math.PI / 5, .58, 1.45);
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
    scene.background = new THREE.Color(0x17191b);
    scene.fog = new THREE.Fog(0x1d2022, 15, 32);
    const environmentScene = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    environmentTarget = pmremGenerator.fromScene(environmentScene, .04);
    scene.environment = environmentTarget.texture;
    if ("environmentIntensity" in scene) scene.environmentIntensity = compact ? .66 : .78;
    environmentScene.dispose();
    pmremGenerator.dispose();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 60);

    room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
    room.attachScreens({ stationDefinitions: stations, dataByStation: Object.fromEntries(stations.map(station => [station.id, station.screenData ?? {}])) });
    sharpenScreenTextures(THREE, renderer, room);
    room.group.visible = false;
    scene.add(room.group);

    assetRegistry = createAssetRegistry({ THREE });
    const heroState = { heroMode: "pending", homeV30: null, error: null };
    const heroAssetPromise = assetRegistry.loadHomeV30().then(result => {
      if (result?.status === "ok") {
        const homeV30 = prepareHomeV30({ THREE, scene, result });
        if (homeV30) {
          const state = { heroMode: "v30", homeV30, error: null };
          Object.assign(heroState, state);
          return state;
        }
        const state = { heroMode: "poster", homeV30: null, error: new Error("Scena V30 non valida") };
        Object.assign(heroState, state);
        return state;
      }
      const state = { heroMode: "poster", homeV30: null, error: result?.error ?? new Error("Caricamento V30 non riuscito"), status: result?.status ?? "error" };
      Object.assign(heroState, state);
      return state;
    }).catch(error => {
      const state = { heroMode: "poster", homeV30: null, error };
      Object.assign(heroState, state);
      return state;
    });

    const lightRig = createLightRig(THREE, room);
    scene.add(lightRig.ambient, lightRig.room, lightRig.guide.light, lightRig.guide.target);
    for (const key of ["desk", "memory", "social", "assessment", "progress", "future"]) scene.add(lightRig[key].light);

    const keyLight = new THREE.DirectionalLight(0xffe3c6, 1.34);
    keyLight.position.set(3.8, 6.2, 4.6);
    keyLight.castShadow = quality.profile === "high";
    const shadowSize = quality.profile === "high" ? 1024 : 512;
    keyLight.shadow.mapSize.set(shadowSize, shadowSize);
    keyLight.shadow.bias = -.00035;
    keyLight.shadow.normalBias = .025;
    const fillLight = new THREE.DirectionalLight(0xb9c8d7, .34);
    fillLight.position.set(-4.6, 3.5, 4.1);
    scene.add(keyLight, fillLight);

    interaction = createInteractionController({ THREE, canvas, camera, stations: room.stations, onActivate });
    return {
      renderer, room, interaction, quality, scene, camera, lightRig,
      environmentTarget, assetRegistry, heroAssetPromise, heroState, keyLight, fillLight
    };
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
