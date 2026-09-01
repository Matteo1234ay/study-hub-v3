import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const rendererSource = fs.readFileSync(new URL("../src/home/scene/renderer-setup.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("the V30 physical studio uses a neutral atmosphere, warm key and restrained cool fill", () => {
  assert.match(rendererSource, /scene\.background = new THREE\.Color\(0x17191b\)/);
  assert.match(rendererSource, /scene\.fog = new THREE\.Fog\(0x1d2022/);
  assert.match(rendererSource, /HemisphereLight\(0xf1e6dc, 0x2a3038/);
  assert.match(rendererSource, /DirectionalLight\(0xffe3c6/);
  assert.match(rendererSource, /DirectionalLight\(0xb9c8d7/);
  assert.doesNotMatch(rendererSource, /scene\.background = new THREE\.Color\(0x071536\)/,
    "the old blue-dominant room must not return as the primary art direction");
});

test("home overlays keep the Study Hub blue only as a restrained interface accent", () => {
  assert.match(css, /--home-shadow-rgb:\s*3, 10, 35/);
  assert.doesNotMatch(css, /rgba\(7, 10, 15/);
  assert.doesNotMatch(css, /rgba\(4, 7, 11/);
});
