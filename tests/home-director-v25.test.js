import test from "node:test";
import assert from "node:assert/strict";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";
import { createDirectorController } from "../src/home/scene/director-controller.js";

test("director exposes deterministic approach read and release phases", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  const director = createDirectorController({ timeline, layout: "desktop" });

  for (const window of timeline.stationWindows()) {
    const readMid = (window.readStart + window.readEnd) / 2;
    const read = director.sample(readMid);
    assert.equal(read.stationId, window.stationId, `${window.stationId} read station`);
    assert.equal(read.phase, "read", `${window.stationId} read phase`);
    assert.equal(read.readStrength, 1, `${window.stationId} read strength`);

    if (window.readStart > window.enter) {
      const approachMid = (window.enter + window.readStart) / 2;
      const approach = director.sample(approachMid);
      assert.equal(approach.stationId, window.stationId, `${window.stationId} approach station`);
      assert.equal(approach.phase, "approach", `${window.stationId} approach phase`);
      assert.ok(approach.readStrength > 0 && approach.readStrength < 1);
    }

    if (window.releaseEnd > window.readEnd) {
      const releaseMid = (window.readEnd + window.releaseEnd) / 2;
      const release = director.sample(releaseMid);
      assert.equal(release.stationId, window.stationId, `${window.stationId} release station`);
      assert.equal(release.phase, "release", `${window.stationId} release phase`);
      assert.ok(release.readStrength > 0 && release.readStrength < 1);
    }
  }
});

test("scroll velocity damps visuals without changing semantic direction", () => {
  const timeline = createCameraTimeline({ layout: "desktop" });
  const director = createDirectorController({ timeline, layout: "desktop" });
  const progress = timeline.stationProgress("social");
  const slow = director.sample(progress, { scrollVelocity: 0 });
  const fast = director.sample(progress, { scrollVelocity: 4 });

  assert.equal(slow.stationId, fast.stationId);
  assert.equal(slow.phase, fast.phase);
  assert.ok(fast.parallaxScale < slow.parallaxScale);
  assert.ok(fast.motionScale <= slow.motionScale);
});

test("director output remains bounded at journey edges", () => {
  const timeline = createCameraTimeline({ layout: "mobile" });
  const director = createDirectorController({ timeline, layout: "mobile" });

  for (const progress of [-2, 0, 1, 4]) {
    const state = director.sample(progress, { scrollVelocity: 100 });
    assert.ok(["approach", "read", "release"].includes(state.phase));
    for (const key of ["phaseProgress", "readStrength", "captionStrength", "motionScale", "parallaxScale", "lightingScale"]) {
      assert.ok(Number.isFinite(state[key]), `${key} must be finite`);
      assert.ok(state[key] >= 0 && state[key] <= 1, `${key} must stay in 0..1`);
    }
  }
});
