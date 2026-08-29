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

test("the final runway resolves establish, dolly and handoff as separate scroll phases", () => {
  assert.equal(typeof homeExperience.resolveExitChoreography, "function");
  if (typeof homeExperience.resolveExitChoreography !== "function") return;

  const start = homeExperience.resolveExitChoreography(0);
  const establish = homeExperience.resolveExitChoreography(.1);
  const middle = homeExperience.resolveExitChoreography(.5);
  const handoff = homeExperience.resolveExitChoreography(.9);
  const finish = homeExperience.resolveExitChoreography(1);

  assert.deepEqual(start, { establish: 0, dolly: 0, handoff: 0 });
  assert.ok(establish.establish > 0 && establish.establish < 1);
  assert.equal(establish.dolly, 0);
  assert.equal(establish.handoff, 0);
  assert.equal(middle.establish, 1);
  assert.ok(middle.dolly > 0 && middle.dolly < 1);
  assert.equal(middle.handoff, 0);
  assert.equal(handoff.establish, 1);
  assert.equal(handoff.dolly, 1);
  assert.ok(handoff.handoff > 0 && handoff.handoff < 1);
  assert.deepEqual(finish, { establish: 1, dolly: 1, handoff: 1 });
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
  assert.ok(exitEnd.choreography.handoff >= .9);
  assert.equal(exitEnd.shouldExit, true);
});

test("desktop and mobile timelines expose a distinct three-phase cinematic exit camera", () => {
  for (const layout of ["desktop", "mobile"]) {
    const timeline = createCameraTimeline({ layout });
    assert.equal(typeof timeline.exit, "function", `${layout} timeline needs an exit camera`);
    if (typeof timeline.exit !== "function") continue;

    const start = timeline.exit(0);
    const establish = timeline.exit(.1);
    const dolly = timeline.exit(.5);
    const handoff = timeline.exit(.9);
    const finish = timeline.exit(1);
    assert.equal(start.phase, "establish");
    assert.equal(establish.phase, "establish");
    assert.equal(dolly.phase, "dolly");
    assert.equal(handoff.phase, "handoff");
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
