import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lessonCss = readFileSync(new URL("../styles/lesson.css", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const appJs = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");

test("reading preferences visibly affect study content and the settings preview", () => {
  assert.match(lessonCss, /data-font-size="large"[^}]*\.reading-preview/);
  assert.match(lessonCss, /data-reading-width="narrow"[^}]*\.reading-preview/);
});

test("focus mode always exposes a fixed exit control", () => {
  assert.match(indexHtml, /class="focus-exit"/);
  assert.match(appJs, /focus-exit/);
  assert.match(appJs, /focusExit\?\.addEventListener/);
  assert.match(lessonCss, /data-focus-mode="true"[^}]*\.focus-exit/);
  assert.match(appJs, /event\.key === "Escape"/);
  assert.match(appJs, /preferences\.update\(\{ focus: false \}\)/);
});

test("reduced motion works through both system and internal preferences", () => {
  assert.match(lessonCss, /prefers-reduced-motion: reduce/);
  assert.match(lessonCss, /data-motion="reduced"/);
});

test("versioned assets prevent Safari from mixing deployments", () => {
  assert.match(indexHtml, /styles\/lesson\.css\?v=/);
  assert.match(indexHtml, /src\/app\.js\?v=/);
  assert.match(appJs, /views\/progress-view\.js\?v=/);
});
