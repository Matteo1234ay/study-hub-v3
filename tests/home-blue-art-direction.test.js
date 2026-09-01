import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const rendererSource = fs.readFileSync(new URL("../src/home/scene/renderer-setup.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("the 3D world uses a blue atmospheric background and blue-balanced fill", () => {
  assert.match(rendererSource, /scene\.background = new THREE\.Color\(0x071536\)/);
  assert.match(rendererSource, /scene\.fog = new THREE\.Fog\(0x071536/);
  assert.match(rendererSource, /HemisphereLight\(0xb9d8ff, 0x06112f/);
  assert.match(rendererSource, /DirectionalLight\(0x7aa8ff/);
});

test("home overlays tint shadows blue instead of neutral black", () => {
  assert.match(css, /--home-shadow-rgb:\s*3, 10, 35/);
  assert.doesNotMatch(css, /rgba\(7, 10, 15/);
  assert.doesNotMatch(css, /rgba\(4, 7, 11/);
});
