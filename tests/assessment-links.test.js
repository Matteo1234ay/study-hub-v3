import test from "node:test";
import assert from "node:assert/strict";
import { assessmentHref } from "../src/lessons/render-lesson.js";

test("creates module and chapter assessment links", () => {
  assert.equal(assessmentHref("SMM-01"), "#/lessons/SMM-01/assessment");
  assert.equal(assessmentHref("SMM-01", "chapter-one"), "#/lessons/SMM-01/assessment/chapter-one");
});
