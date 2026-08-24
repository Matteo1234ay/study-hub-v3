import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute } from "../src/router.js";

test("parses home and paths routes", () => {
  assert.deepEqual(parseRoute("#/home"), { name: "home", params: {} });
  assert.deepEqual(parseRoute("#/paths/smm"), {
    name: "path",
    params: { pathId: "smm" }
  });
});

test("parses lesson and chapter routes", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01"), {
    name: "lesson",
    params: { lessonId: "SMM-01" }
  });
  assert.deepEqual(parseRoute("#/lessons/SMM-01/retention"), {
    name: "chapter",
    params: { lessonId: "SMM-01", chapterId: "retention" }
  });
});

test("unknown routes become not-found", () => {
  assert.deepEqual(parseRoute("#/nonsense"), {
    name: "not-found",
    params: {}
  });
});
