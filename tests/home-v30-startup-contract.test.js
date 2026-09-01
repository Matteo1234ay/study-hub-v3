import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("V30 renderer state deterministically reveals canvas and retires the poster", async () => {
  const css = await readFile(new URL("../styles/home-startup.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.home-journey\[data-home-renderer="webgl-v30"\]\s+\.study-room-canvas\s*\{[^}]*opacity:\s*1\s*;/s
  );
  assert.match(
    css,
    /\.home-journey\[data-home-renderer="webgl-v30"\]\s+\.home-v30-poster\s*\{[^}]*opacity:\s*0\s*;[^}]*visibility:\s*hidden\s*;/s
  );
  assert.match(css, /transition:\s*opacity\s+360ms/);
});
