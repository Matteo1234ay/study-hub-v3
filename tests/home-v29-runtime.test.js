import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { HOME_V29_CLIPS } from "../src/home/scene/home-v29-contract.js";

function executableSource(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("V29 controller exists and scrubs Blender clips with AnimationMixer", () => {
  const path = "src/home/scene/home-v29-controller.js";
  assert.ok(existsSync(path), "missing V29 runtime controller");
  const source = executableSource(readFileSync(path, "utf8"));
  assert.match(source, /new\s+THREE\.AnimationMixer\s*\(/);
  assert.match(source, /action\.play\(\)[\s\S]*action\.paused\s*=\s*true/,
    "V29 may activate Three.js actions only when they are immediately paused for scroll scrubbing");
  assert.match(source, /action\.time\s*=/);
  assert.match(source, /HOME_V29_WINDOWS/);
  assert.match(source, /mixer\.update\(0\)/);
  for (const clip of HOME_V29_CLIPS) assert.match(source, new RegExp(clip));
});

test("V29 asset registry loads only the local GLB with a finite fallback", () => {
  const source = executableSource(readFileSync("src/home/scene/asset-registry.js", "utf8"));
  assert.match(source, /home-v29\/study-hub-home-v29\.glb/);
  assert.match(source, /loadHomeV29/);
  assert.match(source, /Promise\.race/);
  assert.match(source, /return null/);
  assert.doesNotMatch(source, /https?:\/\//i);
});

test("V29 renderer keeps procedural hero hidden until load success or explicit fallback", () => {
  const setup = readFileSync("src/home/scene/renderer-setup.js", "utf8");
  assert.match(setup, /heroMode/);
  assert.match(setup, /"v29"/);
  assert.match(setup, /"v28-fallback"/);
  assert.match(setup, /setProceduralHeroVisible/);
  assert.match(setup, /loadHomeV29/);
});

test("V29 readiness waits for the V29 hero decision", () => {
  const renderer = readFileSync("src/home/scene/study-room-renderer.js", "utf8");
  assert.match(renderer, /heroAssetPromise/);
  assert.match(renderer, /await\s+heroAssetPromise/);
  assert.match(renderer, /homeV29/i);
});
