import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildLesson } from "../src/lessons/build-lesson.js";

const fixture = JSON.parse(await readFile(new URL("./fixtures/smm-01-doc.json", import.meta.url)));

test("builds a lesson with semantic chapter blocks", () => {
  const lesson = buildLesson(fixture);
  assert.equal(lesson.title, "SMM-01 – Metriche e KPI organici");
  assert.equal(lesson.chapters.length, 3);
  assert.deepEqual(lesson.chapters.map((chapter) => chapter.id), ["metrica-kpi-e-obiettivo", "retention", "retention-2"]);
  assert.equal(lesson.chapters[0].blocks[1].type, "key-concept");
  assert.equal(lesson.chapters[1].blocks[0].type, "formula");
  assert.equal(lesson.chapters[1].blocks[1].type, "error");
});

test("creates an introduction only when content precedes the first chapter", () => {
  const doc = { body: { content: [
    { paragraph: { elements: [{ textRun: { content: "Una premessa.\n" } }] } },
    { paragraph: { paragraphStyle: { namedStyleType: "HEADING_1" }, elements: [{ textRun: { content: "Capitolo\n" } }] } }
  ] } };
  assert.equal(buildLesson(doc).chapters[0].title, "Introduzione");
});
