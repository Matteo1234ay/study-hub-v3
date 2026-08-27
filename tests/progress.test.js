import test from "node:test";
import assert from "node:assert/strict";
import { calculateLessonProgress, calculateMacroProgress, createProgressStore } from "../src/progress/local-progress.js";

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

test("calculates chapter completion percentage", () => {
  const chapters = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  assert.equal(calculateLessonProgress(chapters, new Set(["a", "c"])), 50);
  assert.equal(calculateLessonProgress([], new Set()), 0);
});

test("toggles chapters without duplicates", () => {
  const store = createProgressStore(memoryStorage(), () => 1000);
  assert.deepEqual(store.toggle("SMM-01", "a"), {
    completed: ["a"], visited: [], activities: {}, legacyCompleted: [], updatedAt: 1000
  });
  assert.deepEqual(store.toggle("SMM-01", "a"), {
    completed: [], visited: [], activities: {}, legacyCompleted: [], updatedAt: 1000
  });
});

test("ignores malformed stored progress", () => {
  const storage = memoryStorage();
  storage.setItem("study-hub-v3:progress:SMM-01", "bad-json");
  assert.deepEqual(createProgressStore(storage).get("SMM-01"), {
    completed: [], visited: [], activities: {}, legacyCompleted: [], updatedAt: null
  });
});

test("macro progress counts completion but not a simple visit", () => {
  const chapters = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  assert.equal(calculateMacroProgress(chapters, { visited: ["a", "b"], completed: ["a"] }), 25);
});

test("records visits separately without changing legacy completion", () => {
  const storage = memoryStorage();
  const store = createProgressStore(storage, () => 1000);
  store.set("SMM-01", ["1-metrica-kpi-e-obiettivo-tre-cose-diverse"]);

  const state = store.visit("SMM-01", "misurare-cio-che-conta");

  assert.deepEqual(state.completed, ["1-metrica-kpi-e-obiettivo-tre-cose-diverse"]);
  assert.deepEqual(state.visited, ["misurare-cio-che-conta"]);
});
