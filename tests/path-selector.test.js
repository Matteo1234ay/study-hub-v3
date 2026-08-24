import test from "node:test";
import assert from "node:assert/strict";
import { buildQuestionPool } from "../src/path-assessment/question-pool.js";
import { selectPathQuestions } from "../src/path-assessment/selector.js";

const manifest = { selection: { minQuestions: 4, maxQuestions: 4 }, competencies: [{ id: "a", weight: 1 }, { id: "b", weight: 1 }], lessons: [{ lessonId: "L1" }, { lessonId: "L2" }] };
const assessments = ["L1", "L2"].map(lessonId => ({ lessonId, assessment: { questions: [0, 1, 2].map(index => ({ id: `q${index}`, chapterIds: [`c${index}`], competencyIds: [index % 2 ? "b" : "a"], weight: 1 })) } }));

test("builds a pool with stable provenance and no collisions", () => {
  const pool = buildQuestionPool({ manifest, assessments });
  assert.equal(pool.questions.length, 6);
  assert.equal(new Set(pool.questions.map(q => q.poolId)).size, 6);
  assert.deepEqual(pool.questions[0].lessonId, "L1");
});

test("selects reproducibly with competency and lesson coverage", () => {
  const pool = buildQuestionPool({ manifest, assessments });
  const first = selectPathQuestions({ manifest, pool, seed: 42, recentQuestionIds: [], weakCompetencyIds: [] });
  const second = selectPathQuestions({ manifest, pool, seed: 42, recentQuestionIds: [], weakCompetencyIds: [] });
  assert.deepEqual(first.questions.map(q => q.poolId), second.questions.map(q => q.poolId));
  assert.equal(first.questions.length, 4);
  assert.deepEqual(new Set(first.questions.flatMap(q => q.competencyIds)), new Set(["a", "b"]));
  assert.deepEqual(new Set(first.questions.map(q => q.lessonId)), new Set(["L1", "L2"]));
});

test("penalizes recently used questions", () => {
  const pool = buildQuestionPool({ manifest, assessments });
  const baseline = selectPathQuestions({ manifest, pool, seed: 9, recentQuestionIds: [], weakCompetencyIds: [] });
  const recent = baseline.questions.map(q => q.poolId);
  const next = selectPathQuestions({ manifest, pool, seed: 9, recentQuestionIds: recent, weakCompetencyIds: [] });
  assert.ok(next.questions.some(q => !recent.includes(q.poolId)));
});
