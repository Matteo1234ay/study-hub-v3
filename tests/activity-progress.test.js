import test from "node:test";
import assert from "node:assert/strict";
import { chapterActivityState, isChapterActivityComplete } from "../src/progress/activity-progress.js";

const chapter = {
  id: "cap-1",
  sections: [
    { id: "s1", blocks: [{ type: "micro-question", id: "q1" }] },
    { id: "s2", blocks: [{ type: "paragraph", text: "testo" }, { type: "micro-question", id: "q2" }] }
  ]
};

test("chapter completion requires reading all sections and answering its micro-questions", () => {
  assert.equal(isChapterActivityComplete(chapter, { visitedSections: ["s1", "s2"], answeredQuestions: ["q1"] }), false);
  assert.equal(isChapterActivityComplete(chapter, { visitedSections: ["s1", "s2"], answeredQuestions: ["q1", "q2"] }), true);
});

test("activity state reports useful counts", () => {
  assert.deepEqual(chapterActivityState(chapter, { visitedSections: ["s1"], answeredQuestions: ["q1"] }), {
    sectionsDone: 1, sectionsTotal: 2, questionsDone: 1, questionsTotal: 2, complete: false
  });
});
