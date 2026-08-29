import test from "node:test";
import assert from "node:assert/strict";
import { resolveHomeMotionMode } from "../src/home/home-experience.js";
import {
  initialVisualizationState,
  nextVisualizationState,
} from "../src/visualizations/visualization-registry.js";
import { readFile } from "node:fs/promises";

test("WebGL keeps the user-driven cinematic journey even when reduced motion is requested", () => {
  assert.equal(resolveHomeMotionMode({ preference: "reduced", mediaReduced: false, width: 1440, webgl: true }), "cinematic");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: true, width: 1440, webgl: true }), "cinematic");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: false, width: 420, webgl: false }), "dom");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: false, width: 1440, webgl: true }), "cinematic");
});

test("small screens keep the same scroll-driven 3D journey when WebGL is available", () => {
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: false, width: 420, webgl: true }), "cinematic");
  assert.equal(resolveHomeMotionMode({ preference: "system", mediaReduced: false, width: 375, webgl: true }), "cinematic");
});

test("reduced motion no longer collapses the mobile journey to a static frame", () => {
  assert.equal(resolveHomeMotionMode({ preference: "reduced", mediaReduced: false, width: 420, webgl: true }), "cinematic");
  assert.equal(resolveHomeMotionMode({ preference: "normal", mediaReduced: true, width: 420, webgl: true }), "cinematic");
});

test("reduced motion preserves the physical scroll runway", async () => {
  const css = await readFile(new URL("../styles/home-immersive.css", import.meta.url), "utf8");
  const reducedMotionRules = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.doesNotMatch(reducedMotionRules, /\.home-journey[\s\S]{0,120}min-height:\s*auto/);
  assert.doesNotMatch(reducedMotionRules, /\[data-motion="reduced"\][\s\S]{0,120}min-height:\s*auto/);
});

test("reduced motion starts visualizations at the complete explanatory state", () => {
  assert.deepEqual(initialVisualizationState(4, true), { step: 3, playing: false, reducedMotion: true });
});

test("visualization step controls remain inside the available sequence", () => {
  assert.equal(nextVisualizationState({ step: 0, playing: false, reducedMotion: false }, -1, 4).step, 0);
  assert.equal(nextVisualizationState({ step: 3, playing: false, reducedMotion: false }, 1, 4).step, 3);
  assert.equal(nextVisualizationState({ step: 1, playing: false, reducedMotion: false }, 1, 4).step, 2);
});
