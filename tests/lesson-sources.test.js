import test from "node:test";
import assert from "node:assert/strict";
import { resolveSourceRefs } from "../src/lessons/sources.js";

test("resolves source references in block order", () => {
  const result = resolveSourceRefs(
    { sourceRefs: ["meta-reach", "youtube-reach"] },
    [{ id: "youtube-reach", title: "YouTube Reach" }, { id: "meta-reach", title: "Meta Reach" }]
  );
  assert.deepEqual(result.resolved.map(source => source.id), ["meta-reach", "youtube-reach"]);
  assert.deepEqual(result.missing, []);
});

test("reports missing sources without throwing", () => {
  const result = resolveSourceRefs({ sourceRefs: ["missing"] }, []);
  assert.deepEqual(result.resolved, []);
  assert.deepEqual(result.missing, ["missing"]);
});

test("treats legacy blocks as having no source references", () => {
  assert.deepEqual(resolveSourceRefs({ type: "paragraph" }, null), { resolved: [], missing: [] });
});
