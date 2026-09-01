import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

function executable(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const POSTER = "assets/3d/home-v30/home-v30-poster.webp";

test("V30 ships a real local WebP poster for loading and WebGL failure", () => {
  assert.ok(existsSync(POSTER), "missing V30 poster");
  const bytes = readFileSync(POSTER);
  assert.ok(statSync(POSTER).size > 32 * 1024, "V30 poster is implausibly small");
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
});

test("asset registry loads V30 locally with a finite fail-closed decision", () => {
  const source = executable(readFileSync("src/home/scene/asset-registry.js", "utf8"));
  assert.match(source, /home-v30\/study-hub-home-v30\.glb/);
  assert.match(source, /loadHomeV30/);
  assert.match(source, /Promise\.race/);
  assert.match(source, /return null/);
  assert.doesNotMatch(source, /https?:\/\//i);
});

test("production renderer mounts V30 and never selects the V29 or V28 visual fallback", () => {
  const setup = executable(readFileSync("src/home/scene/renderer-setup.js", "utf8"));
  assert.match(setup, /loadHomeV30/);
  assert.match(setup, /prepareHomeV30/);
  assert.match(setup, /heroMode:\s*["']v30["']/);
  assert.match(setup, /heroMode:\s*["']poster["']/);
  assert.doesNotMatch(setup, /loadHomeV29|prepareHomeV29|loadV28Fallback|v28-fallback/);
});

test("V30 native Y-up export is mounted without the legacy axis correction", () => {
  const setup = executable(readFileSync("src/home/scene/renderer-setup.js", "utf8"));
  assert.doesNotMatch(setup, /applyStudioCoreAxisCorrection/);
  assert.doesNotMatch(setup, /Math\.PI\s*\/\s*2[\s\S]*V30/i);
});

test("home shell keeps the V30 poster until the verified first WebGL frame", () => {
  const view = readFileSync("src/views/home-view.js", "utf8");
  const css = readFileSync("styles/home-startup.css", "utf8");
  const experience = readFileSync("src/home/home-experience.js", "utf8");
  assert.match(view, /home-v30-poster/);
  assert.match(view, /assets\/3d\/home-v30\/home-v30-poster\.webp/);
  assert.match(experience, /data(?:set)?\.homeRenderer|dataset\.homeRenderer/);
  assert.match(experience, /webgl-v30/);
  assert.match(experience, /poster/);
  assert.match(css, /data-home-renderer="webgl-v30"[\s\S]*\.home-v30-poster/);
  assert.match(css, /\.home-v30-poster/);
});

test("V30 renderer readiness still resolves only after rendering a real frame", () => {
  const renderer = executable(readFileSync("src/home/scene/study-room-renderer.js", "utf8"));
  assert.match(renderer, /await\s+heroAssetPromise/);
  assert.match(renderer, /renderer\.render\(scene, camera\);[\s\S]{0,320}resolveReady/s);
  assert.match(renderer, /heroMode/);
  assert.match(renderer, /v30/);
  assert.doesNotMatch(renderer, /homeV29Controller|createHomeV29Controller|createHomeV29Disassembly|createHomeV29Lighting/);
});
