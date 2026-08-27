import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../src/home/study-hub-webgl.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home is a long cinematic tour through a recognizable study hub", () => {
  assert.match(home, /study-hub-canvas/);
  assert.match(home, /hub-station/);
  assert.match(home, /data-center/);
  assert.match(css, /900vh/);
  assert.doesNotMatch(home, /CAPISCI\./);
});

test("WebGL renderer models a room and choreographs the camera", () => {
  assert.match(webgl, /webgl2/);
  assert.match(webgl, /sdRoundBox/);
  assert.match(webgl, /lookAt/);
  assert.match(webgl, /cameraJourney/);
  assert.match(webgl, /desk/i);
  assert.match(webgl, /screen/i);
  assert.match(webgl, /journey/);
});

test("home motion respects reduced-motion preferences", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
