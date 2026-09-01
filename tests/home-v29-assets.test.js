import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { HOME_V29_CLIPS, HOME_V29_NODES } from "../src/home/scene/home-v29-contract.js";

const BLEND_PATH = "assets/3d/home-v29/study-hub-home-v29.blend";
const GLB_PATH = "assets/3d/home-v29/study-hub-home-v29.glb";

function parseGlbJson(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("utf8"), "glTF");
  assert.equal(buffer.readUInt32LE(4), 2);
  assert.equal(buffer.readUInt32LE(8), buffer.length);
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a, "first GLB chunk must be JSON");
  return JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8").trim());
}

test("V29 ships reproducible Blender source and a valid runtime GLB", () => {
  assert.ok(existsSync(BLEND_PATH), "missing V29 .blend source");
  assert.ok(existsSync(GLB_PATH), "missing V29 runtime GLB");
  const size = statSync(GLB_PATH).size;
  assert.ok(size > 4096, "V29 GLB is unexpectedly small");
  assert.ok(size <= 18 * 1024 * 1024, "V29 GLB exceeds 18 MiB hard limit");
  parseGlbJson(readFileSync(GLB_PATH));
});

test("V29 GLB exposes stable mechanical nodes and semantic origins", () => {
  const gltf = parseGlbJson(readFileSync(GLB_PATH));
  const nodeNames = new Set((gltf.nodes ?? []).map(node => node.name).filter(Boolean));
  for (const name of HOME_V29_NODES) assert.ok(nodeNames.has(name), `missing V29 node ${name}`);
  assert.ok([...nodeNames].some(name => /^ChairWheel_/.test(name)), "missing chair wheel nodes");
  assert.ok([...nodeNames].some(name => /^Book_/.test(name)), "missing Book_* nodes");
  assert.ok([...nodeNames].some(name => /^Paper_/.test(name)), "missing Paper_* nodes");
  assert.ok([...nodeNames].some(name => /^ArchiveOrigin_/.test(name)), "missing ArchiveOrigin_* nodes");
});

test("V29 GLB exports every required Blender action", () => {
  const gltf = parseGlbJson(readFileSync(GLB_PATH));
  const animationNames = new Set((gltf.animations ?? []).map(animation => animation.name).filter(Boolean));
  for (const name of HOME_V29_CLIPS) assert.ok(animationNames.has(name), `missing V29 clip ${name}`);
});
