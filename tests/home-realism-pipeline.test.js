import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("realism helpers are vendored locally with no runtime network dependency", async () => {
  const rounded = await read("vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js");
  const environment = await read("vendor/three/examples/jsm/environments/RoomEnvironment.js");
  assert.match(rounded, /three\.module\.min\.js/);
  assert.match(environment, /three\.module\.min\.js/);
  assert.doesNotMatch(rounded + environment, /from\s+["']three["']/);
  assert.doesNotMatch(rounded + environment, /https?:\/\//);
});

test("renderer uses local PMREM image-based lighting without changing the visible background", async () => {
  const source = await read("src/home/scene/renderer-setup.js");
  assert.match(source, /RoomEnvironment/);
  assert.match(source, /PMREMGenerator/);
  assert.match(source, /fromScene/);
  assert.match(source, /scene\.environment\s*=/);
  assert.match(source, /scene\.background\s*=\s*new THREE\.Color/);
  assert.doesNotMatch(source, /https?:\/\//);
});

test("vendor script keeps realism helpers reproducible from pinned Three", async () => {
  const source = await read("scripts/vendor-three.mjs");
  assert.match(source, /RoundedBoxGeometry\.js/);
  assert.match(source, /RoomEnvironment\.js/);
  assert.match(source, /0\.185\.1/);
});
