import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function source(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const cameraPath = "src/home/scene/home-v30-camera-timeline.js";
const dematerializationPath = "src/home/scene/home-v30-dematerialization.js";

test("V30 owns a dedicated desktop/mobile camera timeline", () => {
  assert.ok(existsSync(cameraPath), "missing V30 camera timeline");
  const camera = source(cameraPath);
  assert.match(camera, /createHomeV30CameraTimeline/);
  for (const station of ["desk", "memory", "social", "assessment", "progress", "future-paths"]) {
    assert.match(camera, new RegExp(`stationId:\\s*["']${station}["']`), `missing ${station} camera beat`);
  }
  assert.match(camera, /layout\s*===\s*["']mobile["']/);
  assert.match(camera, /function\s+exit|exit\s*\(/);
});

test("V30 production renderer uses only the dedicated V30 camera choreography", () => {
  const renderer = source("src/home/scene/study-room-renderer.js");
  assert.match(renderer, /createHomeV30CameraTimeline/);
  assert.doesNotMatch(renderer, /createCameraTimeline/);
});

test("V30 archive transition is physical and deterministic, not synthetic geometry", () => {
  assert.ok(existsSync(dematerializationPath), "missing V30 physical dematerialization controller");
  const demat = source(dematerializationPath);
  assert.match(demat, /createHomeV30Dematerialization/);
  for (const node of [
    "Chair_Master",
    "Lamp_Base",
    "MonitorBank_Master",
    "SecondaryDisplay_Master",
    "ArchiveWall_Master",
    "BinderSet_Master",
    "BookStack_Master",
    "PathsHandoff_Master"
  ]) {
    assert.match(demat, new RegExp(node), `missing physical V30 node ${node}`);
  }
  assert.doesNotMatch(demat, /Math\.random/);
  assert.match(demat, /basePosition|baseScale|baseQuaternion|baseRotation/);
});

test("V30 renderer never instantiates the legacy particle/polyhedron archive", () => {
  const renderer = source("src/home/scene/study-room-renderer.js");
  assert.match(renderer, /createHomeV30Dematerialization/);
  assert.doesNotMatch(renderer, /createArchiveField/);
  assert.doesNotMatch(renderer, /archiveField/);
  assert.doesNotMatch(renderer, /IcosahedronGeometry|THREE\.Points|THREE\.LineSegments/);
});

test("V30 paths handoff is anchored to the physical Blender scene", () => {
  const controller = source("src/home/scene/home-v30-controller.js");
  const renderer = source("src/home/scene/study-room-renderer.js");
  assert.match(controller, /ArchiveOrigin_Paths|HOME_V30_NODES/);
  assert.match(renderer, /ArchiveOrigin_Paths/);
  assert.match(renderer, /projectObjectToCss/);
});
