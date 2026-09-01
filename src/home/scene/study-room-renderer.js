import { createCameraTimeline } from "./camera-timeline.js?v=20260901-26";
import { createDirectorController } from "./director-controller.js?v=20260901-26";
import { createLightingController } from "./lighting-controller.js?v=20260901-26";
import { createParallaxRig } from "./parallax-rig.js?v=20260901-26";
import { createArchiveField } from "./archive-field.js?v=20260901-27";
import { resolveArchiveBudget, resolveArchivePhase } from "./archive-state.js?v=20260901-27";
import {
  configureStudyRenderer,
  createRoomParallaxLayers,
  initializeStudyRoom,
  resolveCameraLayout
} from "./renderer-setup.js?v=20260901-27";
import { projectStationScreenToCss } from "./renderer-projection.js?v=20260901-26";

export { configureStudyRenderer };

const ZERO_PARALLAX = Object.freeze({ x: 0, y: 0 });
const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));
const clampVelocity = value => Math.min(6, Math.abs(Number(value) || 0));

function objectScatter(name = "") {
  let hash = 2166136261;
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const x = ((hash & 255) / 255 - .5) * 2;
  const y = (((hash >>> 8) & 255) / 255 - .5) * 2;
  const z = (((hash >>> 16) & 255) / 255 - .5) * 2;
  return { x, y, z };
}

function archiveMass(name = "") {
  if (/book|keyboard|mouse|mug|notebook/i.test(name)) return .34;
  if (/monitor/i.test(name)) return .72;
  if (/chair/i.test(name)) return .86;
  return 1;
}

export async function createStudyRoomRenderer({ canvas, stations, reducedMotion = false, onActivate = () => {}, onFailure = () => {} }) {
  if (!canvas?.getContext) throw new Error("Canvas della stanza non disponibile");
  const THREE = await import("../../../vendor/three/three.module.min.js?v=20260901-26");
  const { renderer, room, interaction, quality, scene, camera, lightRig, environmentTarget, assetRegistry } = initializeStudyRoom({
    THREE, canvas, stations, reducedMotion, onActivate
  });
  const parallaxRig = createParallaxRig({ layers: createRoomParallaxLayers(room), maxLayers: 12 });
  const lighting = createLightingController(lightRig);
  const archiveField = createArchiveField({ THREE, quality, mobile: false });
  scene.add(archiveField.group);

  let cameraLayout = "desktop";
  let timeline = createCameraTimeline({ layout: cameraLayout });
  let director = createDirectorController({ timeline, layout: cameraLayout });
  let journey = 0;
  let scrollVelocity = 0;
  let exitProgress = 0;
  let disposed = false;
  let frameId = 0;
  let focusFrameId = 0;
  let finishFocus = null;
  let lastFrame = performance.now();
  let lastProfile = quality.profile;
  let activeScreenId = null;
  let readySettled = false;
  let resolveReady;
  let rejectReady;
  const readyPromise = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  function syncActiveScreen(stationId) {
    if (stationId === activeScreenId) return false;
    for (const [id, station] of Object.entries(room.stations)) {
      const changed = station.screenHandle?.setActive?.(id === stationId) ?? false;
      if (!changed) continue;
      const texture = station.screen?.material?.map;
      if (texture) texture.needsUpdate = true;
    }
    activeScreenId = stationId;
    return true;
  }

  function syncScreenPresentation(shotStationId, direction) {
    for (const [id, station] of Object.entries(room.stations)) {
      const changed = station.screenHandle?.setPresentation?.({
        active: id === shotStationId,
        read: direction.phase === "read" && id === direction.stationId,
        compact: cameraLayout === "mobile"
      }) ?? false;
      if (!changed) continue;
      const texture = station.screen?.material?.map;
      if (texture) texture.needsUpdate = true;
    }
  }

  function syncHeroArchive(state) {
    const hero = room.heroAsset;
    if (!hero) return;
    const intensity = reducedMotion ? state.archive * .24 : state.fragment * .46 + state.archive * .82;
    hero.traverse(child => {
      if (!child.isMesh || child.name === "studio-monitor-screen") return;
      if (!child.userData.archiveBasePosition) {
        child.userData.archiveBasePosition = child.position.clone();
        child.userData.archiveBaseRotation = child.rotation.clone();
        child.userData.archiveBaseScale = child.scale.clone();
        child.userData.archiveScatter = objectScatter(child.name);
        child.userData.archiveMass = archiveMass(child.name);
      }
      const basePosition = child.userData.archiveBasePosition;
      const baseRotation = child.userData.archiveBaseRotation;
      const baseScale = child.userData.archiveBaseScale;
      const scatter = child.userData.archiveScatter;
      const mass = child.userData.archiveMass;
      const mobility = 1.22 - mass * .62;
      const travel = intensity * mobility;
      child.position.copy(basePosition).add(new THREE.Vector3(
        scatter.x * travel * 1.65,
        (.18 + Math.abs(scatter.y)) * travel * 1.2,
        scatter.z * travel * 1.35
      ));
      child.rotation.set(
        baseRotation.x + scatter.z * travel * .34,
        baseRotation.y + scatter.x * travel * .5,
        baseRotation.z + scatter.y * travel * .28
      );
      const shrink = Math.max(.24, 1 - state.archive * (.42 + mobility * .22));
      child.scale.copy(baseScale).multiplyScalar(shrink);
    });
  }

  function syncArchiveBudget() {
    archiveField.setBudget(resolveArchiveBudget({
      profile: quality.profile,
      mobile: cameraLayout === "mobile"
    }));
  }

  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const nextLayout = resolveCameraLayout(width, height);
    if (nextLayout !== cameraLayout) {
      cameraLayout = nextLayout;
      timeline = createCameraTimeline({ layout: cameraLayout });
      director = createDirectorController({ timeline, layout: cameraLayout });
      syncArchiveBudget();
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
    const frameSeconds = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
    const direction = director.sample(journey, { scrollVelocity });
    const shot = exitProgress > 0 ? timeline.exit(exitProgress) : timeline.sample(journey);
    const archiveState = resolveArchivePhase(journey);
    room.setJourney(journey);
    archiveField.update(journey, archiveState);
    syncHeroArchive(archiveState);
    syncActiveScreen(shot.stationId);
    syncScreenPresentation(shot.stationId, direction);
    camera.position.set(...shot.position);
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(new THREE.Vector3(...shot.target));

    const parallaxEnabled = !reducedMotion && cameraLayout !== "mobile" && exitProgress === 0;
    let cameraParallax = ZERO_PARALLAX;
    if (parallaxEnabled) {
      parallaxRig.setAmplitude(direction.parallaxScale);
      parallaxRig.setTarget(interaction.getParallaxTarget());
      parallaxRig.update(frameSeconds);
      cameraParallax = interaction.update();
    } else {
      interaction.reset();
      parallaxRig.restoreImmediately();
    }
    camera.rotation.y += cameraParallax.x * .35;
    camera.rotation.x += cameraParallax.y * .35;
    lighting.apply(journey, {
      focusStation: direction.stationId,
      target: shot.target,
      cameraPosition: shot.position,
      exitProgress,
      readStrength: direction.readStrength,
      lightingScale: direction.lightingScale
    });
    renderer.render(scene, camera);

    if (!readySettled) {
      readySettled = true;
      resolveReady();
    }
    if (quality.recordFrame(now - lastFrame) && quality.profile !== lastProfile) {
      lastProfile = quality.profile;
      renderer.shadowMap.enabled = quality.profile === "high";
      syncArchiveBudget();
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
    const error = new Error("Contesto WebGL interrotto");
    if (!readySettled) {
      readySettled = true;
      rejectReady(error);
    }
    onFailure(error);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  canvas.addEventListener("webglcontextlost", onContextLost, { once: true });
  syncArchiveBudget();
  resize();
  room.setJourney(0);
  archiveField.update(0, resolveArchivePhase(0));
  lighting.apply(0);
  if (reducedMotion) draw(performance.now());
  else frameId = requestAnimationFrame(draw);

  return {
    ready: readyPromise,
    setJourney(value, { scrollVelocity: nextVelocity = 0 } = {}) {
      journey = clamp01(value);
      scrollVelocity = clampVelocity(nextVelocity);
      if (reducedMotion) draw(performance.now());
    },
    setExitProgress(value) {
      exitProgress = clamp01(value);
      if (reducedMotion) draw(performance.now());
    },
    getActiveStation(value) {
      return timeline.activeStation(value);
    },
    getPresentationState(value, { scrollVelocity: nextVelocity = 0 } = {}) {
      return director.sample(clamp01(value), { scrollVelocity: clampVelocity(nextVelocity) });
    },
    getPathsProjection() {
      return projectStationScreenToCss({ THREE, canvas, camera, stations: room.stations, stationId: "future-paths" });
    },
    resize,
    focusStation(stationId, { duration = 650 } = {}) {
      if (stations.findIndex(station => station.id === stationId) < 0 || disposed) return Promise.resolve(false);
      if (focusFrameId) cancelAnimationFrame(focusFrameId);
      finishFocus?.(false);
      exitProgress = 0;
      scrollVelocity = 0;
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
          const linear = clamp01((now - startTime) / milliseconds);
          const eased = linear * linear * (3 - 2 * linear);
          journey = startValue + (destination - startValue) * eased;
          if (reducedMotion) draw(now);
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
      return {
        ...room.occlusionAudit,
        profile: quality.profile,
        dpr: quality.getDprCap(),
        cameraLayout,
        archivePhase: resolveArchivePhase(journey).phase,
        archiveBudget: resolveArchiveBudget({ profile: quality.profile, mobile: cameraLayout === "mobile" }),
        toneMappingExposure: renderer.toneMappingExposure,
        environmentReady: Boolean(scene.environment),
        parallax: parallaxRig.audit()
      };
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
      parallaxRig.restoreImmediately();
      archiveField.dispose();
      scene.remove(archiveField.group);
      assetRegistry?.dispose();
      room.dispose();
      environmentTarget?.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (!readySettled) {
        readySettled = true;
        rejectReady(new Error("Renderer chiuso prima del primo frame"));
      }
    }
  };
}
