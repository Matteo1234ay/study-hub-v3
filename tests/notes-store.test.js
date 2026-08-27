import test from "node:test";
import assert from "node:assert/strict";
import { createNotesStore } from "../src/study/notes-store.js";

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

test("stores filters updates and removes structured notes", () => {
  const store = createNotesStore(memoryStorage(), () => 1000, () => "note-1");
  const created = store.upsert({ lessonId: "SMM-01", chapterId: "macro-1", sectionId: "section-a", text: "Prima nota" });
  assert.equal(created.id, "note-1");
  assert.equal(store.list({ lessonId: "SMM-01", chapterId: "macro-1" }).length, 1);
  store.upsert({ ...created, text: "Nota modificata" });
  assert.equal(store.search("modificata", { lessonId: "SMM-01" })[0].text, "Nota modificata");
  store.remove("SMM-01", created.id);
  assert.deepEqual(store.list({ lessonId: "SMM-01" }), []);
});

test("reads legacy chapter notes without deleting their original keys", () => {
  const storage = memoryStorage();
  storage.setItem("study-hub-v3:note:SMM-01:2-reach-impression-e-views-non-sono-sinonimi", "Vecchia nota");
  const store = createNotesStore(storage, () => 1000, () => "unused");

  const notes = store.list({ lessonId: "SMM-01", chapterId: "leggere-dati-piattaforme" });

  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, "Vecchia nota");
  assert.equal(notes[0].legacy, true);
  assert.equal(storage.getItem("study-hub-v3:note:SMM-01:2-reach-impression-e-views-non-sono-sinonimi"), "Vecchia nota");
});

test("ignores malformed v2 entries but keeps valid notes", () => {
  const storage = memoryStorage();
  storage.setItem("study-hub-v3:notes:v2:SMM-01", JSON.stringify({
    version: 2,
    notes: [
      { id: "ok", lessonId: "SMM-01", chapterId: "macro", text: "Valida", createdAt: 1, updatedAt: 1 },
      { id: "bad", text: "" }
    ]
  }));
  assert.deepEqual(createNotesStore(storage).list({ lessonId: "SMM-01" }).map(note => note.id), ["ok"]);
});
