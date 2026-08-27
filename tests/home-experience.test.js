import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../src/home/study-hub-webgl.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home is a long cinematic tour through a recognizable study hub", () => {
  assert.match(home, /study-hub-canvas/);
  assert.match(home, /hub-station/);
  assert.match(home, /data-hold/);
  assert.match(css, /1100vh/);
  assert.doesNotMatch(home, /CAPISCI\./);
});

test("stations have readable dwell instead of flashing at a single center", () => {
  assert.match(home, /focusWithHold/);
  assert.match(home, /hold=/);
  assert.match(css, /transition:opacity \.32s ease,filter \.32s ease,transform \.32s ease/);
});

test("WebGL renderer models designed furniture instead of only box primitives", () => {
  assert.match(webgl, /sdCylinder/);
  assert.match(webgl, /sdTorus/);
  assert.match(webgl, /sdCapsule/);
  assert.match(webgl, /chair/i);
  assert.match(webgl, /lamp/i);
  assert.match(webgl, /keyboard/i);
  assert.match(webgl, /cameraJourney/);
});

test("home motion respects reduced-motion preferences", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
