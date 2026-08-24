import test from "node:test";
import assert from "node:assert/strict";
import { scoreAttempt, scoreQuestion } from "../src/assessment/assessment-engine.js";

const assessment = {
  lessonId: "SMM-01", version: 1,
  questions: [
    { id: "q1", type: "single-choice", correct: "a", weight: 2, chapterIds: ["c1"], competencyIds: ["k1"], explanation: "x" },
    { id: "q2", type: "boolean", correct: false, weight: 1, chapterIds: ["c2"], competencyIds: ["k1", "k2"], explanation: "y" },
    { id: "q3", type: "open", weight: 1, chapterIds: ["c2"], competencyIds: ["k2"], explanation: "z", partialThreshold: 0.5, requiredConcepts: [{ id: "goal", label: "goal", terms: ["obiettivo"] }] }
  ]
};

test("scores deterministic question types", () => {
  assert.equal(scoreQuestion(assessment.questions[0], "a").score, 1);
  assert.equal(scoreQuestion(assessment.questions[0], "b").score, 0);
  assert.equal(scoreQuestion(assessment.questions[1], false).score, 1);
  assert.equal(scoreQuestion(assessment.questions[2], "Serve un obiettivo").score, 1);
});

test("calculates weighted module chapter and competency scores", () => {
  const result = scoreAttempt(assessment, { q1: "a", q2: true, q3: "obiettivo" });
  assert.deepEqual(result.total, { earned: 3, max: 4, percent: 75 });
  assert.equal(result.byChapter.c1.percent, 100);
  assert.equal(result.byChapter.c2.percent, 50);
  assert.equal(result.byCompetency.k1.percent, 67);
  assert.equal(result.byCompetency.k2.percent, 50);
});
