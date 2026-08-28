import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";

test("creates the six approved realistic material families", () => {
  const materials = createRoomMaterials(THREE);

  assert.deepEqual(Object.keys(materials).sort(), [
    "fabric",
    "floor",
    "glassOff",
    "metal",
    "wall",
    "wood"
  ]);
  assert.ok(materials.wood.roughness >= 0.45);
  assert.ok(materials.fabric.roughness >= 0.8);
  assert.ok(materials.metal.metalness >= 0.65);
  assert.ok(materials.glassOff.roughness <= 0.25);
  assert.equal(materials.glassOff.emissiveIntensity, 0);
  assert.ok(materials.wood.map?.image?.data?.length > 0);
  assert.ok(materials.fabric.roughnessMap?.image?.data?.length > 0);
});

test("procedural material textures stay within the lightweight budget", () => {
  const materials = createRoomMaterials(THREE);
  for (const material of Object.values(materials)) {
    for (const texture of [material.map, material.roughnessMap].filter(Boolean)) {
      assert.ok(texture.image.width <= 256);
      assert.ok(texture.image.height <= 256);
    }
  }
});
