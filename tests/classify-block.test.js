import test from "node:test";
import assert from "node:assert/strict";
import { classifyBlock } from "../src/lessons/classify-block.js";

test("classifies controlled semantic prefixes", () => {
  assert.equal(classifyBlock({ kind: "paragraph", text: "Esempio: Un caso" }).type, "example");
  assert.equal(classifyBlock({ kind: "paragraph", text: "ATTENZIONE: limite" }).type, "warning");
  assert.equal(classifyBlock({ kind: "paragraph", text: "Formula: x = y" }).type, "formula");
  assert.equal(classifyBlock({ kind: "paragraph", text: "Domanda diagnostica: perché?" }).type, "diagnostic-question");
});

test("recognizes natural editorial labels ending with a period", () => {
  assert.deepEqual(classifyBlock({ kind: "paragraph", text: "Esempio. Un caso reale." }), {
    type: "example",
    label: "Esempio",
    text: "Un caso reale."
  });
});

test("removes a recognized prefix but preserves its label", () => {
  assert.deepEqual(classifyBlock({ kind: "paragraph", text: "Punto chiave: Il dato non è una conclusione." }), {
    type: "key-concept",
    label: "Punto chiave",
    text: "Il dato non è una conclusione."
  });
});

test("preserves unknown paragraphs", () => {
  assert.deepEqual(classifyBlock({ kind: "paragraph", text: "Un testo normale." }), {
    type: "paragraph",
    text: "Un testo normale."
  });
});

test("preserves non-paragraph structures", () => {
  assert.deepEqual(classifyBlock({ kind: "list", items: ["A", "B"] }), {
    kind: "list",
    type: "list",
    items: ["A", "B"]
  });
});
