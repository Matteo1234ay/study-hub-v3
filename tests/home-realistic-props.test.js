import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import { RoundedBoxGeometry } from "../vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";

test("hero props use rounded or curved silhouettes instead of sharp primitive boxes", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE), RoundedBoxGeometry });
  const names = ["desk-top", "keyboard", "mouse", "main-monitor-frame", "monitor-foot", "lamp-shade"];
  for (const name of names) {
    const object = room.group.getObjectByName(name);
    assert.ok(object, `${name} missing`);
    assert.equal(object.userData.silhouetteRefined, true, `${name} still reads as a raw primitive`);
  }
  assert.ok(room.realismAudit.roundedProps >= 6);
  assert.ok(room.realismAudit.curvedProps >= 3);
  room.dispose();
});

test("chair and mug expose physically modeled detail while semantic names remain stable", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE), RoundedBoxGeometry });
  const chair = room.group.getObjectByName("ergonomic-chair");
  const mug = room.group.getObjectByName("ceramic-mug");
  assert.equal(chair.userData.silhouetteRefined, true);
  assert.equal(mug.material.name, "matte-ceramic");
  assert.ok(room.group.getObjectByName("mug-handle"));
  assert.ok(room.group.getObjectByName("chair-lumbar-frame"));
  assert.deepEqual(Object.keys(room.stations).sort(), ["assessment", "desk", "future-paths", "memory", "progress", "social"]);
  room.dispose();
});

test("the room shell includes layered studio architecture instead of flat dark boxes", () => {
  const materials = createRoomMaterials(THREE);
  const room = buildStudyRoom({ THREE, materials });

  for (const name of [
    "back-wall-inset",
    "left-wall-inset",
    "right-wall-inset",
    "blue-cove-left",
    "blue-cove-right",
    "floor-edge-trim"
  ]) {
    assert.ok(room.group.getObjectByName(name), `${name} should add visible architectural depth`);
  }

  room.dispose();
});
