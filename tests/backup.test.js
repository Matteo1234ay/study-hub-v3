import test from "node:test";
import assert from "node:assert/strict";
import { exportLocalData, importLocalData } from "../src/progress/backup.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    entries: () => Object.fromEntries(values)
  };
}

test("exports only Study Hub local data", () => {
  const storage = memoryStorage({
    "study-hub-v3:progress:SMM-01": '{"completed":["a"]}',
    "unrelated": "private"
  });
  assert.deepEqual(exportLocalData(storage, () => "2026-08-24T12:00:00.000Z"), {
    schemaVersion: 1,
    exportedAt: "2026-08-24T12:00:00.000Z",
    entries: { "study-hub-v3:progress:SMM-01": '{"completed":["a"]}' }
  });
});

test("imports validated namespaced entries and preserves unrelated data", () => {
  const storage = memoryStorage({ unrelated: "keep" });
  const result = importLocalData({
    schemaVersion: 1,
    exportedAt: "2026-08-24T12:00:00.000Z",
    entries: { "study-hub-v3:progress:SMM-01": '{"completed":["a"]}' }
  }, storage);
  assert.equal(result, 1);
  assert.equal(storage.entries().unrelated, "keep");
  assert.equal(storage.entries()["study-hub-v3:progress:SMM-01"], '{"completed":["a"]}');
});

test("rejects backups containing foreign keys", () => {
  assert.throws(() => importLocalData({ schemaVersion: 1, entries: { token: "secret" } }, memoryStorage()), /Backup non valido/);
});

test("exports study history notes and preferences", () => {
  const storage = memoryStorage({
    "study-hub-v3:study": '{"history":[]}',
    "study-hub-v3:note:SMM-01:reach": "nota",
    "study-hub-v3:preferences": '{"fontSize":"large"}'
  });
  assert.equal(Object.keys(exportLocalData(storage, () => "2026-08-24T12:00:00.000Z").entries).length, 3);
});

test("exports assessment drafts attempts and answers", () => {
  const storage = memoryStorage({
    "study-hub-v3:assessment:drafts": '{"SMM-01@1":{"answers":{"q1":"a"}}}',
    "study-hub-v3:assessment:attempts": '{"SMM-01":[{"answers":{"q1":"a"}}]}'
  });
  const entries = exportLocalData(storage, () => "2026-08-24T12:00:00.000Z").entries;
  assert.deepEqual(Object.keys(entries).sort(), ["study-hub-v3:assessment:attempts", "study-hub-v3:assessment:drafts"]);
});

test("exports progressive and final path assessment data", () => {
  const storage = memoryStorage({
    "study-hub-v3:path-assessment:sessions": '{"smm-1":{"answers":{"q1":"a"}}}',
    "study-hub-v3:path-assessment:attempts": '{"smm":[{"result":{"total":{"percent":80}}}]}'
  });
  const entries = exportLocalData(storage, () => "2026-08-24T12:00:00.000Z").entries;
  assert.deepEqual(Object.keys(entries).sort(), ["study-hub-v3:path-assessment:attempts", "study-hub-v3:path-assessment:sessions"]);
});
