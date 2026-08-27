import test from "node:test";
import assert from "node:assert/strict";
import { sectionHref, sectionPresentation } from "../src/lessons/render-section.js";

test("creates a stable macro chapter and section link", () => {
  assert.equal(
    sectionHref("SMM-01", "leggere-dati-piattaforme", "ctr-denominatori"),
    "#/lessons/SMM-01/leggere-dati-piattaforme?section=ctr-denominatori"
  );
});

test("recognizes supported learning blocks and safely falls back", () => {
  assert.equal(sectionPresentation({ type: "guided-example" }).kind, "callout");
  assert.equal(sectionPresentation({ type: "application" }).kind, "callout");
  assert.equal(sectionPresentation({ type: "retrieval-synthesis" }).kind, "callout");
  assert.equal(sectionPresentation({ type: "unknown" }).kind, "paragraph");
});
