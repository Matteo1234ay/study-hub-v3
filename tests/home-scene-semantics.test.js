import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";

function projectedRect(object, shot, aspect) {
  const camera = new THREE.PerspectiveCamera(shot.fov, aspect, .1, 100);
  camera.position.set(...shot.position);
  camera.lookAt(new THREE.Vector3(...shot.target));
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  const projected = [];
  let visible = false;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const worldPoint = new THREE.Vector3(x, y, z);
        const cameraPoint = worldPoint.clone().applyMatrix4(camera.matrixWorldInverse);
        if (cameraPoint.z < -camera.near) visible = true;
        projected.push(worldPoint.project(camera));
      }
    }
  }
  return {
    visible,
    left: Math.min(...projected.map(point => point.x)),
    right: Math.max(...projected.map(point => point.x)),
    top: Math.max(...projected.map(point => point.y)),
    bottom: Math.min(...projected.map(point => point.y))
  };
}

function overlapRatio(subject, obstacle) {
  if (!subject.visible || !obstacle.visible) return 0;
  const width = Math.max(0, Math.min(subject.right, obstacle.right) - Math.max(subject.left, obstacle.left));
  const height = Math.max(0, Math.min(subject.top, obstacle.top) - Math.max(subject.bottom, obstacle.bottom));
  const area = Math.max(.0001, (subject.right - subject.left) * (subject.top - subject.bottom));
  return width * height / area;
}

function distance(left, right) {
  return Math.hypot(...left.map((value, index) => value - right[index]));
}

test("builds exactly the six semantic physical stations", () => {
  const materials = createRoomMaterials(THREE);
  const room = buildStudyRoom({ THREE, materials });

  assert.deepEqual(Object.keys(room.stations).sort(), [
    "assessment",
    "desk",
    "future-paths",
    "memory",
    "progress",
    "social"
  ]);
  for (const station of Object.values(room.stations)) {
    assert.ok(station.anchor?.isObject3D);
    assert.ok(station.target?.isVector3);
    assert.ok(station.hitArea?.isObject3D);
    assert.ok(station.screen?.isObject3D);
  }
  assert.equal(room.occlusionAudit.mainMonitorClear, true);
  assert.ok(room.group.children.length >= 8);
  room.dispose();
});

test("chair moves out of the sightline before assessment and stays out", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  const chair = room.group.getObjectByName("ergonomic-chair");
  assert.equal(typeof room.setJourney, "function");
  const initialX = chair.position.x;
  room.setJourney(.2);
  assert.equal(chair.position.x, initialX);
  room.setJourney(.65);
  assert.ok(chair.position.x >= initialX + 1.2);
  assert.ok(chair.position.z >= 2.4);
  const shiftedX = chair.position.x;
  const shiftedZ = chair.position.z;
  room.setJourney(.9);
  assert.ok(chair.position.x >= shiftedX - .001);
  assert.ok(chair.position.z >= shiftedZ - .001);
  room.dispose();
});

test("articulated lamp arms share physical joints instead of floating", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  const lower = room.group.getObjectByName("lamp-lower-arm");
  const upper = room.group.getObjectByName("lamp-upper-arm");
  assert.ok(Array.isArray(lower?.userData?.start));
  assert.ok(Array.isArray(lower?.userData?.end));
  assert.ok(Array.isArray(upper?.userData?.start));
  assert.ok(Array.isArray(upper?.userData?.end));
  assert.ok(distance(lower.userData.end, upper.userData.start) < .01);
  const joint = room.group.getObjectByName("lamp-elbow-joint");
  assert.ok(joint?.isObject3D);
  room.dispose();
});

test("settled desktop and mobile shots keep every real screen readable and clear of chair and lamp", () => {
  for (const [layout, aspect] of [["desktop", 16 / 9], ["mobile", 390 / 844]]) {
    const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
    const timeline = createCameraTimeline({ layout });
    const chair = room.group.getObjectByName("ergonomic-chair");
    const lamp = room.group.getObjectByName("articulated-desk-lamp");
    for (const [stationId, station] of Object.entries(room.stations)) {
      const progress = timeline.stationProgress(stationId);
      room.setJourney(progress);
      room.group.updateMatrixWorld(true);
      const shot = timeline.sample(progress);
      const screen = projectedRect(station.screen, shot, aspect);
      assert.equal(screen.visible, true, `${layout} ${stationId} screen behind camera`);
      const screenHeight = screen.top - screen.bottom;
      assert.ok(screenHeight >= .13, `${layout} ${stationId} screen too small: ${screenHeight}`);
      for (const obstacle of [chair, lamp]) {
        const obstruction = overlapRatio(screen, projectedRect(obstacle, shot, aspect));
        assert.ok(obstruction < .14, `${layout} ${stationId} blocked by ${obstacle.name}: ${obstruction}`);
      }
    }
    room.dispose();
  }
});

test("uses named study objects instead of arbitrary sci-fi props", async () => {
  const source = await readFile(new URL("../src/home/scene/build-room.js", import.meta.url), "utf8");

  for (const builder of [
    "buildDesk",
    "buildErgonomicChair",
    "buildArticulatedLamp",
    "buildMainMonitor",
    "buildMemoryWall",
    "buildSocialDisplay",
    "buildAssessmentConsole",
    "buildProgressDisplay",
    "buildFutureArchive"
  ]) assert.match(source, new RegExp(`function ${builder}\\(`));

  assert.match(source, /cylinderBetween/);
  assert.doesNotMatch(source, /TorusGeometry|decorativeSphere|planet/i);
});

test("renderer lifecycle is local to the homepage and fully disposable", async () => {
  const renderer = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  const interaction = await readFile(new URL("../src/home/scene/interaction-controller.js", import.meta.url), "utf8");

  assert.match(renderer, /vendor\/three\/three\.module\.min\.js/);
  assert.match(renderer, /cancelAnimationFrame/);
  assert.match(renderer, /ResizeObserver/);
  assert.match(renderer, /visibilitychange/);
  assert.match(interaction, /Raycaster/);
  assert.match(interaction, /hitArea/);
  assert.doesNotMatch(interaction, /keydown|keyup/);
});
