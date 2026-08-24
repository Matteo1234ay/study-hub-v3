import test from "node:test";
import assert from "node:assert/strict";
import { parseRoute } from "../src/router.js";

test("parses progressive and final path assessments", () => {
  assert.deepEqual(parseRoute("#/paths/smm/assessment"), { name: "path-assessment", params: { pathId: "smm" } });
  assert.deepEqual(parseRoute("#/paths/smm/final-exam"), { name: "path-final-exam", params: { pathId: "smm" } });
});
