import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import { createParallaxRig } from "../src/home/scene/parallax-rig.js";

function layer(name, depth, damping, translation, rotation) {
  const object = new THREE.Object3D();
  object.name = name;
  object.position.set(depth, depth * .2, 0);
  object.rotation.set(.01 * depth, -.01 * depth, 0);
  return { object, depth, damping, translation, rotation };
}

test("independent layers use distinct depth damping translation and rotation", () => {
  const layers = [
    layer("paper", 1, 10, { x: .055, y: .035 }, { x: .018, y: .028 }),
    layer("mug", .62, 8, { x: .038, y: .024 }, { x: .012, y: .018 }),
    layer("book", .4, 6, { x: .026, y: .018 }, { x: .008, y: .012 }),
    layer("mouse", .2, 4, { x: .014, y: .01 }, { x: .004, y: .006 })
  ];
  const rig = createParallaxRig({ layers });
  const audit = rig.audit();
  assert.equal(audit.count, 4);
  assert.equal(new Set(audit.depths).size, 4);
  assert.equal(new Set(audit.damping).size, 4);
  assert.ok(audit.maxTranslation >= .05);
  assert.ok(audit.maxRotation >= .02);

  const paperX = layers[0].object.position.x;
  const mouseX = layers[3].object.position.x;
  rig.setTarget({ x: 1, y: -.8 });
  for (let i = 0; i < 60; i += 1) rig.update(1 / 60);
  assert.ok(layers[0].object.position.x - paperX > layers[3].object.position.x - mouseX);
  assert.notEqual(layers[0].object.rotation.x, .01);
});

test("pointer leave eases back while immediate disable restores immutable bases exactly", () => {
  const item = layer("paper", 1, 8, { x: .05, y: .03 }, { x: .02, y: .025 });
  const base = {
    x: item.object.position.x,
    y: item.object.position.y,
    rx: item.object.rotation.x,
    ry: item.object.rotation.y
  };
  const rig = createParallaxRig({ layers: [item] });
  rig.setTarget({ x: 1, y: 1 });
  for (let i = 0; i < 30; i += 1) rig.update(1 / 60);
  const displaced = item.object.position.x;
  rig.reset();
  rig.update(1 / 60);
  assert.ok(item.object.position.x < displaced);
  assert.ok(item.object.position.x > base.x);
  rig.restoreImmediately();
  assert.equal(item.object.position.x, base.x);
  assert.equal(item.object.position.y, base.y);
  assert.equal(item.object.rotation.x, base.rx);
  assert.equal(item.object.rotation.y, base.ry);
});

test("the Home renderer registers 8 to 12 semantic objects and disables pointer depth on mobile reduced motion and exit", async () => {
  const source = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  assert.match(source, /createParallaxRig/);
  for (const name of ["review-card-1", "review-card-3", "review-card-5", "ceramic-mug", "keyboard", "mouse", "future-binder-1", "future-binder-2", "future-binder-3"]) {
    assert.match(source, new RegExp(name));
  }
  assert.match(source, /!reducedMotion\s*&&\s*cameraLayout\s*!==\s*["']mobile["']\s*&&\s*exitProgress\s*===\s*0/);
  assert.match(source, /parallaxRig\.restoreImmediately/);
});

test("interaction controller exposes normalized pointer target separately from the tiny camera offset", async () => {
  const source = await readFile(new URL("../src/home/scene/interaction-controller.js", import.meta.url), "utf8");
  assert.match(source, /parallaxTarget/);
  assert.match(source, /getParallaxTarget/);
  assert.match(source, /Math\.min\(1,\s*Math\.max\(-1/);
});
