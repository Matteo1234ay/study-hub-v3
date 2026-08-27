import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/home-immersive.css", import.meta.url), "utf8");

test("home is one continuous scroll-driven 3d reveal scene", () => {
  assert.match(home, /home-stage/);
  assert.match(home, /knowledge-sphere/);
  assert.match(home, /reveal-stop/);
  assert.match(home, /--journey/);
  assert.doesNotMatch(home, /preview-card/);
  assert.doesNotMatch(home, /cinematic-grid/);
});

test("home motion respects reduced-motion preferences", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
