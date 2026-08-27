import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGACY_CHAPTER_MAP,
  aggregateLegacyCompletion,
  legacyIdsForMacroChapter,
  resolveLegacyChapterId,
  resolveRequestedChapter
} from "../src/lessons/lesson-compatibility.js";

test("every previous SMM-01 chapter resolves to one of four macro chapters", () => {
  const macroIds = new Set([
    "misurare-cio-che-conta",
    "leggere-dati-piattaforme",
    "interpretare-senza-ingannarsi",
    "trasformare-dati-decisioni"
  ]);

  assert.equal(Object.keys(LEGACY_CHAPTER_MAP).length, 19);
  for (const target of Object.values(LEGACY_CHAPTER_MAP)) assert.ok(macroIds.has(target));
});

test("a legacy request becomes a canonical macro chapter request", () => {
  const chapters = [{ id: "misurare-cio-che-conta" }, { id: "leggere-dati-piattaforme" }];
  assert.deepEqual(resolveRequestedChapter(chapters, "2-reach-impression-e-views-non-sono-sinonimi"), {
    chapterId: "leggere-dati-piattaforme",
    redirected: true,
    missing: false
  });
  assert.deepEqual(resolveRequestedChapter(chapters, "sconosciuto"), {
    chapterId: "misurare-cio-che-conta",
    redirected: false,
    missing: true
  });
});

test("old links resolve to their new macro chapter", () => {
  assert.equal(
    resolveLegacyChapterId("2-reach-impression-e-views-non-sono-sinonimi"),
    "leggere-dati-piattaforme"
  );
  assert.equal(
    resolveLegacyChapterId("10-correlazione-attribuzione-e-causa"),
    "interpretare-senza-ingannarsi"
  );
  assert.equal(resolveLegacyChapterId("un-id-nuovo"), "un-id-nuovo");
});

test("legacy ids can be listed for a macro chapter", () => {
  const ids = legacyIdsForMacroChapter("misurare-cio-che-conta");
  assert.ok(ids.includes("1-metrica-kpi-e-obiettivo-tre-cose-diverse"));
  assert.ok(ids.includes("9-vanity-metric-il-problema-non-e-la-metrica-ma-l-uso-che-ne-fai"));
  assert.ok(ids.includes("12-kpi-primari-e-metriche-diagnostiche"));
});

test("legacy completion is aggregated without mutating original ids", () => {
  const original = [
    "1-metrica-kpi-e-obiettivo-tre-cose-diverse",
    "9-vanity-metric-il-problema-non-e-la-metrica-ma-l-uso-che-ne-fai",
    "2-reach-impression-e-views-non-sono-sinonimi"
  ];

  const result = aggregateLegacyCompletion(original);

  assert.deepEqual(original, [
    "1-metrica-kpi-e-obiettivo-tre-cose-diverse",
    "9-vanity-metric-il-problema-non-e-la-metrica-ma-l-uso-che-ne-fai",
    "2-reach-impression-e-views-non-sono-sinonimi"
  ]);
  assert.deepEqual(result.legacyCompletedIds, original);
  assert.deepEqual(result.completedMacroChapterIds, [
    "misurare-cio-che-conta",
    "leggere-dati-piattaforme"
  ]);
});
