import test from "node:test";
import assert from "node:assert/strict";
import { buildNotesDocxParts } from "../src/study/docx-export.js";

test("notes DOCX export builds the required OOXML package parts", () => {
  const parts = buildNotesDocxParts({
    title: "Lezione & note",
    exportedAt: "27/08/2026, 16:30",
    notes: [{ chapterId: "cap-1", sectionId: "sec-1", text: "CTR < reach & impression" }]
  });
  assert.deepEqual(Object.keys(parts).sort(), ["[Content_Types].xml", "_rels/.rels", "word/document.xml"]);
  assert.match(parts["word/document.xml"], /Lezione &amp; note/);
  assert.match(parts["word/document.xml"], /CTR &lt; reach &amp; impression/);
  assert.match(parts["word/document.xml"], /cap-1 · sec-1/);
});
