import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHomeV30CameraTimeline } from "../src/home/scene/home-v30-camera-timeline.js";

function distance(a, b) {
  return Math.hypot(...a.map((value, index) => value - b[index]));
}

test("V30 opens from inside the studio instead of a dollhouse overview", () => {
  for (const layout of ["desktop", "mobile"]) {
    const shot = createHomeV30CameraTimeline({ layout }).sample(.03);
    assert.ok(Math.abs(shot.position[0]) < 5.25, `${layout} camera stays within the side walls`);
    assert.ok(shot.position[1] < 4.2, `${layout} camera stays at human interior height`);
    assert.ok(shot.position[2] < 6.2, `${layout} camera does not retreat into an exterior overview`);
    assert.ok(distance(shot.position, shot.target) < 7.5, `${layout} opening remains an intimate workstation shot`);
  }
});

test("V30 Blender pipeline applies the authored realism polish before export", async () => {
  const workflow = await readFile(new URL("../.github/workflows/build-home-v30.yml", import.meta.url), "utf8");
  const polish = await readFile(new URL("../scripts/blender/polish-home-v30.py", import.meta.url), "utf8");

  assert.match(workflow, /polish-home-v30\.py/);
  assert.match(polish, /ShaderNodeHueSaturation/);
  assert.match(polish, /Chair_Seat_Manufactured/);
  assert.match(polish, /ScreenUI_Header/);
  assert.match(polish, /V30_Polish_Rug/);
  assert.match(polish, /bpy\.ops\.export_scene\.gltf/);
});
