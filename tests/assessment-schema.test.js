import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateAssessment } from "../src/assessment/assessment-schema.js";

test("accepts a complete assessment and normalizes weights", () => {
  const value = {
    id: "SMM-01-v1",
    lessonId: "SMM-01",
    version: 1,
    competencies: [{ id: "kpi", label: "KPI" }],
    questions: [{
      id: "q1", type: "boolean", chapterIds: ["c1"], competencyIds: ["kpi"],
      prompt: "Un KPI è una metrica scelta.", correct: true,
      explanation: "Il KPI è legato a un obiettivo."
    }]
  };
  assert.equal(validateAssessment(value).questions[0].weight, 1);
});

test("rejects unknown question types and incomplete correction rules", () => {
  assert.equal(validateAssessment({
    id: "x", lessonId: "SMM-01", version: 1, competencies: [],
    questions: [{ id: "q", type: "magic", chapterIds: ["c"], competencyIds: [], prompt: "?", explanation: "!" }]
  }), null);
  assert.equal(validateAssessment({
    id: "x", lessonId: "SMM-01", version: 1, competencies: [],
    questions: [{ id: "q", type: "open", chapterIds: ["c"], competencyIds: [], prompt: "?", explanation: "!" }]
  }), null);
});

test("SMM-01 assessment covers every published chapter", () => {
  const lesson = JSON.parse(fs.readFileSync(new URL("../data/lessons/SMM-01.json", import.meta.url)));
  const raw = JSON.parse(fs.readFileSync(new URL("../data/assessments/SMM-01.json", import.meta.url)));
  const assessment = validateAssessment(raw);
  assert.ok(assessment);
  const covered = new Set(assessment.questions.flatMap(question => question.chapterIds));
  assert.deepEqual(lesson.chapters.map(chapter => chapter.id).filter(id => !covered.has(id)), []);
});
