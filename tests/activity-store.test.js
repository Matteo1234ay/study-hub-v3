import test from "node:test";
import assert from "node:assert/strict";
import { createActivityStore } from "../src/progress/activity-store.js";

function memoryStorage() { const m = new Map(); return { getItem:k=>m.get(k)??null, setItem:(k,v)=>m.set(k,String(v)) }; }

test("activity store persists visited sections and answered questions without duplicates", () => {
  const store = createActivityStore(memoryStorage());
  store.visitSection("SMM-01", "cap-1", "s1"); store.visitSection("SMM-01", "cap-1", "s1");
  store.answerQuestion("SMM-01", "cap-1", "q1");
  assert.deepEqual(store.getChapter("SMM-01", "cap-1"), { visitedSections: ["s1"], answeredQuestions: ["q1"] });
});
