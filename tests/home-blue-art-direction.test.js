import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const rendererSource = fs.readFileSync(new URL("../src/home/scene/renderer-setup.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("the V29 physical studio uses neutral atmosphere, warm key light and restrained cool fill", () => {
  assert.match(rendererSource, /scene\.background = new THREE\.Color\(0x12161b\)/);
  assert.match(rendererSource, /scene\.fog = new THREE\.Fog\(0x171b20/);
  assert.match(rendererSource, /HemisphereLight\(0xf1e6dc, 0x323946/);
  assert.match(rendererSource, /DirectionalLight\(0xffefe2/);
  assert.match(rendererSource, /DirectionalLight\(0xa8b7c9/);
  assert.doesNotMatch(rendererSource, /scene\.background = new THREE\.Color\(0x071536\)/,
    "the old blue-dominant V28 room must not return as the primary art direction");
});

test("home overlays keep the Study Hub blue only as a restrained interface accent", () => {
  assert.match(css, /--home-shadow-rgb:\s*3, 10, 35/);
  assert.doesNotMatch(css, /rgba\(7, 10, 15/);
  assert.doesNotMatch(css, /rgba\(4, 7, 11/);
});
