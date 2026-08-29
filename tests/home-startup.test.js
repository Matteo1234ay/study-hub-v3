import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("successful WebGL startup never exposes the legacy fallback state", async () => {
  const source = await read("src/home/home-experience.js");
  assert.doesNotMatch(source, /root\.dataset\.homeState\s*=\s*["']fallback["']/);
  assert.match(source, /root\.dataset\.homeState\s*=\s*["']preparing["']/);
  assert.match(source, /await\s+renderer\.ready/);
  assert.match(source, /root\.dataset\.homeState\s*=\s*["']ready["']/);
});

test("the renderer resolves readiness only after a successful first frame", async () => {
  const source = await read("src/home/scene/study-room-renderer.js");
  assert.match(source, /readyPromise/);
  assert.match(source, /resolveReady/);
  assert.match(source, /renderer\.render\(scene, camera\);[\s\S]{0,260}resolveReady/s);
  assert.match(source, /ready:\s*readyPromise/);
});

test("normal loading hides legacy copy and genuine failure uses DOM fallback", async () => {
  const css = await read("styles/home-startup.css");
  const view = await read("src/views/home-view.js");
  const index = await read("index.html");
  assert.match(css, /data-home-state="loading"[\s\S]{0,420}\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
  assert.match(css, /data-home-state="preparing"[\s\S]{0,420}\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
  assert.match(view, /home-preload/);
  assert.match(view, /root\.dataset\.homeState\s*=\s*["']dom["']/);
  assert.doesNotMatch(view, /root\.dataset\.homeState\s*=\s*["']fallback["']/);
  assert.match(index, /styles\/home-startup\.css\?v=/);
});
