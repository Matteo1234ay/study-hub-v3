import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parsePublishedDocument, shouldProtectEditorialLesson } from "../scripts/sync-published-doc.mjs";

const html = await readFile(new URL("./fixtures/published-smm-01.html", import.meta.url), "utf8");

test("turns published Google Docs HTML into chapters", () => {
  const lesson = parsePublishedDocument(html);
  assert.equal(lesson.title, "SMM-01 – Metriche e KPI organici");
  assert.deepEqual(lesson.chapters.map((chapter) => chapter.title), [
    "Obiettivo del modulo",
    "1. Metrica, KPI e obiettivo: tre cose diverse",
    "2. Reach, impression e views: non sono sinonimi",
    "3. Watch time e durata media",
    "Criterio di completamento SMM-01"
  ]);
});

test("keeps restarted numbered lists inside their current chapter", () => {
  const lesson = parsePublishedDocument(html);
  assert.equal(lesson.chapters.some((chapter) => chapter.title.startsWith("1. Una domanda interna")), false);
  assert.equal(lesson.chapters[2].blocks.at(-1).text, "1. Una domanda interna non è un nuovo capitolo.");
});

test("recognizes semantic prose and visible bullet lists", () => {
  const lesson = parsePublishedDocument(html);
  const firstChapter = lesson.chapters[1];
  assert.equal(firstChapter.blocks[1].type, "example");
  assert.equal(firstChapter.blocks[2].type, "key-concept");
  assert.deepEqual(lesson.chapters[2].blocks[0], {
    type: "list",
    ordered: false,
    items: ["Reach: persone uniche.", "Impression: esposizioni registrate."]
  });
});

test("does not include Google style or script content", () => {
  const lesson = parsePublishedDocument(`<html><head><style>.x{color:red}</style><script>bad()</script></head><body><p>Titolo</p><p>1. Capitolo</p><p>Testo sicuro</p></body></html>`);
  assert.equal(JSON.stringify(lesson).includes("color:red"), false);
  assert.equal(JSON.stringify(lesson).includes("bad()"), false);
});

test("protects reviewed or structured lessons from flat document overwrite", () => {
  assert.equal(shouldProtectEditorialLesson({ editorial: { status: "review" }, chapters: [] }), true);
  assert.equal(shouldProtectEditorialLesson({ editorial: { status: "published" }, chapters: [] }), true);
  assert.equal(shouldProtectEditorialLesson({ chapters: [{ sections: [] }] }), true);
  assert.equal(shouldProtectEditorialLesson({ chapters: [{ blocks: [] }] }), false);
});
