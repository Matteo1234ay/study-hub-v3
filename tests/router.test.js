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

test("ignores query parameters used by authorization actions", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01?authorize=1"), {
    name: "lesson",
    params: { lessonId: "SMM-01" }
  });
});

test("parses the optional full lesson view", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01?view=full"), {
    name: "lesson",
    params: { lessonId: "SMM-01", view: "full" }
  });
  assert.deepEqual(parseRoute("#/lessons/SMM-01/retention?view=full"), {
    name: "chapter",
    params: { lessonId: "SMM-01", chapterId: "retention", view: "full" }
  });
});

test("parses search and review routes", () => {
  assert.deepEqual(parseRoute("#/search?q=retention"), { name: "search", params: { query: "retention" } });
  assert.deepEqual(parseRoute("#/review"), { name: "review", params: {} });
});
