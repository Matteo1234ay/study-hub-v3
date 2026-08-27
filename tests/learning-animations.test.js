import test from "node:test";
import assert from "node:assert/strict";
import { visualizationMarkup } from "../src/lessons/learning-visualizations.js";

const expected = ["reach-impressions","watch-time","retention","causality","test-design","mini-report"];
for (const type of expected) test(`${type} has a semantic graphic and static explanation`, () => {
  const result = visualizationMarkup(type);
  assert.match(result.html, /viz-graphic/);
  assert.ok(result.staticText.length > 20);
  assert.ok(result.steps >= 3);
});

test("reach/impressions distinguishes unique people from repeated exposures", () => {
  const result = visualizationMarkup("reach-impressions");
  assert.match(result.html, /persona/);
  assert.match(result.html, /esposizione/);
});

test("retention contains an animated curve with interpretation markers", () => {
  const result = visualizationMarkup("retention");
  assert.match(result.html, /polyline|path/);
  assert.match(result.html, /abbandono/);
  assert.match(result.html, /picco/);
});
