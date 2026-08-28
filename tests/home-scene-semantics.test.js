import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";

test("builds exactly the six semantic physical stations", () => {
  const materials = createRoomMaterials(THREE);
  const room = buildStudyRoom({ THREE, materials });

  assert.deepEqual(Object.keys(room.stations).sort(), [
    "assessment",
    "desk",
    "future-paths",
    "memory",
    "progress",
    "social"
  ]);
  for (const station of Object.values(room.stations)) {
    assert.ok(station.anchor?.isObject3D);
    assert.ok(station.target?.isVector3);
    assert.ok(station.hitArea?.isObject3D);
  }
  assert.equal(room.occlusionAudit.mainMonitorClear, true);
  assert.ok(room.group.children.length >= 8);
  room.dispose();
});

test("uses named study objects instead of arbitrary sci-fi props", async () => {
  const source = await readFile(new URL("../src/home/scene/build-room.js", import.meta.url), "utf8");

  for (const builder of [
    "buildDesk",
    "buildErgonomicChair",
    "buildArticulatedLamp",
    "buildMainMonitor",
    "buildMemoryWall",
    "buildSocialDisplay",
    "buildAssessmentConsole",
    "buildProgressDisplay",
    "buildFutureArchive"
  ]) assert.match(source, new RegExp(`function ${builder}\\(`));

  assert.doesNotMatch(source, /TorusGeometry|decorativeSphere|planet/i);
});

test("renderer lifecycle is local to the homepage and fully disposable", async () => {
  const renderer = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  const interaction = await readFile(new URL("../src/home/scene/interaction-controller.js", import.meta.url), "utf8");

  assert.match(renderer, /vendor\/three\/three\.module\.min\.js/);
  assert.match(renderer, /cancelAnimationFrame/);
  assert.match(renderer, /ResizeObserver/);
  assert.match(renderer, /visibilitychange/);
  assert.match(interaction, /Raycaster/);
  assert.match(interaction, /hitArea/);
  assert.doesNotMatch(interaction, /keydown|keyup/);
});
