import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/home/scene/asset-registry.js", "utf8");

test("V30 large local GLB owns an independent finite mobile-safe timeout", () => {
  const declared = source.match(/V30_TIMEOUT_MS\s*=\s*(\d+)/);
  assert.ok(declared, "missing explicit V30 timeout");
  const timeoutMs = Number(declared[1]);
  assert.ok(timeoutMs >= 15000 && timeoutMs <= 30000, `unsafe V30 timeout ${timeoutMs}ms`);
  assert.match(source, /v30TimeoutMs\s*=\s*V30_TIMEOUT_MS/);
  assert.match(source, /Number\(v30TimeoutMs\)\s*\|\|\s*V30_TIMEOUT_MS/);
  assert.match(source, /Math\.min\(30000,\s*Math\.max\(15000/);
  assert.match(source, /Promise\.race/);
});

test("ordinary small assets retain their tighter timeout budget", () => {
  const declared = source.match(/DEFAULT_TIMEOUT_MS\s*=\s*(\d+)/);
  assert.ok(declared);
  assert.equal(Number(declared[1]), 12000);
  assert.match(source, /Math\.min\(15000,\s*Math\.max\(1000/);
});
