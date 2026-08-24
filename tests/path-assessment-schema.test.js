import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validatePathAssessment, includeConfiguredLessons } from "../src/path-assessment/path-schema.js";

test("accepts the in-progress SMM manifest", () => {
  const raw = JSON.parse(fs.readFileSync(new URL("../data/path-assessments/smm.json", import.meta.url)));
  const manifest = validatePathAssessment(raw);
  assert.equal(manifest.pathId, "smm");
  assert.equal(manifest.status, "in-progress");
  assert.equal(manifest.selection.minQuestions, 10);
});

test("rejects unknown status duplicate lessons and invalid bounds", () => {
  const base = { id: "x", pathId: "smm", version: 1, status: "in-progress", lessons: [{ lessonId: "SMM-01", assessmentUrl: "x" }], competencies: [{ id: "k", label: "K", weight: 1, mandatory: true }], selection: { minQuestions: 1, maxQuestions: 2 }, thresholds: { progressive: { solid: 85, good: 70, partial: 55 }, final: { pass: 75, mandatoryMin: 60 } } };
  assert.equal(validatePathAssessment({ ...base, status: "maybe" }), null);
  assert.equal(validatePathAssessment({ ...base, lessons: [...base.lessons, base.lessons[0]] }), null);
  assert.equal(validatePathAssessment({ ...base, selection: { minQuestions: 3, maxQuestions: 2 } }), null);
});

test("complete manifest requires a mandatory competency", () => {
  const raw = JSON.parse(fs.readFileSync(new URL("../data/path-assessments/smm.json", import.meta.url)));
  assert.equal(validatePathAssessment({ ...raw, status: "complete", competencies: raw.competencies.map(item => ({ ...item, mandatory: false })) }), null);
});

test("automatically includes every configured lesson with an assessment", () => {
  const raw = JSON.parse(fs.readFileSync(new URL("../data/path-assessments/smm.json", import.meta.url)));
  const updated = includeConfiguredLessons(raw, [
    { id: "SMM-01", assessmentUrl: "data/assessments/SMM-01.json" },
    { id: "SMM-02", assessmentUrl: "data/assessments/SMM-02.json" },
    { id: "SMM-03" }
  ]);
  assert.deepEqual(updated.lessons, [
    { lessonId: "SMM-01", assessmentUrl: "data/assessments/SMM-01.json" },
    { lessonId: "SMM-02", assessmentUrl: "data/assessments/SMM-02.json" }
  ]);
});
