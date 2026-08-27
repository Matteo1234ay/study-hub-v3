import test from "node:test";
import assert from "node:assert/strict";
import { getVisualizationDefinition, visualizationFallback } from "../src/visualizations/visualization-registry.js";

test("registers the six approved explanatory visualizations", () => {
  for (const id of ["reach-impressions", "watch-time-average", "retention-curve", "correlation-causality", "test-builder", "report-builder"]) {
    const definition = getVisualizationDefinition(id);
    assert.equal(definition.id, id);
    assert.ok(definition.steps.length >= 3);
    assert.ok(definition.staticSummary.length > 80);
  }
});

test("unknown visualizations return a static explanation without throwing", () => {
  assert.deepEqual(visualizationFallback({ visualizationId: "missing", staticSummary: "Spiegazione statica disponibile." }), {
    id: "missing",
    title: "Visualizzazione non disponibile",
    staticSummary: "Spiegazione statica disponibile.",
    steps: []
  });
});
