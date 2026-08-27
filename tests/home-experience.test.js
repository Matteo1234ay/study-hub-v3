import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../src/home/study-hub-webgl.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home remains a long cinematic tour",()=>{assert.match(home,/study-hub-canvas/);assert.match(home,/hub-station/);assert.match(home,/data-hold/);assert.match(css,/1100vh/);});
test("renderer keeps realistic study furniture",()=>{assert.match(webgl,/sdCylinder/);assert.match(webgl,/sdTorus/);assert.match(webgl,/sdCapsule/);assert.match(webgl,/chair/i);assert.match(webgl,/lamp/i);assert.match(webgl,/keyboard/i);assert.match(webgl,/woodMaterial/);assert.match(webgl,/metalMaterial/);assert.match(webgl,/glassMaterial/);});
test("performance budget is explicitly reduced",()=>{assert.match(webgl,/PERF_BUDGET/);assert.match(webgl,/for\(int i=0;i<104;i\+\+\)/);assert.match(webgl,/for\(int i=0;i<10;i\+\+\)/);assert.match(webgl,/for\(int i=0;i<3;i\+\+\)/);});
test("camera is choreographed around semantic targets",()=>{assert.match(webgl,/semanticTarget/);assert.match(webgl,/cameraPose/);assert.match(webgl,/shotAnchors/);assert.match(webgl,/smoothCamera/);for(const label of ["DESK","NOTES","SMM","QUIZ","PROGRESS","FUTURE"])assert.match(webgl,new RegExp(label));});
test("screen visuals explain each station",()=>{for(const name of ["screenLessonVisual","screenNotesVisual","screenSocialVisual","screenQuizVisual","screenProgressVisual"])assert.match(webgl,new RegExp(name));assert.match(home,/monitor/i);assert.match(home,/pannello.*note|note.*pannello/i);assert.match(home,/console.*verifica|verifica.*console/i);assert.match(home,/display.*progress|progress.*display/i);assert.match(home,/moduli.*dormienti|dormienti.*moduli/i);});
test("lighting starts readable and ends with full reveal",()=>{assert.match(webgl,/initialAmbient/);assert.match(webgl,/guidedLight/);assert.match(webgl,/monitorPower/);assert.match(webgl,/lampPower/);assert.match(webgl,/roomPower/);assert.match(webgl,/smoothstep\(\.94,1\.,j\)/);});
test("home motion respects reduced-motion preferences",()=>{assert.match(css,/prefers-reduced-motion:\s*reduce/);});
