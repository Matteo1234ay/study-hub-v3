import test from "node:test";
import assert from "node:assert/strict";
import { createNote, normalizeNote } from "../src/study/note-model.js";

test("creates a contextual note with stable timestamps", () => {
  const note = createNote({
    lessonId: "SMM-01",
    chapterId: "leggere-dati-piattaforme",
    sectionId: "ctr-stesso-nome-contesti-diversi",
    text: "Controllare sempre il denominatore",
    conceptId: "denominatore"
  }, () => 1000, () => "note-1");

  assert.deepEqual(note, {
    id: "note-1",
    lessonId: "SMM-01",
    chapterId: "leggere-dati-piattaforme",
    sectionId: "ctr-stesso-nome-contesti-diversi",
    text: "Controllare sempre il denominatore",
    conceptId: "denominatore",
    sourceId: null,
    blockId: null,
    createdAt: 1000,
    updatedAt: 1000
  });
});

test("rejects malformed or empty stored notes", () => {
  assert.equal(normalizeNote(null), null);
  assert.equal(normalizeNote({ id: "x", lessonId: "SMM-01", text: "" }), null);
  assert.equal(normalizeNote({ id: "x", lessonId: "SMM-01", chapterId: "c", text: "Valida", createdAt: 1, updatedAt: 2 }).text, "Valida");
});
