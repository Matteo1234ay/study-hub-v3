import test from "node:test";
import assert from "node:assert/strict";
import { createReviewConceptsStore } from "../src/study/review-concepts-store.js";

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("stores one stable review record per lesson and concept", () => {
  const store = createReviewConceptsStore(memoryStorage());
  store.markForReview("SMM-01", { id: "kpi-choice", concept: "Scelta KPI", chapterId: "one" });
  store.markForReview("SMM-01", { id: "kpi-choice", concept: "Scelta KPI", chapterId: "one" });
  assert.equal(store.list().length, 1);
  assert.equal(store.list()[0].concept, "Scelta KPI");
});

test("clears a consolidated concept and recovers from malformed data", () => {
  const storage = memoryStorage();
  storage.setItem("study-hub-v3:review-concepts", "broken");
  const store = createReviewConceptsStore(storage);
  assert.deepEqual(store.list(), []);
  store.markForReview("SMM-01", { id: "kpi-choice", concept: "Scelta KPI" });
  store.clear("SMM-01", "kpi-choice");
  assert.deepEqual(store.list(), []);
});
