import test from "node:test";
import assert from "node:assert/strict";
import { chapterCompletionEligibility } from "../src/lessons/chapter-activity.js";

const chapter = { essentialSectionIds: ["one", "two"] };

test("viewing essential sections alone does not complete a macro chapter", () => {
  assert.equal(chapterCompletionEligibility(chapter, {
    visitedSections: ["one", "two"], exerciseAttempted: false
  }), false);
});

test("essential sections plus an attempted application permit completion", () => {
  assert.equal(chapterCompletionEligibility(chapter, {
    visitedSections: ["one", "two"], exerciseAttempted: true
  }), true);
});

test("missing essential sections prevent completion without blocking navigation", () => {
  assert.equal(chapterCompletionEligibility(chapter, {
    visitedSections: ["one"], exerciseAttempted: true
  }), false);
});
