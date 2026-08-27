import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = JSON.parse(await readFile(new URL("../data/lessons/SMM-01.json", import.meta.url), "utf8"));

test("each macro chapter contains guided practice retrieval transfer and synthesis", () => {
  for (const chapter of model.chapters) {
    const types = chapter.sections.flatMap(section => section.blocks.map(block => block.type));
    assert.ok(types.includes("guided-example"), `${chapter.id}: guided-example`);
    assert.ok(types.includes("micro-question"), `${chapter.id}: micro-question`);
    assert.ok(types.includes("application"), `${chapter.id}: application`);
    assert.ok(types.includes("retrieval-synthesis"), `${chapter.id}: retrieval-synthesis`);
    assert.ok(chapter.exercise?.requiredToComplete, `${chapter.id}: exercise`);
  }
});

test("important explanatory sections go beyond a definition", () => {
  for (const chapter of model.chapters) {
    for (const section of chapter.sections) {
      const prose = section.blocks
        .filter(block => ["paragraph", "guided-example", "counterexample", "application"].includes(block.type))
        .map(block => block.text ?? "")
        .join(" ");
      assert.ok(prose.length >= 240, `${chapter.id}/${section.id} is too shallow (${prose.length})`);
    }
  }
});

test("lesson remains in editorial review during the deep rewrite", () => {
  assert.equal(model.editorial.status, "review");
});

test("lesson places all six explanatory visualizations beside relevant concepts", () => {
  const ids = model.chapters.flatMap(chapter => chapter.sections)
    .flatMap(section => section.blocks)
    .filter(block => block.type === "visualization")
    .map(block => block.visualizationId);
  assert.deepEqual(ids, [
    "reach-impressions",
    "watch-time-average",
    "retention-curve",
    "correlation-causality",
    "test-builder",
    "report-builder"
  ]);
});
