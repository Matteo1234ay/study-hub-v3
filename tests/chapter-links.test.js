import test from "node:test";
import assert from "node:assert/strict";
import { blockPresentation, chapterHref, lessonHref, selectVisibleChapters } from "../src/lessons/render-lesson.js";

test("creates direct hash links to chapters", () => {
  assert.equal(chapterHref("SMM-01", "retention"), "#/lessons/SMM-01/retention");
});

test("maps semantic blocks to controlled presentation", () => {
  assert.deepEqual(blockPresentation({ type: "formula" }), { tag: "div", className: "lesson-callout callout-formula" });
  assert.deepEqual(blockPresentation({ type: "paragraph" }), { tag: "p", className: "lesson-paragraph" });
  assert.deepEqual(blockPresentation({ type: "subheading", level: 2 }), { tag: "h3", className: "lesson-subheading" });
});

test("unknown blocks fall back to a safe paragraph", () => {
  assert.deepEqual(blockPresentation({ type: "unknown" }), { tag: "p", className: "lesson-paragraph" });
});

test("creates stable chapter and full-view lesson links", () => {
  assert.equal(lessonHref("SMM-01", { view: "full" }), "#/lessons/SMM-01?view=full");
  assert.equal(lessonHref("SMM-01", { chapterId: "retention" }), "#/lessons/SMM-01/retention");
});

test("shows one chapter by default and every chapter in full view", () => {
  const model = { chapters: [{ id: "one" }, { id: "two" }] };
  assert.deepEqual(selectVisibleChapters(model, "two", "chapter").map(chapter => chapter.id), ["two"]);
  assert.deepEqual(selectVisibleChapters(model, null, "chapter").map(chapter => chapter.id), ["one"]);
  assert.deepEqual(selectVisibleChapters(model, null, "full").map(chapter => chapter.id), ["one", "two"]);
});
