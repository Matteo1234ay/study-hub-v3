import test from "node:test";
import assert from "node:assert/strict";
import { createNotesStore } from "../src/study/notes-store.js";
import { createPreferencesStore } from "../src/study/preferences.js";

function memoryStorage() {
  const values = new Map();
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
}

test("keeps notes separate by lesson and chapter", () => {
  const store = createNotesStore(memoryStorage());
  store.set("SMM-01", "reach", "Nota reach");
  assert.equal(store.get("SMM-01", "reach"), "Nota reach");
  assert.equal(store.get("SMM-01", "retention"), "");
  store.remove("SMM-01", "reach");
  assert.equal(store.get("SMM-01", "reach"), "");
});

test("accepts only controlled reading preferences", () => {
  const store = createPreferencesStore(memoryStorage());
  assert.deepEqual(store.update({ fontSize: "large", width: "narrow", focus: true, unsafe: "x" }), {
    fontSize: "large", width: "narrow", focus: true
  });
});

test("applies preferences through controlled data attributes", () => {
  const store = createPreferencesStore(memoryStorage());
  store.update({ fontSize: "small", width: "narrow", focus: true });
  const attributes = {};
  store.applyTo({ setAttribute: (key, value) => { attributes[key] = value; } });
  assert.deepEqual(attributes, { "data-font-size": "small", "data-reading-width": "narrow", "data-focus-mode": "true" });
});
