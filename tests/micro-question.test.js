import test from "node:test";
import assert from "node:assert/strict";
import { evaluateMicroQuestion, validateMicroQuestion } from "../src/lessons/micro-question.js";

const question = {
  type: "micro-question",
  id: "kpi-choice",
  concept: "Scelta KPI",
  prompt: "Quale dato risponde meglio all’obiettivo?",
  options: [
    { id: "views", text: "Views", correct: false, feedback: "Le views descrivono il consumo, non questa conversione." },
    { id: "conversion", text: "Conversione", correct: true, feedback: "Esatto: misura direttamente l’azione richiesta." }
  ],
  retryPrompt: "Quale metrica è più vicina all’azione finale?",
  retryOptions: [
    { id: "reach", text: "Reach", correct: false, feedback: "La reach misura esposizione." },
    { id: "conversion", text: "Conversione", correct: true, feedback: "Esatto: è l’esito coerente." }
  ]
};

test("validates complete questions and rejects incomplete ones", () => {
  assert.equal(validateMicroQuestion(question), true);
  assert.equal(validateMicroQuestion({ type: "micro-question", id: "broken" }), false);
});

test("wrong first attempt returns explanatory feedback and a retry", () => {
  const result = evaluateMicroQuestion(question, "views", 1);
  assert.equal(result.correct, false);
  assert.equal(result.canRetry, true);
  assert.equal(result.feedback, question.options[0].feedback);
});

test("a correct answer consolidates the concept", () => {
  assert.deepEqual(evaluateMicroQuestion(question, "conversion", 1), {
    correct: true,
    canRetry: false,
    feedback: question.options[1].feedback
  });
});

test("invalid options fail safely", () => {
  assert.deepEqual(evaluateMicroQuestion(question, "missing", 1), {
    correct: false, canRetry: false, feedback: "Seleziona una risposta prima di continuare."
  });
});
