import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute } from "../src/router.js";

test("parses full module assessment", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01/assessment"), { name: "assessment", params: { lessonId: "SMM-01" } });
});

test("parses chapter assessment", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01/assessment/chapter-one"), { name: "chapter-assessment", params: { lessonId: "SMM-01", chapterId: "chapter-one" } });
});
