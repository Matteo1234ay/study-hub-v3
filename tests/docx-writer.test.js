import test from "node:test";
import assert from "node:assert/strict";
import { createNotesDocx } from "../src/study/docx-writer.js";

test("creates a local DOCX package with escaped note text", async () => {
  const blob = createNotesDocx({
    title: "Note SMM-01",
    date: "27/08/2026",
    chapters: [{ title: "Capitolo & uno", sections: [{ title: "CTR", notes: [{ text: "5 < 10 & verificare", conceptId: null }] }] }]
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const binaryText = new TextDecoder().decode(bytes);

  assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.match(binaryText, /\[Content_Types\]\.xml/);
  assert.match(binaryText, /word\/document\.xml/);
  assert.match(binaryText, /5 &lt; 10 &amp; verificare/);
  assert.match(binaryText, /Capitolo &amp; uno/);
});
