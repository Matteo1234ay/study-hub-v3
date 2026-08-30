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
  assert.ok(samples[0].ambient >= .46 && samples[0].ambient <= .54);
});

test("next station begins illuminating before its reading hold", () => {
  const controller = createLightingController();
  assert.ok(controller.sample(.2).memory > 0);
  assert.ok(controller.sample(.42).social > 0);
  assert.ok(controller.sample(.58).assessment > 0);
  assert.ok(controller.sample(.75).progress > 0);
  assert.ok(controller.sample(.9).future > 0);
});

test("general room light remains present throughout the journey and lifts only near the reveal", () => {
  const controller = createLightingController();
  const early = controller.sample(0).room;
  const beforeReveal = controller.sample(.93).room;
  const reveal = controller.sample(.97).room;
  const final = controller.sample(1).room;

  assert.ok(early >= .22 && early <= .55);
  assert.equal(beforeReveal, early);
  assert.ok(reveal > beforeReveal);
  assert.ok(final > reveal && final <= .55);
});

test("active station gets a restrained focus while previous stations remain visibly on", () => {
  const controller = createLightingController();
  const state = controller.sample(.66, "assessment");
  assert.equal(state.focusStation, "assessment");
  assert.ok(state.desk > 0);
  assert.ok(state.memory > 0);
  assert.ok(state.social > 0);
  assert.ok(state.assessment > 0);
  assert.ok(state.focusBoost > 0 && state.focusBoost <= .7);
  assert.ok(state.peripheralFloor >= .12);
});

test("apply updates persistent zones, screen emission and guided light target", () => {
  const light = () => ({ intensity: 0, position: { set(...values) { this.values = values; } } });
  const screen = () => ({ material: { emissiveIntensity: 0 } });
  const target = { position: { set(...values) { this.values = values; } }, updateMatrixWorld() {} };
  const rig = {
    ambient: light(),
    room: light(),
    guide: { light: light(), target },
    desk: { light: light(), screen: screen() },
    memory: { light: light(), screen: screen() },
    social: { light: light(), screen: screen() },
    assessment: { light: light(), screen: screen() },
    progress: { light: light(), screen: screen() },
    future: { light: light(), screen: screen() }
  };
  const controller = createLightingController(rig);
  const state = controller.apply(.66, {
    focusStation: "assessment",
    target: [2.55, .92, -.58],
    cameraPosition: [4.1, 2.1, 3.1],
    readStrength: 1,
    lightingScale: .9
  });

  assert.equal(rig.ambient.intensity, state.ambient);
  assert.ok(rig.room.intensity >= .22);
  assert.ok(rig.desk.light.intensity >= state.peripheralFloor);
  assert.ok(rig.assessment.light.intensity > rig.desk.light.intensity);
  assert.ok(rig.assessment.light.intensity < 2);
  assert.ok(rig.social.screen.material.emissiveIntensity > 0);
  assert.ok(rig.guide.light.intensity > 0 && rig.guide.light.intensity < 2.5);
  assert.deepEqual(rig.guide.target.position.values, [2.55, .92, -.58]);
});