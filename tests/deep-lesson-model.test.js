import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLessonExperience, resolveLessonLocation } from "../src/lessons/lesson-model.js";

test("legacy chapters normalize into sections without losing blocks", () => {
  const model = normalizeLessonExperience({ chapters: [{ id: "old", title: "Old", blocks: [{ type: "paragraph", text: "x" }] }] });
  assert.equal(model.chapters[0].sections.length, 1);
  assert.equal(model.chapters[0].sections[0].blocks[0].text, "x");
});

test("new macro chapters preserve explicit sections", () => {
  const model = normalizeLessonExperience({ chapters: [{ id: "macro", title: "Macro", sections: [{ id: "s1", title: "S1", blocks: [] }] }] });
  assert.equal(model.chapters[0].sections[0].id, "s1");
});

test("old identifiers resolve through compatibility map", () => {
  const model = { chapters: [{ id: "macro", title: "Macro", sections: [{ id: "new", title: "New", blocks: [] }] }], legacyMap: { old: { chapterId: "macro", sectionId: "new" } } };
  assert.deepEqual(resolveLessonLocation(model, "old"), { chapterId: "macro", sectionId: "new", legacy: true });
});
