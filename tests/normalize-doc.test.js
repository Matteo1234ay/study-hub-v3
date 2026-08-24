import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { normalizeDocument } from "../src/lessons/normalize-doc.js";

const fixture = JSON.parse(await readFile(new URL("./fixtures/smm-01-doc.json", import.meta.url)));

test("normalizes text and native heading styles", () => {
  const blocks = normalizeDocument(fixture);
  assert.deepEqual(blocks[0], { kind: "title", text: "SMM-01 – Metriche e KPI organici" });
  assert.deepEqual(blocks[1], { kind: "heading-1", text: "Metrica, KPI e obiettivo" });
  assert.equal(blocks[2].text, "Una metrica è una misura quantitativa.");
});

test("groups adjacent bullet paragraphs from the same list", () => {
  const blocks = normalizeDocument(fixture);
  assert.deepEqual(blocks.at(-1), {
    kind: "list",
    ordered: false,
    items: ["Dichiara il denominatore", "Confronta periodi equivalenti"]
  });
});

test("ignores empty structural paragraphs", () => {
  const doc = { body: { content: [{ paragraph: { elements: [{ textRun: { content: "\n" } }] } }] } };
  assert.deepEqual(normalizeDocument(doc), []);
});
