import { createCameraTimeline } from "./camera-timeline.js?v=20260901-29";
import { createHomeV29CameraTimeline } from "./home-v29-camera-timeline.js?v=20260901-29";
import { createHomeV29Controller } from "./home-v29-controller.js?v=20260901-29";
import { createHomeV29Disassembly } from "./home-v29-disassembly.js?v=20260901-29";
import { createHomeV29Lighting } from "./home-v29-lighting.js?v=20260901-29";
import { createDirectorController } from "./director-controller.js?v=20260901-29";
import { createLightingController } from "./lighting-controller.js?v=20260901-29";
import { createParallaxRig } from "./parallax-rig.js?v=20260901-29";
import { createArchiveField } from "./archive-field.js?v=20260901-29";
import { resolveArchiveBudget, resolveArchivePhase } from "./archive-state.js?v=20260901-29";
import {
  configureStudyRenderer,
  createRoomParallaxLayers,
  initializeStudyRoom,
  resolveCameraLayout
} from "./renderer-setup.js?v=20260901-29";
import { projectObjectToCss, projectStationScreenToCss } from "./renderer-projection.js?v=20260901-29";

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
  return {
    x: ((hash & 255) / 255 - .5) * 2,
    y: (((hash >>> 8) & 255) / 255 - .5) * 2,
    z: (((hash >>> 16) & 255) / 255 - .5) * 2
  };
}

function archiveMass(name = "") {
  if (/book|keyboard|mouse|mug|notebook/i.test(name)) return .34;
  if (/monitor/i.test(name)) return .72;
  if (/chair/i.test(name)) return .86;
  return 1;
}

export async function createStudyRoomRenderer({ canvas, stations, reducedMotion = false, onActivate = () => {}, onFailure = () => {} }) {
  if (!canvas?.getContext) throw new Error("Canvas della stanza non disponibile");
  const THREE = await import("../../../vendor/three/three.module.min.js?v=20260901-29");
  const {
    renderer, room, interaction, quality, scene, camera, lightRig, environmentTarget,
    assetRegistry, heroAssetPromise, heroState, keyLight, fillLight
  } = initializeStudyRoom({ THREE, canvas, stations, reducedMotion, onActivate });

  const heroResolution = await heroAssetPromise;
  const homeV29 = heroResolution?.homeV29 ?? heroState.homeV29 ?? null;
  const homeV29Controller = homeV29
    ? createHomeV29Controller({ THREE, root: homeV29.root, animations: homeV29.animations })
    : null;
  const homeV29Disassembly = homeV29
    ? createHomeV29Disassembly({ THREE, root: homeV29.root, reducedMotion })
    : null;
  const homeV29Lighting = homeV29
    ? createHomeV29Lighting({ THREE, scene, renderer, root: homeV29.root, keyLight, fillLight })
    : null;

  const parallaxRig = createParallaxRig({ layers: createRoomParallaxLayers(room), maxLayers: 12 });
  const fallbackLighting = createLightingController(lightRig);
  const archiveField = createArchiveField({ THREE, quality, mobile: false });
  if (homeV29Controller) archiveField.setOrigins(homeV29Controller.getArchiveOrigins());
  scene.add(archiveField.group);

  let cameraLayout = "desktop";
  const createTimeline = layout => homeV29
    ? createHomeV29CameraTimeline({ layout })
    : createCameraTimeline({ layout });
  let timeline = createTimeline(cameraLayout);
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

  function syncFallbackHeroArchive(state) {
    if (homeV29) return;
    const hero = room.heroAsset;
    if (!hero) return;
    const intensity = reducedMotion
      ? state.archive * .24
      : state.knowledge * .06 + state.fragment * .46 + state.archive * .82;
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
      timeline = createTimeline(cameraLayout);
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
    if (homeV29Controller) {
      homeV29Disassembly?.reset();
      homeV29Controller.update(journey);
      homeV29Disassembly?.apply(journey, archiveState);
      homeV29Lighting?.apply(journey, archiveState);
    } else {
      syncFallbackHeroArchive(archiveState);
    }
    archiveField.update(journey, archiveState);
    syncActiveScreen(shot.stationId);
    syncScreenPresentation(shot.stationId, direction);

    camera.position.set(...shot.position);
    camera.fov = shot.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(new THREE.Vector3(...shot.target));

    const parallaxEnabled = !homeV29 && !reducedMotion && cameraLayout !== "mobile" && exitProgress === 0;
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

    if (!homeV29Lighting) {
      fallbackLighting.apply(journey, {
        focusStation: direction.stationId,
        target: shot.target,
        cameraPosition: shot.position,
        exitProgress,
        readStrength: direction.readStrength,
        lightingScale: direction.lightingScale
      });
    }
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
  homeV29Disassembly?.reset();
  homeV29Controller?.update(0);
  homeV29Lighting?.apply(0, resolveArchivePhase(0));
  archiveField.update(0, resolveArchivePhase(0));
  if (!homeV29Lighting) fallbackLighting.apply(0);
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
      if (homeV29Controller) {
        const pathsOrigin = homeV29Controller.getNode("ArchiveOrigin_Paths");
        const projected = projectObjectToCss({ THREE, canvas, camera, object: pathsOrigin, minimumSize: 96 });
        if (projected) return projected;
      }
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
        heroMode: heroResolution?.heroMode ?? heroState.heroMode,
        homeV29: homeV29Controller?.audit() ?? null,
        disassembly: homeV29Disassembly?.audit() ?? null,
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
      homeV29Controller?.dispose();
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
