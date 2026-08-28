import test from "node:test";
import assert from "node:assert/strict";
import { createQualityController } from "../src/home/scene/quality-controller.js";

test("caps DPR according to the active quality profile", () => {
  const high = createQualityController({ devicePixelRatio: 3 });
  const balanced = createQualityController({ devicePixelRatio: 3, initialProfile: "balanced" });
  const low = createQualityController({ devicePixelRatio: 3, initialProfile: "low" });

  assert.equal(high.getDprCap(), 1.5);
  assert.equal(balanced.getDprCap(), 1.25);
  assert.equal(low.getDprCap(), 1);
});

test("downgrades after 90 consecutive slow frames", () => {
  const quality = createQualityController({ devicePixelRatio: 2 });
  for (let index = 0; index < 89; index += 1) quality.recordFrame(25);
  assert.equal(quality.profile, "high");
  quality.recordFrame(25);
  assert.equal(quality.profile, "balanced");
});

test("does not upgrade more often than once every ten seconds", () => {
  let now = 0;
  const quality = createQualityController({
    devicePixelRatio: 2,
    initialProfile: "low",
    now: () => now
  });
  for (let index = 0; index < 180; index += 1) quality.recordFrame(10);
  assert.equal(quality.profile, "low");

  now = 10_001;
  for (let index = 0; index < 180; index += 1) quality.recordFrame(10);
  assert.equal(quality.profile, "balanced");

  now = 15_000;
  for (let index = 0; index < 180; index += 1) quality.recordFrame(10);
  assert.equal(quality.profile, "balanced");
});

test("hidden state pauses frames and reduced motion starts balanced and static", () => {
  const quality = createQualityController({ devicePixelRatio: 2, reducedMotion: true });
  assert.equal(quality.profile, "balanced");
  assert.equal(quality.isStatic, true);
  quality.setVisible(false);
  assert.equal(quality.isVisible, false);
  assert.equal(quality.recordFrame(50), false);
});

test("quality controller never reports a DPR above its profile cap", () => {
  for (const [initialProfile, cap] of [["high", 1.5], ["balanced", 1.25], ["low", 1]]) {
    const quality = createQualityController({ devicePixelRatio: 8, initialProfile });
    assert.ok(quality.getDprCap() <= cap);
  }
});
