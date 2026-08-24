import test from "node:test";
import assert from "node:assert/strict";
import { summarizeAssessmentProgress } from "../src/assessment/insights.js";

test("summarizes latest best and completed attempt count", () => {
  const attempts = [
    { id: "a", chapterId: null, submittedAt: "2026-08-20", result: { total: { percent: 80 } } },
    { id: "b", chapterId: "c1", submittedAt: "2026-08-21", result: { total: { percent: 100 } } },
    { id: "c", chapterId: null, submittedAt: "2026-08-22", result: { total: { percent: 70 } } }
  ];
  assert.deepEqual(summarizeAssessmentProgress(attempts), { latest: 70, best: 80, moduleAttempts: 2, totalAttempts: 3 });
});
