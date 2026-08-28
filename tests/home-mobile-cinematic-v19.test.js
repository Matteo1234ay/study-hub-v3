import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";

function distance(a, b) {
  return Math.hypot(...a.map((value, index) => value - b[index]));
}

function projectedSize(object, shot, aspect) {
  const camera = new THREE.PerspectiveCamera(shot.fov, aspect, .1, 100);
  camera.position.set(...shot.position);
  camera.lookAt(new THREE.Vector3(...shot.target));
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  const points = [];
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) points.push(new THREE.Vector3(x, y, z).project(camera));
    }
  }
  return {
    width: Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x)),
    height: Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y))
  };
}

test("mobile cinematic camera enters the room while preserving spatial context", () => {
  const timeline = createCameraTimeline({ layout: "mobile" });
  const opening = timeline.sample(0);
  assert.ok(distance(opening.position, opening.target) > 6, "opening should establish the whole room");
  for (const stationId of ["memory", "social", "assessment", "progress", "future-paths"]) {
    const shot = timeline.sample(timeline.stationProgress(stationId));
    const shotDistance = distance(shot.position, shot.target);
    assert.ok(shotDistance > 3.8, `${stationId} is so close that the room context disappears: ${shotDistance}`);
    assert.ok(shotDistance < 6.5, `${stationId} no longer feels like a mobile push-in: ${shotDistance}`);
  }
});

test("mobile station screens never dominate the portrait viewport", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  const timeline = createCameraTimeline({ layout: "mobile" });
  const aspect = 390 / 844;
  for (const [stationId, station] of Object.entries(room.stations)) {
    const progress = timeline.stationProgress(stationId);
    room.setJourney(progress);
    room.group.updateMatrixWorld(true);
    const size = projectedSize(station.screen, timeline.sample(progress), aspect);
    assert.ok(size.height <= 1.02, `${stationId} screen fills too much portrait height: ${size.height}`);
    assert.ok(size.width <= 1.62, `${stationId} screen fills too much portrait width: ${size.width}`);
  }
  room.dispose();
});

test("semantic room objects visibly react to the scroll journey", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  const lampShade = room.group.getObjectByName("lamp-shade");
  const assessment = room.group.getObjectByName("assessment-console");
  const progress = room.group.getObjectByName("progress-display");

  room.setJourney(0);
  const lampStart = lampShade.rotation.z;
  room.setJourney(.12);
  assert.ok(Math.abs(lampShade.rotation.z - lampStart) > .07, "lamp never articulates into its working pose");

  room.setJourney(.5);
  const assessmentBefore = assessment.position.y;
  room.setJourney(.66);
  assert.ok(assessment.position.y - assessmentBefore > .05, "assessment console never rises into focus");

  room.setJourney(.68);
  const progressBefore = progress.position.y;
  room.setJourney(.84);
  assert.ok(progress.position.y - progressBefore > .04, "progress display never reveals itself");
  room.dispose();
});

test("mobile immersive mode removes duplicate navigation chrome and keeps captions compact", async () => {
  const css = await readFile(new URL("../styles/home-immersive.css", import.meta.url), "utf8");
  const experience = await readFile(new URL("../src/home/home-experience.js", import.meta.url), "utf8");

  assert.match(experience, /dataset\.homeImmersive/);
  assert.match(experience, /delete document\.body\.dataset\.homeImmersive/);
  assert.match(css, /body\[data-home-immersive="true"\][^\{]*\.site-header/);
  assert.match(css, /body\[data-home-immersive="true"\][^\{]*\.site-footer/);
  assert.match(css, /home-quick-actions[^\{]*\{[^\}]*display:\s*none/s);
  assert.match(css, /max-height:\s*min\(24svh,\s*12rem\)/);
});

test("screen content really powers on instead of remaining visible as a dark static texture", async () => {
  const source = await readFile(new URL("../src/home/scene/lighting-controller.js", import.meta.url), "utf8");
  assert.match(source, /screenPower/);
  assert.match(source, /screen\.material\.color\.setScalar/);
  assert.match(source, /emissiveIntensity\s*=\s*screenPower/);
});
