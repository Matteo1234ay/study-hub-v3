import test from "node:test";
import assert from "node:assert/strict";
import { buildNotesExportModel, createNotesPlainText, exportNotes } from "../src/study/notes-export.js";

const lesson = {
  title: "Metriche e KPI",
  chapters: [{ id: "c1", title: "Capitolo uno", sections: [{ id: "s1", title: "Sezione uno" }] }]
};
const notes = [{ id: "n1", chapterId: "c1", sectionId: "s1", text: "Controllare il denominatore", conceptId: "CTR" }];

test("groups exported notes by chapter and section", () => {
  const model = buildNotesExportModel(lesson, notes, new Date("2026-08-27T00:00:00Z"));
  assert.equal(model.chapters[0].sections[0].notes[0].text, "Controllare il denominatore");
  assert.equal(model.date, "27/08/2026");
});

test("plain text fallback contains structure and note content", () => {
  const text = createNotesPlainText(buildNotesExportModel(lesson, notes, new Date("2026-08-27T00:00:00Z")));
  assert.match(text, /Capitolo uno/);
  assert.match(text, /Sezione uno/);
  assert.match(text, /Controllare il denominatore/);
});

test("falls back to copied plain text when DOCX saving fails", async () => {
  let copied = "";
  const result = await exportNotes({
    lesson,
    notes,
    date: new Date("2026-08-27T00:00:00Z"),
    saveFile: async () => { throw new Error("download blocked"); },
    copyText: async text => { copied = text; }
  });
  assert.equal(result.method, "clipboard");
  assert.match(copied, /Controllare il denominatore/);
});
