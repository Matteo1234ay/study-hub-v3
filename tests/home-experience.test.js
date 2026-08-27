import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const webgl = fs.readFileSync(new URL("../src/home/study-hub-webgl.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home remains a long cinematic tour",()=>{assert.match(home,/study-hub-canvas/);assert.match(home,/hub-station/);assert.match(home,/data-hold/);assert.match(css,/1100vh/);});
test("renderer keeps realistic study furniture",()=>{assert.match(webgl,/sdCylinder/);assert.match(webgl,/sdTorus/);assert.match(webgl,/sdCapsule/);assert.match(webgl,/chair/i);assert.match(webgl,/lamp/i);assert.match(webgl,/keyboard/i);assert.match(webgl,/woodMaterial/);assert.match(webgl,/metalMaterial/);assert.match(webgl,/glassMaterial/);});
test("performance budget is explicitly reduced",()=>{assert.match(webgl,/PERF_BUDGET/);assert.match(webgl,/for\(int i=0;i<96;i\+\+\)/);assert.match(webgl,/for\(int i=0;i<8;i\+\+\)/);assert.match(webgl,/for\(int i=0;i<2;i\+\+\)/);});
test("camera opens on a clear three quarter view and never starts behind the chair",()=>{assert.match(webgl,/openingCamera/);assert.match(webgl,/THREE_QUARTER_FRONT/);assert.match(webgl,/chairClearance/);assert.match(webgl,/cameraPose/);});
test("camera is choreographed around semantic targets",()=>{assert.match(webgl,/semanticTarget/);assert.match(webgl,/cameraPose/);assert.match(webgl,/shotAnchors/);assert.match(webgl,/smoothCamera/);for(const label of ["DESK","NOTES","SMM","QUIZ","PROGRESS","FUTURE"])assert.match(webgl,new RegExp(label));});
test("screen visuals explain each station",()=>{for(const name of ["screenLessonVisual","screenNotesVisual","screenSocialVisual","screenQuizVisual","screenProgressVisual"])assert.match(webgl,new RegExp(name));assert.match(home,/monitor/i);assert.match(home,/pannello.*note|note.*pannello/i);assert.match(home,/console.*verifica|verifica.*console/i);assert.match(home,/display.*progress|progress.*display/i);assert.match(home,/moduli.*dormienti|dormienti.*moduli/i);});
test("materials use procedural micro texture and physically plausible response",()=>{for(const name of ["woodGrain","fabricWeave","wallMicroTexture","floorMicroTexture","fresnelSchlick","roughness"])assert.match(webgl,new RegExp(name));});
test("lighting accumulates persistently instead of switching completed zones off",()=>{assert.match(webgl,/persistentLighting/);assert.match(webgl,/deskLightHold/);assert.match(webgl,/notesLightHold/);assert.match(webgl,/socialLightHold/);assert.match(webgl,/quizLightHold/);assert.match(webgl,/progressLightHold/);assert.match(webgl,/initialAmbient/);assert.match(webgl,/guidedLight/);assert.match(webgl,/smoothstep\(\.94,1\.,j\)/);});
test("home motion respects reduced-motion preferences",()=>{assert.match(css,/prefers-reduced-motion:\s*reduce/);});
