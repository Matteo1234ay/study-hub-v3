import test from "node:test";
import assert from "node:assert/strict";
import { assessmentReviewDestination, buildAssessmentReviewPackage } from "../src/assessment/review-package.js";

const assessment = { lessonId: "SMM-01", questions: [
  { id: "q1", prompt: "Che cos'è un KPI?", explanation: "È legato all'obiettivo.", modelAnswer: "Una metrica scelta per l'obiettivo.", requiredConcepts: [{ id: "objective", label: "legame con l'obiettivo", terms: ["obiettivo"] }] },
  { id: "q2", prompt: "Seconda?", explanation: "Due", correct: true }
] };
const attempt = { answers: { q1: "La mia risposta", q2: "q2 answer" }, result: { questions: { q1: { status: "partial", matchedConcepts: [], missingConcepts: ["objective"] }, q2: { status: "correct" } } }, privateNote: "nota privata", history: "cronologia" };

test("includes only selected answers and excludes private study data", () => {
  const text = buildAssessmentReviewPackage({ assessment, attempt, questionIds: ["q1"] });
  assert.match(text, /Domanda: Che cos'è un KPI/);
  assert.match(text, /Risposta dello studente: La mia risposta/);
  assert.doesNotMatch(text, /nota privata|cronologia|q2 answer/);
});

test("rejects unknown question identifiers", () => {
  assert.throws(() => buildAssessmentReviewPackage({ assessment, attempt, questionIds: ["missing"] }));
});

test("uses ChatGPT home without putting responses in the URL", () => {
  assert.equal(assessmentReviewDestination(), "https://chatgpt.com/");
});
