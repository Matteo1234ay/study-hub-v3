import test from "node:test";
import assert from "node:assert/strict";
import * as homeExperience from "../src/home/home-experience.js";
import { createCameraTimeline } from "../src/home/scene/camera-timeline.js";

test("the final scroll segment is reserved for a user-driven exit phase", () => {
  assert.equal(typeof homeExperience.resolveJourneyPhases, "function");
  if (typeof homeExperience.resolveJourneyPhases !== "function") return;

  const beforeExit = homeExperience.resolveJourneyPhases(.84);
  const exitStart = homeExperience.resolveJourneyPhases(.92);
  const exitMiddle = homeExperience.resolveJourneyPhases(.96);
  const exitEnd = homeExperience.resolveJourneyPhases(.995);

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
