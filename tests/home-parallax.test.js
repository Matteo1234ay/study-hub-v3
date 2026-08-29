import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import { createInertialParallax } from "../src/home/scene/interaction-controller.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";

test("pointer parallax approaches a bounded target with inertia", () => {
  const parallax = createInertialParallax({ maximum: .012, easing: .2 });
  parallax.setTarget(1, -1);

  const first = { ...parallax.update() };
  assert.ok(first.x > 0 && first.x < .012);
  assert.ok(first.y < 0 && first.y > -.012);
  for (let index = 0; index < 100; index += 1) parallax.update();
  const settled = { ...parallax.update() };
  assert.ok(settled.x <= .012 && settled.x > .011);
  assert.ok(settled.y >= -.012 && settled.y < -.011);
});

test("pointer leave eases layers back instead of snapping", () => {
  const parallax = createInertialParallax({ maximum: .012, easing: .25 });
  parallax.setTarget(1, 1);
  for (let index = 0; index < 10; index += 1) parallax.update();
  const beforeReset = { ...parallax.update() };
  parallax.reset();
  const afterReset = { ...parallax.update() };

  assert.ok(afterReset.x > 0);
  assert.ok(afterReset.x < beforeReset.x);
  assert.ok(afterReset.y < beforeReset.y);
});

test("the room exposes a capped set of semantic layers with distinct depths", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  assert.ok(room.parallaxAudit.count >= 6);
  assert.ok(room.parallaxAudit.count <= 16);
  assert.ok(new Set(room.parallaxAudit.depths).size >= 3);

  const card = room.group.getObjectByName("review-card-1");
  const originalX = card.position.x;
  room.setParallax({ x: .012, y: -.012 });
  assert.notEqual(card.position.x, originalX);
  room.setParallax({ x: 0, y: 0 });
  assert.equal(card.position.x, originalX);
  room.dispose();
});
