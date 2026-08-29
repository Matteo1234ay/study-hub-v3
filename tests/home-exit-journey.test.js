import test from "node:test";
import assert from "node:assert/strict";
import * as homeExperience from "../src/home/home-experience.js";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";

test("desktop and mobile reserve the requested physical scroll runway", () => {
  assert.deepEqual(homeExperience.resolveJourneyLayout(1440), {
    contentVh: 600,
    exitVh: 140,
    totalVh: 740,
    contentEnd: 600 / 740
  });
  assert.deepEqual(homeExperience.resolveJourneyLayout(390), {
    contentVh: 1100,
    exitVh: 180,
    totalVh: 1280,
    contentEnd: 1100 / 1280
  });
});

test("the final scroll segment is reserved for a user-driven exit phase", () => {
  assert.equal(typeof homeExperience.resolveJourneyPhases, "function");
  if (typeof homeExperience.resolveJourneyPhases !== "function") return;

  const boundary = 600 / 740;
  const beforeExit = homeExperience.resolveJourneyPhases(.7, 1440);
  const exitStart = homeExperience.resolveJourneyPhases(boundary, 1440);
  const exitMiddle = homeExperience.resolveJourneyPhases(boundary + (1 - boundary) / 2, 1440);
  const exitEnd = homeExperience.resolveJourneyPhases(.995, 1440);

  assert.ok(beforeExit.sceneProgress < 1);
  assert.equal(exitStart.sceneProgress, 1);
  assert.equal(exitStart.exitProgress, 0);
  assert.ok(exitMiddle.exitProgress > .4 && exitMiddle.exitProgress < .6);
  assert.equal(exitMiddle.shouldExit, false);
  assert.equal(exitEnd.sceneProgress, 1);
  assert.equal(exitEnd.shouldExit, true);
});

test("desktop and mobile timelines expose a distinct cinematic exit camera", () => {
  for (const layout of ["desktop", "mobile"]) {
    const timeline = createCameraTimeline({ layout });
    assert.equal(typeof timeline.exit, "function", `${layout} timeline needs an exit camera`);
    if (typeof timeline.exit !== "function") continue;

    const start = timeline.exit(0);
    const finish = timeline.exit(1);
    assert.equal(finish.stationId, "future-paths");
    assert.notDeepEqual(finish.position, start.position, `${layout} exit must move the camera`);
    assert.ok(finish.fov <= start.fov, `${layout} exit should push attention toward Paths`);
  }
});

test("a restored final runway stays locked until the user moves deliberately", () => {
  assert.equal(homeExperience.resolveReentryLock({
    locked: true, restoring: true, resumeProgress: .97, rawProgress: .97
  }), true);
  assert.equal(homeExperience.resolveReentryLock({
    locked: true, restoring: false, resumeProgress: .97, rawProgress: .976
  }), true);
  assert.equal(homeExperience.resolveReentryLock({
    locked: true, restoring: false, resumeProgress: .97, rawProgress: .955
  }), false);
  assert.equal(homeExperience.resolveReentryLock({
    locked: true, restoring: false, resumeProgress: .97, rawProgress: .989
  }), false);
});
