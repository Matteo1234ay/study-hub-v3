import test from "node:test";
import assert from "node:assert/strict";
import { createLessonCache } from "../src/lessons/lesson-cache.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test("stores lesson documents without authentication data", () => {
  const storage = memoryStorage();
  const cache = createLessonCache(storage, () => 123456);
  cache.set("SMM-01", { title: "Lezione" }, "rev-1");
  assert.deepEqual(cache.get("SMM-01"), {
    document: { title: "Lezione" },
    revision: "rev-1",
    cachedAt: 123456
  });
});

test("returns null for invalid cache data", () => {
  const storage = memoryStorage();
  storage.setItem("study-hub-v3:lesson:SMM-01", "not-json");
  assert.equal(createLessonCache(storage).get("SMM-01"), null);
});

test("can clear one cached lesson", () => {
  const storage = memoryStorage();
  const cache = createLessonCache(storage);
  cache.set("SMM-01", { title: "Lezione" }, null);
  cache.clear("SMM-01");
  assert.equal(cache.get("SMM-01"), null);
});
