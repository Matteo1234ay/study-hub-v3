import test from "node:test";
import assert from "node:assert/strict";
import { createStudyStore } from "../src/study/study-store.js";

function memoryStorage() {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
}

test("toggles favorites and bookmarks without duplicates", () => {
  const store = createStudyStore(memoryStorage(), () => 1000);
  store.toggleFavorite("SMM-01");
  store.toggleFavorite("SMM-01");
  store.toggleBookmark("SMM-01", "retention");
  assert.deepEqual(store.getState().favorites, []);
  assert.deepEqual(store.getState().bookmarks, { "SMM-01": ["retention"] });
});

test("stores last position and caps history at 500 newest events", () => {
  const store = createStudyStore(memoryStorage(), () => 1000);
  store.setLastPosition("SMM-01", "retention");
  for (let i = 0; i < 510; i += 1) store.recordVisit({ type: "chapter", id: String(i) });
  assert.deepEqual(store.getState().lastPosition, { lessonId: "SMM-01", chapterId: "retention", at: 1000 });
  assert.equal(store.getState().history.length, 500);
  assert.equal(store.getState().history.at(-1).id, "509");
  store.clearHistory();
  assert.deepEqual(store.getState().history, []);
});

test("recovers from malformed state", () => {
  const storage = memoryStorage();
  storage.setItem("study-hub-v3:study", "bad");
  assert.deepEqual(createStudyStore(storage).getState(), { favorites: [], bookmarks: {}, lastPosition: null, history: [] });
});
