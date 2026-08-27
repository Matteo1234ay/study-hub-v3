import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isStudentVisibleLesson, normalizeLessonExperience } from "../src/lessons/lesson-model.js";

test("normalizes a legacy lesson without changing chapters", () => {
  const chapters = [{ id: "one", title: "Uno", blocks: [] }];
  const normalized = normalizeLessonExperience({ title: "Legacy", chapters });
  assert.equal(normalized.editorial.status, "published");
  assert.deepEqual(normalized.chapters, chapters);
  assert.deepEqual(normalized.sources, []);
});

test("keeps draft and review lessons out of the student catalog", () => {
  assert.equal(isStudentVisibleLesson({ editorial: { status: "draft" } }), false);
  assert.equal(isStudentVisibleLesson({ editorial: { status: "review" } }), false);
  assert.equal(isStudentVisibleLesson({ editorial: { status: "published" } }), true);
  assert.equal(isStudentVisibleLesson({}), true);
});

test("SMM-01 exposes exactly four macro chapters with unique sections", async () => {
  const raw = JSON.parse(await readFile(new URL("../data/lessons/SMM-01.json", import.meta.url), "utf8"));
  const normalized = normalizeLessonExperience(raw);

  assert.equal(normalized.chapters.length, 4);
  assert.deepEqual(normalized.chapters.map(chapter => chapter.id), [
    "misurare-cio-che-conta",
    "leggere-dati-piattaforme",
    "interpretare-senza-ingannarsi",
    "trasformare-dati-decisioni"
  ]);
  for (const chapter of normalized.chapters) {
    assert.ok(chapter.objective);
    assert.ok(chapter.estimated);
    assert.ok(chapter.sections.length >= 4);
    assert.equal(new Set(chapter.sections.map(section => section.id)).size, chapter.sections.length);
    assert.ok(chapter.sections.every(section => Array.isArray(section.blocks)));
  }
});

test("normalizes malformed optional macro chapter collections safely", () => {
  const normalized = normalizeLessonExperience({
    chapters: [{ id: "macro", title: "Macro", sections: null, legacyChapterIds: null }]
  });

  assert.deepEqual(normalized.chapters[0].sections, []);
  assert.deepEqual(normalized.chapters[0].legacyChapterIds, []);
});
