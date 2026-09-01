import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("V30 overlays use neutral glass while blue stays a small information accent", async () => {
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles/home-v30-polish.css", import.meta.url), "utf8");

  assert.match(index, /styles\/home-v30-polish\.css\?v=20260901-29/);
  assert.match(css, /--v30-glass:/);
  assert.match(css, /--v30-accent:/);
  assert.match(css, /\.home-station-caption/);
  assert.match(css, /\.home-quick-actions/);
  assert.match(css, /background:\s*var\(--v30-glass\)/);
  assert.doesNotMatch(css, /#102b63|#081b48|#163c7c|#0a2255|rgba\(8,\s*22,\s*58/);
});
