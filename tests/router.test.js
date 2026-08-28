import test from "node:test";
import assert from "node:assert/strict";
import { navigateToHash, parseRoute } from "../src/router.js";

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

test("parses a section target inside a macro chapter", () => {
  assert.deepEqual(parseRoute("#/lessons/SMM-01/leggere-dati-piattaforme?section=ctr-denominatori"), {
    name: "chapter",
    params: {
      lessonId: "SMM-01",
      chapterId: "leggere-dati-piattaforme",
      sectionId: "ctr-denominatori"
    }
  });
});

test("parses search and review routes", () => {
  assert.deepEqual(parseRoute("#/search?q=retention"), { name: "search", params: { query: "retention" } });
  assert.deepEqual(parseRoute("#/review"), { name: "review", params: {} });
});

test("programmatic navigation accepts only internal Study Hub hashes", () => {
  const previous = globalThis.location;
  globalThis.location = { hash: "#/home" };
  try {
    assert.equal(navigateToHash("#/progress"), true);
    assert.equal(globalThis.location.hash, "/progress");
    assert.equal(navigateToHash("https://example.com"), false);
    assert.equal(globalThis.location.hash, "/progress");
  } finally {
    globalThis.location = previous;
  }
});
