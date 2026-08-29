import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";

test("creates physically distinct material families for the room and props", () => {
  const materials = createRoomMaterials(THREE);

  assert.deepEqual(Object.keys(materials).sort(), [
    "ceramic",
    "fabric",
    "floor",
    "glassOff",
    "metal",
    "paintedMetal",
    "wall",
    "wood"
  ]);
  assert.ok(materials.wood.roughness >= .45);
  assert.ok(materials.fabric.roughness >= .8);
  assert.ok(materials.metal.metalness >= .65);
  assert.ok(materials.paintedMetal.roughness > materials.metal.roughness);
  assert.ok(materials.paintedMetal.metalness > .2 && materials.paintedMetal.metalness < .7);
  assert.equal(materials.ceramic.metalness, 0);
  assert.ok(materials.ceramic.roughness >= .3 && materials.ceramic.roughness <= .7);
  assert.ok(materials.glassOff.roughness <= .25);
  assert.equal(materials.glassOff.emissiveIntensity, 0);
  assert.ok(materials.wood.map?.image?.data?.length > 0);
  assert.ok(materials.wood.roughnessMap?.image?.data?.length > 0);
  assert.ok(materials.wood.normalMap?.image?.data?.length > 0);
  assert.ok(materials.fabric.roughnessMap?.image?.data?.length > 0);
  assert.ok(materials.fabric.normalMap?.image?.data?.length > 0);
  assert.ok(materials.wall.normalMap?.image?.data?.length > 0);
  assert.ok(materials.floor.normalMap?.image?.data?.length > 0);
});

test("procedural PBR detail stays bounded while allowing richer hero surfaces", () => {
  const materials = createRoomMaterials(THREE);
  for (const material of Object.values(materials)) {
    for (const texture of [material.map, material.roughnessMap, material.normalMap].filter(Boolean)) {
      assert.ok(texture.image.width <= 512);
      assert.ok(texture.image.height <= 512);
    }
  }
  assert.ok(materials.wood.map.image.width >= 256);
  assert.ok(materials.fabric.normalMap.image.width >= 192);
});
