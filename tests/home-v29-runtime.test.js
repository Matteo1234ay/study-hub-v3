import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { HOME_V29_CLIPS, HOME_V29_WINDOWS } from "../src/home/scene/home-v29-contract.js";

function executableSource(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("historical V29 controller remains deterministic for regression reference", () => {
  const path = "src/home/scene/home-v29-controller.js";
  assert.ok(existsSync(path), "missing V29 runtime controller");
  const source = executableSource(readFileSync(path, "utf8"));
  assert.match(source, /HOME_V29_CLIPS/);
  assert.match(source, /HOME_V29_WINDOWS/);
  assert.match(source, /new\s+THREE\.AnimationMixer\s*\(/);
  assert.match(source, /action\.play\(\)[\s\S]*action\.paused\s*=\s*true/);
  assert.match(source, /entry\.action\.time\s*=/);
  assert.match(source, /mixer\.update\(0\)/);
  for (const clip of HOME_V29_CLIPS) {
    assert.ok(Array.isArray(HOME_V29_WINDOWS[clip]), `missing historical scroll window for ${clip}`);
  }
});

test("legacy V29 asset remains local but is not selected by the V30 production renderer", () => {
  const registry = executableSource(readFileSync("src/home/scene/asset-registry.js", "utf8"));
  const setup = executableSource(readFileSync("src/home/scene/renderer-setup.js", "utf8"));
  const renderer = executableSource(readFileSync("src/home/scene/study-room-renderer.js", "utf8"));
  assert.match(registry, /home-v29\/study-hub-home-v29\.glb/);
  assert.doesNotMatch(registry, /https?:\/\//i);
  assert.doesNotMatch(setup, /loadHomeV29|prepareHomeV29|v28-fallback|setProceduralHeroVisible/);
  assert.doesNotMatch(renderer, /homeV29|createHomeV29/);
  assert.match(setup, /loadHomeV30/);
  assert.match(renderer, /homeV30/i);
});
