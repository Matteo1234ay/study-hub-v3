import test from "node:test";
import assert from "node:assert/strict";
import { PATHS, findLesson, findPath, studentVisibleLessons } from "../src/config/paths.js";

test("catalog exposes exactly the four approved paths", () => {
  assert.deepEqual(PATHS.map((path) => path.id), ["smm", "ai", "design", "video"]);
});

test("only SMM-01 is initially available", () => {
  assert.deepEqual(PATHS.flatMap((path) => path.lessons).map((lesson) => lesson.id), ["SMM-01"]);
  assert.equal(findLesson("SMM-01")?.pathId, "smm");
});

test("unknown catalog entries return null", () => {
  assert.equal(findPath("missing"), null);
  assert.equal(findLesson("AI-01"), null);
});

test("student catalog hides explicit drafts but keeps legacy lessons", () => {
  assert.deepEqual(studentVisibleLessons([
    { id: "legacy" },
    { id: "draft", editorial: { status: "draft" } },
    { id: "published", editorial: { status: "published" } }
  ]).map(lesson => lesson.id), ["legacy", "published"]);
});
