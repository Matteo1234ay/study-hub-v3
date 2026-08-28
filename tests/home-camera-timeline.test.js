import test from "node:test";
import assert from "node:assert/strict";
import {
  HOME_SHOTS,
  MOBILE_HOME_SHOTS,
  createCameraTimeline
} from "../src/home/scene/camera-timeline.js";

test("opens on a front three-quarter shot with the main monitor visible", () => {
  const timeline = createCameraTimeline({ shots: HOME_SHOTS });
  const opening = timeline.sample(0);

  assert.ok(opening.position[0] < 0);
  assert.ok(opening.position[1] > 2);
  assert.ok(opening.position[2] > 4);
  assert.equal(opening.stationId, "desk");
  assert.equal(opening.monitorVisible, true);
  assert.ok(opening.chairClearance >= .7);
});

test("provides a dedicated portrait-safe mobile camera timeline", () => {
  assert.equal(MOBILE_HOME_SHOTS.length, HOME_SHOTS.length);
  assert.deepEqual(MOBILE_HOME_SHOTS.map(shot => shot.stationId), HOME_SHOTS.map(shot => shot.stationId));
  const timeline = createCameraTimeline({ layout: "mobile" });
  const desk = timeline.sample(timeline.stationProgress("desk"));
  assert.equal(desk.stationId, "desk");
  assert.equal(desk.monitorVisible, true);
  assert.ok(desk.chairClearance >= .9);
  assert.ok(desk.fov >= 40 && desk.fov <= 48);
  assert.ok(Math.abs(desk.position[0]) >= 2.8);
});

test("mobile shots create depth without losing the surrounding room", () => {
  const distances = MOBILE_HOME_SHOTS.slice(1).map(shot => Math.hypot(
    shot.position[0] - shot.target[0],
    shot.position[1] - shot.target[1],
    shot.position[2] - shot.target[2]
  ));
  assert.ok(Math.max(...distances) < 6.5, `mobile camera remains too distant: ${Math.max(...distances)}`);
  assert.ok(Math.min(...distances) > 3.8, `mobile camera crops away room context: ${Math.min(...distances)}`);
});

test("provides a stable reading interval for every semantic station", () => {
  const timeline = createCameraTimeline({ shots: HOME_SHOTS });
  const ids = ["desk", "memory", "social", "assessment", "progress", "future-paths"];

  assert.deepEqual(HOME_SHOTS.map(shot => shot.stationId), ids);
  for (const shot of HOME_SHOTS) {
    const middle = (shot.settleStart + shot.settleEnd) / 2;
    const sample = timeline.sample(middle);
    assert.equal(sample.stationId, shot.stationId);
    assert.equal(sample.settled, true);
  }
});

test("camera and target move continuously without abrupt jumps", () => {
  for (const layout of ["desktop", "mobile"]) {
    const timeline = createCameraTimeline({ layout });
    let previous = timeline.sample(0);
    for (let index = 1; index <= 200; index += 1) {
      const current = timeline.sample(index / 200);
      for (const key of ["position", "target"]) {
        const distance = Math.hypot(...current[key].map((value, axis) => value - previous[key][axis]));
        assert.ok(distance < .28, `${layout} ${key} jumped ${distance} at ${index / 200}`);
        assert.ok(current[key].every(Number.isFinite));
      }
      assert.ok(Number.isFinite(current.fov));
      previous = current;
    }
  }
});

test("clamps progress outside the journey", () => {
  const timeline = createCameraTimeline({ shots: HOME_SHOTS });
  assert.deepEqual(timeline.sample(-2), timeline.sample(0));
  assert.deepEqual(timeline.sample(4), timeline.sample(1));
});

test("exposes exact settled anchors and a dedicated static overview", () => {
  const timeline = createCameraTimeline({ shots: HOME_SHOTS });
  for (const shot of HOME_SHOTS) {
    const progress = timeline.stationProgress(shot.stationId);
    assert.equal(timeline.sample(progress).stationId, shot.stationId);
    assert.equal(timeline.sample(progress).settled, true);
  }
  const overview = timeline.overview();
  assert.equal(overview.stationId, "overview");
  assert.ok(overview.position[2] > 6);
  assert.ok(overview.fov >= 46);
});
