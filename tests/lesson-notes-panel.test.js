import test from "node:test";
import assert from "node:assert/strict";
import { notesForScope, noteContextLabel } from "../src/ui/lesson-notes-panel.js";

const notes = [
  { id: "a", chapterId: "c1", sectionId: "s1", text: "Sezione" },
  { id: "b", chapterId: "c1", sectionId: "s2", text: "Capitolo" },
  { id: "c", chapterId: "c2", sectionId: "s3", text: "Lezione" }
];

test("filters notes by section chapter or whole lesson", () => {
  assert.deepEqual(notesForScope(notes, "section", { chapterId: "c1", sectionId: "s1" }).map(note => note.id), ["a"]);
  assert.deepEqual(notesForScope(notes, "chapter", { chapterId: "c1", sectionId: "s1" }).map(note => note.id), ["a", "b"]);
  assert.deepEqual(notesForScope(notes, "lesson", { chapterId: "c1", sectionId: "s1" }).map(note => note.id), ["a", "b", "c"]);
});

test("describes the note context in plain Italian", () => {
  assert.equal(noteContextLabel({ chapterTitle: "Leggere i dati", sectionTitle: "CTR" }), "Leggere i dati · CTR");
  assert.equal(noteContextLabel({ chapterTitle: "Leggere i dati" }), "Leggere i dati");
});
