import test from "node:test";
import assert from "node:assert/strict";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";

function distance(left, right) {
  return Math.hypot(...left.map((value, axis) => value - right[axis]));
}

test("desktop station transfers use authored curved camera paths", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  const from = timeline.sample(.12);
  const middle = timeline.sample(.185);
  const to = timeline.sample(.25);
  const linearMid = from.position.map((value, axis) => (value + to.position[axis]) / 2);
  const targetLinearMid = from.target.map((value, axis) => (value + to.target[axis]) / 2);

  assert.ok(distance(middle.position, linearMid) > .025, "camera position still follows a straight interpolation");
  assert.ok(distance(middle.target, targetLinearMid) > .015, "look target still follows the same straight interpolation");
});

test("V25 portrait read shots use narrower FOV without losing room context", () => {
  const timeline = createCameraTimeline({ layout: "mobile" });
  const expected = new Map([
    ["desk", 46],
    ["memory", 49],
    ["social", 48],
    ["assessment", 50],
    ["progress", 48],
    ["future-paths", 49]
  ]);

  for (const [stationId, expectedFov] of expected) {
    const shot = timeline.sample(timeline.stationProgress(stationId));
    assert.equal(shot.fov, expectedFov, `${stationId} mobile read FOV`);
    const subjectDistance = distance(shot.position, shot.target);
    assert.ok(subjectDistance > 3.8 && subjectDistance < 6.5, `${stationId} keeps spatial context: ${subjectDistance}`);
  }
});

test("read anchors remain stable while only transfers arc", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  for (const window of timeline.stationWindows()) {
    const readStart = timeline.sample(window.readStart);
    const readMid = timeline.sample((window.readStart + window.readEnd) / 2);
    const readEnd = timeline.sample(window.readEnd);
    assert.equal(readStart.stationId, window.stationId);
    assert.equal(readMid.stationId, window.stationId);
    assert.equal(readEnd.stationId, window.stationId);
    assert.deepEqual(readStart.position, readMid.position);
    assert.deepEqual(readMid.position, readEnd.position);
    assert.equal(readMid.settled, true);
  }
});
