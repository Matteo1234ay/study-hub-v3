import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("V29 Blender generator defines distinct physical material families", () => {
  const path = "scripts/blender/build-home-v29.py";
  assert.ok(existsSync(path), "missing V29 Blender build script");
  const source = readFileSync(path, "utf8");
  assert.match(source, /Walnut/i);
  assert.match(source, /(Graphite|Aluminum)/i);
  assert.match(source, /Fabric_Charcoal/i);
  assert.match(source, /Paper/i);
  assert.match(source, /Glass/i);
  assert.match(source, /Wall_Plaster/i);
  assert.doesNotMatch(source, /blue.*(metal|fabric|floor)|deep-blue-floor/i);
});

test("V29 Blender generator creates real mechanical parts and curved hero geometry", () => {
  const source = readFileSync("scripts/blender/build-home-v29.py", "utf8");
  for (const name of ["DrawerTop", "DrawerMiddle", "CabinetDoor", "PulloutShelf", "LampJointLower", "LampJointUpper"]) {
    assert.match(source, new RegExp(name), `missing modeled part ${name}`);
  }
  assert.match(source, /(SUBSURF|Subdivision|bezier|curve|primitive_uv_sphere|primitive_cylinder)/i,
    "chair/lamp silhouettes need curved or subdivided geometry");
  assert.match(source, /pivot|hinge|parent/i, "mechanical hierarchy must encode pivots/parents");
});

test("V29 visual policy reserves Study Hub blue for accents instead of physical surfaces", () => {
  assert.ok(existsSync("src/home/scene/home-v29-material-policy.js"), "missing V29 material policy");
  const source = readFileSync("src/home/scene/home-v29-material-policy.js", "utf8");
  assert.match(source, /blue/i);
  assert.match(source, /(accent|emissive|screen|led)/i);
  assert.match(source, /(walnut|graphite|fabric|paper|glass|plaster)/i);
});
