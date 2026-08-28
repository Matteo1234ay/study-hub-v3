import { createRoomMaterials } from "./materials.js?v=20260828-15";
import { buildStudyRoom } from "./build-room.js?v=20260828-15";
import { createCameraTimeline } from "./camera-timeline.js?v=20260828-16";
import { createLightingController } from "./lighting-controller.js?v=20260828-15";
import { createInteractionController } from "./interaction-controller.js?v=20260828-15";
import { createQualityController } from "./quality-controller.js?v=20260828-15";

function createLightRig(THREE, room) {
  const ambient = new THREE.HemisphereLight(0xb7c8dc, 0x17130f, .24);
  const roomLight = new THREE.PointLight(0xffe5c0, 0, 18, 1.5);
  roomLight.position.set(0, 4.8, 1.2);
  const positions = {
    desk: [-.8, 2.7, -.2], memory: [-3.2, 3.4, -1.7], social: [3.2, 3.4, -1.8],
    assessment: [2.5, 2.1, .1], progress: [-.8, 2.4, -1.9], future: [.8, 4.5, -1.8]
  };
  const rig = { ambient, room: roomLight };
  for (const [key, position] of Object.entries(positions)) {
    const light = new THREE.PointLight(key === "progress" ? 0x9de1b7 : 0x9acbff, 0, 5.5, 1.7);
    light.position.set(...position);
    const station = room.stations[key === "future" ? "future-paths" : key];
    rig[key] = { light, screen: station?.screen };
  }
  return rig;
}

function resolveCameraLayout(width, height) {
  return width <= 760 || height > width * 1.12 ? "mobile" : "desktop";
}

function initializeRoom({ THREE, canvas, stations, reducedMotion, onActivate }) {
  let renderer = null;
  let room = null;
  let interaction = null;
  try {
    const initialRect = canvas.getBoundingClientRect();
    const compact = resolveCameraLayout(initialRect.width || globalThis.innerWidth || 1440, initialRect.height || globalThis.innerHeight || 900) === "mobile";
    const quality = createQualityController({
      devicePixelRatio: globalThis.devicePixelRatio ?? 1,
      reducedMotion,
      initialProfile: compact ? "balanced" : undefined
    });
    renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.profile !== "low", alpha: false, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = quality.profile === "high";
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b10);
    scene.fog = new THREE.Fog(0x080b10, 11, 24);
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 50);
    const materials = createRoomMaterials(THREE);
    room = buildStudyRoom({ THREE, materials });
    room.attachScreens({
      stationDefinitions: stations,
      dataByStation: Object.fromEntries(stations.map(station => [station.id, station.screenData ?? {}]))
    });
    scene.add(room.group);
    const lightRig = createLightRig(THREE, room);
    scene.add(lightRig.ambient, lightRig.room);
    for (const key of ["desk", "memory", "social", "assessment", "progress", "future"]) scene.add(lightRig[key].light);
    const keyLight = new THREE.DirectionalLight(0xdde8f5, .48);
    keyLight.position.set(-4, 6, 5);
    keyLight.castShadow = quality.profile === "high";
    scene.add(keyLight);
    interaction = createInteractionController({ THREE, canvas, camera, stations: room.stations, onActivate });
    return { renderer, room, interaction, quality, scene, camera, lightRig };
  } catch (error) {
    interaction?.dispose();
    room?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss?.();
    throw error;
  }
}

export async function createStudyRoomRenderer({ canvas, stations, reducedMotion = false, onActivate = () => {}, onFailure = () => {} }) {
  if (!canvas?.getContext) throw new Error("Canvas della stanza non disponibile");
  const THREE = await import("../../../vendor/three/three.module.min.js?v=20260828-15");
  const { renderer, room, interaction, quality, scene, camera, lightRig } = initializeRoom({
    THREE, canvas, stations, reducedMotion, onActivate
  });

  let cameraLayout = "desktop";
  let timeline = createCameraTimeline({ layout: cameraLayout });
  const lighting = createLightingController(lightRig);
  let journey = 0;
  let disposed = false;
  let frameId = 0;
  let focusFrameId = 0;
  let finishFocus = null;
  let lastFrame = performance.now();
  let lastProfile = quality.profile;

  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const nextLayout = resolveCameraLayout(width, height);
    if (nextLayout !== cameraLayout) {
      cameraLayout = nextLayout;
      timeline = createCameraTimeline({ layout: cameraLayout });
    }
    renderer.setPixelRatio(quality.getDprCap());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (reducedMotion) draw(performance.now());
  }

  function draw(now) {
    if (disposed) return;
    if (!reducedMotion) frameId = requestAnimationFrame(draw);
    if (!quality.isVisible) return;
    const shot = reducedMotion ? timeline.overview() : timeline.sample(journey);
    camera.position.set(...shot.position);
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(new THREE.Vector3(...shot.target));
    const parallax = reducedMotion || cameraLayout === "mobile" ? { x: 0, y: 0 } : interaction.update();
    camera.rotation.y += parallax.x;
    camera.rotation.x += parallax.y;
    lighting.apply(reducedMotion ? 1 : journey);
    renderer.render(scene, camera);
    if (quality.recordFrame(now - lastFrame) && quality.profile !== lastProfile) {
      lastProfile = quality.profile;
      renderer.shadowMap.enabled = quality.profile === "high";
      resize();
    }
    lastFrame = now;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  function onVisibilityChange() {
    quality.setVisible(!document.hidden);
    if (!document.hidden) {
      lastFrame = performance.now();
      if (reducedMotion) draw(lastFrame);
    }
  }
  function onContextLost(event) {
    event.preventDefault();
    quality.setVisible(false);
    onFailure(new Error("Contesto WebGL interrotto"));
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  canvas.addEventListener("webglcontextlost", onContextLost, { once: true });
  resize();
  lighting.apply(reducedMotion ? 1 : 0);
  if (reducedMotion) draw(performance.now());
  else frameId = requestAnimationFrame(draw);

  return {
    setJourney(value) {
      journey = Math.min(1, Math.max(0, Number(value) || 0));
    },
    getActiveStation(value) {
      return timeline.activeStation(value);
    },
    resize,
    focusStation(stationId, { duration = 650 } = {}) {
      const index = stations.findIndex(station => station.id === stationId);
      if (index < 0 || disposed) return Promise.resolve(false);
      if (focusFrameId) cancelAnimationFrame(focusFrameId);
      finishFocus?.(false);
      const startValue = journey;
      const destination = timeline.stationProgress(stationId);
      const startTime = performance.now();
      const milliseconds = Math.min(900, Math.max(400, Number(duration) || 650));
      return new Promise(resolve => {
        finishFocus = resolve;
        function step(now) {
          if (disposed) {
            finishFocus = null;
            resolve(false);
            return;
          }
          const linear = Math.min(1, Math.max(0, (now - startTime) / milliseconds));
          const eased = linear * linear * (3 - 2 * linear);
          journey = startValue + (destination - startValue) * eased;
          if (linear < 1) focusFrameId = requestAnimationFrame(step);
          else {
            focusFrameId = 0;
            finishFocus = null;
            resolve(true);
          }
        }
        focusFrameId = requestAnimationFrame(step);
      });
    },
    getAudit() {
      return { ...room.occlusionAudit, profile: quality.profile, dpr: quality.getDprCap(), cameraLayout };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameId);
      if (focusFrameId) cancelAnimationFrame(focusFrameId);
      finishFocus?.(false);
      finishFocus = null;
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      interaction.dispose();
      room.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    }
  };
}
