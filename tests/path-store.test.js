import test from "node:test";
import assert from "node:assert/strict";
import { createPathAssessmentStore } from "../src/path-assessment/path-store.js";

function memoryStorage() { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,String(v)), removeItem: k => map.delete(k) }; }

test("preserves immutable selected questions while saving answers", () => {
  const store = createPathAssessmentStore(memoryStorage(), () => "now", () => 42);
  const session = store.createSession({ pathId: "smm", manifestVersion: 1, mode: "progressive", questionIds: ["a", "b"], coverage: { lessons: ["SMM-01"] } });
  store.saveAnswers(session.id, { a: "x" });
  assert.deepEqual(store.getSession(session.id).questionIds, ["a", "b"]);
  assert.deepEqual(store.getSession(session.id).answers, { a: "x" });
});

test("recovers from malformed data", () => {
  const storage = memoryStorage(); storage.setItem("study-hub-v3:path-assessment:sessions", "bad");
  assert.equal(createPathAssessmentStore(storage).getSession("missing"), null);
});
