import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../vendor/three/three.module.min.js";
import { configureStudyRenderer } from "../src/home/scene/study-room-renderer.js";

test("the renderer uses calibrated filmic output and soft shadows", () => {
  const renderer = { shadowMap: {} };
  configureStudyRenderer(THREE, renderer, { profile: "high" });

  assert.equal(renderer.outputColorSpace, THREE.SRGBColorSpace);
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping);
  assert.ok(renderer.toneMappingExposure >= .9 && renderer.toneMappingExposure <= 1.2);
  assert.equal(renderer.shadowMap.enabled, true);
  assert.equal(renderer.shadowMap.type, THREE.PCFSoftShadowMap);
});

test("low quality keeps filmic output but disables expensive shadows", () => {
  const renderer = { shadowMap: {} };
  configureStudyRenderer(THREE, renderer, { profile: "low" });
  assert.equal(renderer.toneMapping, THREE.ACESFilmicToneMapping);
  assert.equal(renderer.shadowMap.enabled, false);
});
