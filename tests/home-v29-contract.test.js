import test from "node:test";
import assert from "node:assert/strict";
import { HOME_V29_CLIPS, HOME_V29_NODES, HOME_V29_RELEASE, HOME_V29_WINDOWS } from "../src/home/scene/home-v29-contract.js";

test("V29 contract is internally consistent", () => {
  assert.equal(HOME_V29_RELEASE, "20260901-29");
  assert.equal(new Set(HOME_V29_NODES).size, HOME_V29_NODES.length);
  assert.equal(new Set(HOME_V29_CLIPS).size, HOME_V29_CLIPS.length);
  for (const clip of HOME_V29_CLIPS) {
    assert.ok(HOME_V29_WINDOWS[clip], `missing window for ${clip}`);
    const [start, end] = HOME_V29_WINDOWS[clip];
    assert.ok(start >= 0 && start < end && end <= 1, `invalid window for ${clip}`);
  }
});
