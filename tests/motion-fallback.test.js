import test from "node:test";
import assert from "node:assert/strict";
import { initialVisualizationState, nextVisualizationState } from "../src/visualizations/visualization-registry.js";

test("reduced motion starts at the complete explanatory state", () => {
  assert.deepEqual(initialVisualizationState(4, true), { step: 3, playing: false, reducedMotion: true });
});

test("step controls never move outside the available sequence", () => {
  assert.equal(nextVisualizationState({ step: 0, playing: false, reducedMotion: false }, -1, 4).step, 0);
  assert.equal(nextVisualizationState({ step: 3, playing: false, reducedMotion: false }, 1, 4).step, 3);
  assert.equal(nextVisualizationState({ step: 1, playing: false, reducedMotion: false }, 1, 4).step, 2);
});
