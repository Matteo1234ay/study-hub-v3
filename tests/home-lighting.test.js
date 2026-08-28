import test from "node:test";
import assert from "node:assert/strict";
import { createLightingController } from "../src/home/scene/lighting-controller.js";

test("station lighting activates cumulatively and never switches off", () => {
  const controller = createLightingController();
  const samples = [0, .22, .38, .54, .68, .8, .9, 1].map(value => controller.sample(value));
  const cumulative = ["desk", "memory", "social", "assessment", "progress", "future"];

  for (const key of cumulative) {
    for (let index = 1; index < samples.length; index += 1) {
      assert.ok(samples[index][key] >= samples[index - 1][key], `${key} decreased`);
    }
  }
  assert.ok(samples[0].ambient > 0);
});

test("general room light stays off until the final reveal", () => {
  const controller = createLightingController();
  assert.equal(controller.sample(.93).room, 0);
  assert.equal(controller.sample(.94).room, 0);
  assert.ok(controller.sample(.97).room > 0);
  assert.equal(controller.sample(1).room, 1);
});

test("apply updates supplied lights and screen emissions", () => {
  const light = () => ({ intensity: 0 });
  const screen = () => ({ material: { emissiveIntensity: 0 } });
  const rig = {
    ambient: light(),
    room: light(),
    desk: { light: light(), screen: screen() },
    memory: { light: light(), screen: screen() },
    social: { light: light(), screen: screen() },
    assessment: { light: light(), screen: screen() },
    progress: { light: light(), screen: screen() },
    future: { light: light(), screen: screen() }
  };
  const controller = createLightingController(rig);
  const state = controller.apply(.72);

  assert.equal(rig.ambient.intensity, state.ambient);
  assert.equal(rig.desk.light.intensity, state.desk);
  assert.equal(rig.social.screen.material.emissiveIntensity, state.social * .75);
  assert.equal(rig.progress.light.intensity, 0);
});
