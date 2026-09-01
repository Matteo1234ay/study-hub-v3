import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { HOME_V30_CLIPS, HOME_V30_NODES } from "../src/home/scene/home-v30-contract.js";

const BLEND = "assets/3d/home-v30/study-hub-home-v30.blend";
const GLB = "assets/3d/home-v30/study-hub-home-v30.glb";

function parseGlb(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("utf8"), "glTF");
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonLength = buffer.readUInt32LE(12);
  assert.equal(buffer.readUInt32LE(16), 0x4e4f534a, "first GLB chunk must be JSON");
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
}

test("V30 ships an editable Blender source and a valid bounded GLB", () => {
  assert.ok(existsSync(BLEND), "missing editable V30 .blend source");
  assert.ok(existsSync(GLB), "missing V30 runtime GLB");
  const size = statSync(GLB).size;
  assert.ok(size > 256 * 1024, "V30 GLB is implausibly small for the realistic hero");
  assert.ok(size <= 18 * 1024 * 1024, "V30 GLB exceeds the 18 MiB hard runtime limit");
  parseGlb(readFileSync(GLB));
});

test("V30 GLB exposes every stable mechanical node and animation clip", () => {
  const gltf = parseGlb(readFileSync(GLB));
  const nodes = new Set((gltf.nodes ?? []).map(node => node.name).filter(Boolean));
  const clips = new Set((gltf.animations ?? []).map(animation => animation.name).filter(Boolean));
  for (const name of HOME_V30_NODES) assert.ok(nodes.has(name), `missing V30 node ${name}`);
  for (const name of HOME_V30_CLIPS) assert.ok(clips.has(name), `missing V30 clip ${name}`);
});

test("V30 GLB keeps physical material families visibly separate", () => {
  const gltf = parseGlb(readFileSync(GLB));
  const materials = (gltf.materials ?? []).map(material => material.name ?? "");
  for (const family of [/walnut/i, /plaster/i, /(graphite|metal|aluminum)/i, /fabric/i, /paper/i, /(glass|ceramic)/i]) {
    assert.ok(materials.some(name => family.test(name)), `missing physical material family ${family}`);
  }
  const bluePhysical = materials.filter(name => /blue/i.test(name) && !/(screen|emissive|information|accent)/i.test(name));
  assert.deepEqual(bluePhysical, [], `Study Hub blue must not become a physical V30 material: ${bluePhysical.join(", ")}`);
});

test("V30 GLB contains locally sourced CC0 detail instead of only custom primitives", () => {
  const gltf = parseGlb(readFileSync(GLB));
  const names = (gltf.nodes ?? []).map(node => node.name ?? "");
  assert.ok(names.some(name => /CC0_Notepad/i.test(name)), "missing CC0 notepad detail in final V30 GLB");
  assert.ok(names.some(name => /CC0_Stationery/i.test(name)), "missing CC0 stationery detail in final V30 GLB");
  assert.ok(names.some(name => /CC0_DrawerCabinet/i.test(name)), "missing CC0 drawer cabinet detail in final V30 GLB");
  assert.ok(names.some(name => /CC0_DeskLamp/i.test(name)), "missing CC0 desk lamp detail in final V30 GLB");
});
