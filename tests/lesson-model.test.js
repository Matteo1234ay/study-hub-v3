import test from "node:test";
import assert from "node:assert/strict";
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
