import test from "node:test";
import assert from "node:assert/strict";
import { findPotentialSecrets } from "../scripts/check-secrets.mjs";

test("does not flag security documentation or scanner patterns", () => {
  const files = new Map([
    ["plan.md", "rg -n '(client_secret|access_token|BEGIN PRIVATE KEY)' ."],
    ["workflow.yml", "Check for committed secrets"]
  ]);
  assert.deepEqual(findPotentialSecrets(files), []);
});

test("flags credential-shaped assignments", () => {
  const files = new Map([["config.js", "const client_" + "secret = 'abcdefghijklmnop';"]]);
  assert.deepEqual(findPotentialSecrets(files), [{ path: "config.js", line: 1 }]);
});
