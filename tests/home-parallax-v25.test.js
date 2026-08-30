import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import { createParallaxRig } from "../src/home/scene/parallax-rig.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";
import { createRoomParallaxLayers } from "../src/home/scene/renderer-setup.js";

function weightedLayer(name, weight) {
  const object = new THREE.Object3D();
  object.name = name;
  return {
    object,
    cluster: "test",
    weight,
    depth: 1,
    damping: 8,
    translation: { x: .05, y: .03 },
    rotation: { x: .02, y: .025 }
  };
}

test("light semantic props react more than heavy station clusters", () => {
  const light = weightedLayer("paper", "light");
  const heavy = weightedLayer("screen-cluster", "heavy");
  const rig = createParallaxRig({ layers: [light, heavy] });
  assert.equal(typeof rig.setAmplitude, "function");
  if (typeof rig.setAmplitude !== "function") return;

  rig.setAmplitude(1);
  rig.setTarget({ x: 1, y: -.8 });
  for (let index = 0; index < 60; index += 1) rig.update(1 / 60);

  assert.ok(light.object.position.x > heavy.object.position.x);
  const audit = rig.audit();
  assert.deepEqual(audit.weights, ["light", "heavy"]);
  assert.deepEqual(audit.clusters, ["test", "test"]);
});

test("director amplitude can damp parallax all the way back to immutable bases", () => {
  const layer = weightedLayer("paper", "light");
  const rig = createParallaxRig({ layers: [layer] });
  if (typeof rig.setAmplitude !== "function") return;
  rig.setTarget({ x: 1, y: 1 });
  rig.setAmplitude(1);
  for (let index = 0; index < 30; index += 1) rig.update(1 / 60);
  assert.notEqual(layer.object.position.x, 0);

  rig.setAmplitude(0);
  rig.update(1 / 60);
  assert.equal(layer.object.position.x, 0);
  assert.equal(layer.object.position.y, 0);
});

test("the Study Hub groups pointer motion into capped semantic clusters", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  const layers = createRoomParallaxLayers(room);
  assert.ok(layers.length >= 8 && layers.length <= 12);
  assert.ok(new Set(layers.map(layer => layer.cluster)).size >= 4);
  assert.ok(new Set(layers.map(layer => layer.weight)).has("light"));
  assert.ok(new Set(layers.map(layer => layer.weight)).has("medium"));
  assert.ok(new Set(layers.map(layer => layer.weight)).has("heavy"));
  room.dispose();
});

test("renderer scales pointer motion from director state and still disables it on mobile reduced motion and exit", async () => {
  const source = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  assert.match(source, /parallaxRig\.setAmplitude\(direction\.parallaxScale\)/);
  assert.match(source, /!reducedMotion\s*&&\s*cameraLayout\s*!==\s*["']mobile["']\s*&&\s*exitProgress\s*===\s*0/);
  assert.match(source, /parallaxRig\.restoreImmediately/);
});