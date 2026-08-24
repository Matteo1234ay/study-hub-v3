import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchIndex, searchStudyIndex } from "../src/study/search-index.js";

const catalog = [{ id: "smm", title: "Social", lessons: [{ id: "SMM-01", title: "Metriche e KPI" }] }];
const documents = new Map([["SMM-01", { chapters: [
  { id: "metrica-kpi", title: "Métrica e KPI", blocks: [{ type: "paragraph", text: "Definizione operativa" }] },
  { id: "esempio", title: "Applicazione", blocks: [{ type: "paragraph", text: "Una metrica nel testo" }] }
] }]]);

test("finds accents-insensitively and ranks titles first", () => {
  const results = searchStudyIndex(buildSearchIndex(catalog, documents), "metrica");
  assert.equal(results[0].chapterId, "metrica-kpi");
  assert.equal(results.length, 2);
});

test("returns no results for short or missing queries", () => {
  const index = buildSearchIndex(catalog, documents);
  assert.deepEqual(searchStudyIndex(index, ""), []);
  assert.deepEqual(searchStudyIndex(index, "inesistente"), []);
});
