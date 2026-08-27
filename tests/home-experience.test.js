import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../src/home/study-hub-webgl.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home mounts a real WebGL Study Hub controlled by scroll", () => {
  assert.match(home, /study-hub-canvas/);
  assert.match(home, /mountStudyHubWebGL/);
  assert.match(webgl, /webgl2/);
  assert.match(webgl, /createShader/);
  assert.match(webgl, /journey/);
  assert.match(webgl, /hubNodes/);
  assert.doesNotMatch(home, /knowledge-sphere/);
  assert.doesNotMatch(home, /CAPISCI\./);
});

test("home motion respects reduced-motion preferences", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
