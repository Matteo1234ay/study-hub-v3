import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectFiles(path));
    else result.push(path);
  }
  return result;
}

function executableSource(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("V25 hero model is local, CC0 documented and inside budget", () => {
  assert.ok(existsSync("assets/3d/ATTRIBUTION.md"));
  const attribution = readFileSync("assets/3d/ATTRIBUTION.md", "utf8");
  assert.match(attribution, /Desk Lamp Arm 01/i);
  assert.match(attribution, /CC0/i);
  assert.match(attribution, /Poly Haven/i);

  const files = collectFiles("assets/3d/desk-lamp-arm-01");
  assert.ok(files.some(file => /\.gltf$/i.test(file)), "missing local glTF model");
  const total = files.reduce((sum, file) => sum + statSync(file).size, 0);
  assert.ok(total > 0 && total <= 8 * 1024 * 1024, `desk lamp payload ${total}`);
  assert.ok(files.every(file => !/4k/i.test(file)), "4K asset slipped into the runtime bundle");
});

test("asset registry is local-only, finite and fail-safe", () => {
  assert.ok(existsSync("src/home/scene/asset-registry.js"));
  const source = readFileSync("src/home/scene/asset-registry.js", "utf8");
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.match(source, /GLTFLoader/);
  assert.match(source, /6000/);
  assert.match(source, /Promise\.race/);
  assert.match(source, /desk-lamp-arm-01/);
  assert.match(source, /return null/);
});

test("Three GLTFLoader is vendored reproducibly without a runtime CDN", () => {
  const vendorScript = readFileSync("scripts/vendor-three.mjs", "utf8");
  assert.match(vendorScript, /loaders\/GLTFLoader\.js/);
  assert.ok(existsSync("vendor/three/examples/jsm/loaders/GLTFLoader.js"));
  const loader = executableSource(readFileSync("vendor/three/examples/jsm/loaders/GLTFLoader.js", "utf8"));
  assert.doesNotMatch(loader, /from\s+["']three["']/);
  assert.doesNotMatch(loader, /(?:from\s+|import\s*\(\s*)["']https?:\/\//i);
  assert.doesNotMatch(loader, /\bfetch\s*\(\s*["']https?:\/\//i);
});

test("renderer preserves the procedural lamp unless the local hero asset loads", () => {
  const setup = readFileSync("src/home/scene/renderer-setup.js", "utf8");
  const room = readFileSync("src/home/scene/build-room.js", "utf8");
  assert.match(setup, /loadDeskLamp/);
  assert.match(setup, /articulated-desk-lamp/);
  assert.match(room, /articulated-desk-lamp/);
  assert.match(setup, /if\s*\(loadedLamp\)/);
});