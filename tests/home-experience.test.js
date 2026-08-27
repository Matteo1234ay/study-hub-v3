import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../src/home/study-hub-webgl.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home is a long cinematic tour through a recognizable study hub", () => { assert.match(home,/study-hub-canvas/);assert.match(home,/hub-station/);assert.match(home,/data-hold/);assert.match(css,/1100vh/); });
test("stations have readable dwell",()=>{assert.match(home,/focusWithHold/);assert.match(css,/transition:opacity \.32s ease/);});
test("WebGL renderer models designed furniture",()=>{assert.match(webgl,/sdCylinder/);assert.match(webgl,/sdTorus/);assert.match(webgl,/sdCapsule/);assert.match(webgl,/chair/i);assert.match(webgl,/lamp/i);assert.match(webgl,/keyboard/i);});
test("study hub uses realistic materials and environmental lighting",()=>{assert.match(webgl,/woodMaterial/);assert.match(webgl,/metalMaterial/);assert.match(webgl,/glassMaterial/);assert.match(webgl,/softShadow/);assert.match(webgl,/ambientOcclusion/);assert.match(webgl,/warmLamp/);assert.match(webgl,/book/i);assert.match(webgl,/mug/i);});
test("lighting is staged and interactive through the journey",()=>{assert.match(webgl,/lightingJourney/);assert.match(webgl,/monitorPower/);assert.match(webgl,/lampPower/);assert.match(webgl,/roomPower/);assert.match(webgl,/followLight/);assert.match(webgl,/mouseLight/);assert.match(webgl,/smoothstep\(\.94,1\.,j\)/);});
test("home motion respects reduced-motion preferences",()=>{assert.match(css,/prefers-reduced-motion:\s*reduce/);});
