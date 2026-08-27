import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/views/home-view.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../styles/components.css", import.meta.url), "utf8");

test("home exposes an immersive scene and motion hooks", () => {
  assert.match(home, /home-stage/);
  assert.match(home, /knowledge-sphere/);
  assert.match(home, /data-motion/);
  assert.match(home, /home-motion\.js/);
});

test("home motion respects reduced-motion preferences", () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
