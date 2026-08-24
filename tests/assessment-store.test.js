import test from "node:test";
import assert from "node:assert/strict";
import { createAssessmentStore } from "../src/assessment/assessment-store.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}

test("keeps drafts separate by lesson and version", () => {
  const store = createAssessmentStore(memoryStorage());
  store.saveDraft("SMM-01", 1, { q1: "a" });
  assert.deepEqual(store.getDraft("SMM-01", 1).answers, { q1: "a" });
  assert.equal(store.getDraft("SMM-01", 2), null);
  store.clearDraft("SMM-01", 1);
  assert.equal(store.getDraft("SMM-01", 1), null);
});

test("keeps the newest 100 attempts per lesson", () => {
  const store = createAssessmentStore(memoryStorage(), () => "2026-08-24T00:00:00.000Z");
  for (let index = 0; index < 105; index += 1) store.recordAttempt({ id: String(index), lessonId: "SMM-01", version: 1, answers: {}, result: { questions: {} } });
  const attempts = store.getAttempts("SMM-01");
  assert.equal(attempts.length, 100);
  assert.equal(attempts[0].id, "5");
  assert.equal(attempts[99].id, "104");
});

test("recovers from malformed local assessment data", () => {
  const storage = memoryStorage({ "study-hub-v3:assessment:attempts": "broken" });
  assert.deepEqual(createAssessmentStore(storage).getAttempts("SMM-01"), []);
});
