import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAnswer, scoreOpenAnswer } from "../src/assessment/open-answer.js";

const question = {
  requiredConcepts: [
    { id: "objective", label: "obiettivo", terms: ["obiettivo", "goal"] },
    { id: "test", label: "test comparabile", terms: ["test comparabile", "confronto controllato"] }
  ],
  partialThreshold: 0.5
};

test("normalizes accents case and punctuation", () => {
  assert.equal(normalizeAnswer("È legato all’OBIETTIVO!"), "e legato all obiettivo");
});

test("scores full partial and missing concept coverage", () => {
  assert.equal(scoreOpenAnswer(question, "Obiettivo e test comparabile").status, "correct");
  assert.equal(scoreOpenAnswer(question, "Serve un goal").status, "partial");
  assert.equal(scoreOpenAnswer(question, "Non lo so").status, "review");
});

test("an empty response is explicitly unanswered", () => {
  assert.deepEqual(scoreOpenAnswer(question, ""), { score: 0, status: "unanswered", matchedConcepts: [], missingConcepts: ["objective", "test"] });
});
