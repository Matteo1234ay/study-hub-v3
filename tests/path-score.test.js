import test from "node:test";
import assert from "node:assert/strict";
import { progressiveLevel, scoreFinalGate } from "../src/path-assessment/path-score.js";

const manifest = { status: "in-progress", lessons: [{ lessonId: "SMM-01" }], competencies: [{ id: "a", mandatory: true }], thresholds: { progressive: { solid: 85, good: 70, partial: 55 }, final: { pass: 75, mandatoryMin: 60 } } };

test("maps progressive boundaries and names current coverage", () => {
  assert.equal(progressiveLevel(manifest, 85).id, "solid");
  assert.equal(progressiveLevel(manifest, 70).id, "good");
  assert.equal(progressiveLevel(manifest, 55).id, "partial");
  assert.equal(progressiveLevel(manifest, 54).id, "consolidate");
  assert.match(progressiveLevel(manifest, 85).description, /SMM-01/);
});

test("keeps final exam locked until complete", () => {
  assert.deepEqual(scoreFinalGate(manifest, { total: { percent: 100 }, byCompetency: { a: { percent: 100 } } }), { unlocked: false, passed: false, level: "locked" });
});

test("requires mandatory competency minimum even with passing total", () => {
  const complete = { ...manifest, status: "complete" };
  assert.equal(scoreFinalGate(complete, { total: { percent: 90 }, byCompetency: { a: { percent: 50 } } }).passed, false);
  assert.equal(scoreFinalGate(complete, { total: { percent: 80 }, byCompetency: { a: { percent: 70 } } }).passed, true);
});
