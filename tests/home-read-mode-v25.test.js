import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as screenUi from "../src/home/scene/screen-ui.js";

function recordingCanvas() {
  const draws = [];
  const context = new Proxy({
    fillText(text) { draws.push(String(text)); },
    clearRect() {}, fillRect() {}, save() {}, restore() {}, scale() {},
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, strokeRect() {}, arc() {}, fill() {}, setLineDash() {},
    measureText(text) { return { width: String(text).length * 8 }; }
  }, { set(target, key, value) { target[key] = value; return true; } });
  return { width: 0, height: 0, draws, getContext: () => context };
}

const socialStation = {
  id: "social",
  screenKind: "social",
  title: "Social Media Manager",
  meta: "SMM-01"
};

const socialData = {
  pathTitle: "Social Media Manager",
  lessonCount: 1,
  completion: 42
};

test("mobile Social read mode uses the sharp tier and compact copy", () => {
  assert.equal(typeof screenUi.resolveScreenPresentation, "function");
  if (typeof screenUi.resolveScreenPresentation !== "function") return;
  const state = screenUi.resolveScreenPresentation({
    screenKind: "social",
    active: true,
    read: true,
    compact: true
  });
  assert.ok(state.width >= 1280);
  assert.ok(state.height >= 1792);
  assert.equal(state.compactCopy, true);
  assert.ok(state.maxSupportLines <= 2);
});

test("station screen can enter and leave read presentation without redundant redraws", () => {
  const canvas = recordingCanvas();
  const handle = screenUi.createStationScreen({
    station: socialStation,
    data: socialData,
    canvasFactory: () => canvas
  });
  assert.equal(typeof handle.setPresentation, "function");
  if (typeof handle.setPresentation !== "function") return;

  assert.equal(handle.setPresentation({ active: true, read: true, compact: true }), true);
  assert.deepEqual([canvas.width, canvas.height], [1280, 1792]);
  const readText = canvas.draws.join(" ");
  assert.match(readText, /Reach · Impression/);
  assert.match(readText, /Watch time · Retention/);
  assert.doesNotMatch(readText, /LETTURA STRATEGICA/);
  assert.equal(handle.setPresentation({ active: true, read: true, compact: true }), false);
  assert.equal(handle.setPresentation({ active: true, read: false, compact: true }), true);
});

test("renderer feeds director read state into physical screen presentation", async () => {
  const source = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  assert.match(source, /setPresentation/);
  assert.match(source, /direction\.phase\s*===\s*["']read["']/);
  assert.match(source, /cameraLayout\s*===\s*["']mobile["']/);
});

test("read mode makes the external caption subordinate to the physical monitor", async () => {
  const css = await readFile(new URL("../styles/home-immersive.css", import.meta.url), "utf8");
  assert.match(css, /--home-caption-strength/);
  assert.match(css, /opacity:\s*var\(--home-caption-strength/);
  assert.match(css, /data-home-phase=["']read["'][^}]*home-station-caption/is);
  assert.match(css, /home-station-caption[^}]*small[^}]*display:\s*none/is);
});