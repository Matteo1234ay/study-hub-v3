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

test("mobile cinematic camera actually enters the room instead of watching it from outside", () => {
  const timeline = createCameraTimeline({ layout: "mobile" });
  const opening = timeline.sample(0);
  assert.ok(distance(opening.position, opening.target) > 6, "opening should establish the whole room");
  for (const stationId of ["memory", "social", "assessment", "progress", "future-paths"]) {
    const shot = timeline.sample(timeline.stationProgress(stationId));
    assert.ok(distance(shot.position, shot.target) < 4.8, `${stationId} is not a real mobile push-in`);
  }
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
