import test from "node:test";
import assert from "node:assert/strict";
import { resolveHomeMotionMode } from "../src/home/home-experience.js";
import {
  initialVisualizationState,
  nextVisualizationState,
} from "../src/visualizations/visualization-registry.js";

test("resolves cinematic, static 3D and DOM modes from real capabilities", () => {
  assert.equal(resolveHomeMotionMode({ preference: "reduced", mediaReduced: false, width: 1440, webgl: true }), "static-3d");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: true, width: 1440, webgl: true }), "static-3d");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: false, width: 420, webgl: false }), "dom");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: false, width: 1440, webgl: true }), "cinematic");
});

test("small screens keep the room but remove the long scroll journey", () => {
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: false, width: 420, webgl: true }), "static-3d");
});

test("reduced motion starts visualizations at the complete explanatory state", () => {
  assert.deepEqual(initialVisualizationState(4, true), { step: 3, playing: false, reducedMotion: true });
});

test("visualization step controls remain inside the available sequence", () => {
  assert.equal(nextVisualizationState({ step: 0, playing: false, reducedMotion: false }, -1, 4).step, 0);
  assert.equal(nextVisualizationState({ step: 3, playing: false, reducedMotion: false }, 1, 4).step, 3);
  assert.equal(nextVisualizationState({ step: 1, playing: false, reducedMotion: false }, 1, 4).step, 2);
});
