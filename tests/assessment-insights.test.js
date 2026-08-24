import test from "node:test";
import assert from "node:assert/strict";
import { deriveAssessmentInsights } from "../src/assessment/insights.js";

const assessment = {
  competencies: [{ id: "k1", label: "KPI" }],
  questions: [{ id: "q1", chapterIds: ["c1"], competencyIds: ["k1"], weight: 1 }]
};
const attempt = (id, score) => ({ id, submittedAt: `2026-08-2${id}T10:00:00Z`, result: { questions: { q1: { score } }, byCompetency: { k1: { percent: score * 100 } } } });

test("flags the same missed question after two attempts", () => {
  const insights = deriveAssessmentInsights(assessment, [attempt("1", 0), attempt("2", 0)]);
  assert.equal(insights.recurringErrors[0].questionId, "q1");
  assert.equal(insights.reviewChapters[0].chapterId, "c1");
});

test("a later correct answer lowers but does not erase review priority", () => {
  const before = deriveAssessmentInsights(assessment, [attempt("1", 0), attempt("2", 0)]);
  const after = deriveAssessmentInsights(assessment, [attempt("1", 0), attempt("2", 0), attempt("3", 1)]);
  assert.ok(after.reviewChapters[0].priority < before.reviewChapters[0].priority);
  assert.equal(after.recurringErrors.length, 1);
});

test("classifies competency from recent weighted performance", () => {
  assert.equal(deriveAssessmentInsights(assessment, [attempt("1", 1)]).competencies[0].status, "solid");
  assert.equal(deriveAssessmentInsights(assessment, [attempt("1", 0)]).competencies[0].status, "review");
});

test("keeps untouched competencies as not assessed", () => {
  const expanded = { ...assessment, competencies: [...assessment.competencies, { id: "k2", label: "Retention" }] };
  const competency = deriveAssessmentInsights(expanded, [attempt("1", 1)]).competencies.find(item => item.id === "k2");
  assert.deepEqual(competency, { id: "k2", label: "Retention", percent: null, status: "not-assessed" });
});
