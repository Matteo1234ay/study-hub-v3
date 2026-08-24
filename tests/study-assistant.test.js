import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicChapterContext } from "../src/assistant/study-assistant.js";
import { createChatGptAdapter } from "../src/assistant/chatgpt-adapter.js";

const lesson = { id: "SMM-01", title: "Metriche e KPI", privateNote: "nota privata" };
const chapter = { title: "Retention", blocks: [{ type: "paragraph", text: "La retention descrive la permanenza." }, { type: "list", items: ["Errore comune"] }] };

test("builds a prompt only from public chapter content", () => {
  const prompt = createChatGptAdapter().prepare(buildPublicChapterContext({ lesson, chapter }));
  assert.match(prompt, /Retention/);
  assert.match(prompt, /Errore comune/);
  assert.doesNotMatch(prompt, /nota privata|history|progress/i);
});

test("uses ChatGPT home without embedding content in the URL", () => {
  const adapter = createChatGptAdapter();
  assert.equal(adapter.destination, "https://chatgpt.com/");
  assert.equal(adapter.destination.includes("?"), false);
});
