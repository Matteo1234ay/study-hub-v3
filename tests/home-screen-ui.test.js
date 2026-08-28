import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStationScreen } from "../src/home/scene/screen-ui.js";

function recordingCanvas() {
  const operations = [];
  const draws = [];
  const context = new Proxy({
    fillText(text) {
      operations.push(String(text));
      draws.push({ text: String(text), font: String(this.font ?? "") });
    },
    measureText(text) { return { width: String(text).length * 7 }; },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillRect() {},
    strokeRect() {},
    arc() {},
    fill() {},
    clearRect() {},
    setLineDash() {},
    save() {},
    restore() {},
    translate() {},
    scale() {}
  }, {
    set(target, key, value) { target[key] = value; return true; }
  });
  return {
    width: 0,
    height: 0,
    operations,
    draws,
    getContext: () => context
  };
}

function record(screenKind) {
  const canvas = recordingCanvas();
  const station = {
    id: screenKind === "lesson" ? "desk" : screenKind,
    screenKind,
    title: "Titolo",
    meta: "SMM-01"
  };
  const handle = createStationScreen({
    station,
    data: {
      lessonId: "SMM-01",
      chapter: "Misurare ciò che conta",
      completion: 42,
      reviewCount: 3,
      noteCount: 2,
      lessonCount: 1,
      completedChapters: 2,
      totalChapters: 4,
      assessmentAvailable: true
    },
    canvasFactory: () => canvas
  });
  return { text: canvas.operations.join(" "), draws: canvas.draws, handle, canvas };
}

function fontSize(draw) {
  return Number(draw?.font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 0);
}

test("each station screen communicates its real Study Hub function", () => {
  assert.match(record("lesson").text, /SMM-01|Continua|Capitolo|42%/);
  assert.match(record("memory").text, /Note|Ripasso|Da consolidare/);
  assert.match(record("social").text, /Reach|Impression|Watch time|Retention|1 lezione/);
  assert.match(record("assessment").text, /Disponibile|Domande|feedback|Apri/);
  assert.match(record("progress").text, /Avanzamento reale|2 di 4|consolidare/);
  assert.match(record("future").text, /In preparazione|Standby/);
});

test("social display uses a portrait high-density canvas and readable type", () => {
  const { canvas, draws } = record("social");
  const title = draws.find(draw => draw.text === "Social Media Manager");
  const lessonCount = draws.find(draw => /1 lezione disponibile/.test(draw.text));

  assert.ok(canvas.height > canvas.width, `expected portrait canvas, got ${canvas.width}x${canvas.height}`);
  assert.ok(canvas.width >= 640, `social canvas width too low: ${canvas.width}`);
  assert.ok(canvas.height >= 800, `social canvas height too low: ${canvas.height}`);
  assert.ok(fontSize(title) >= 40, `social title too small: ${title?.font}`);
  assert.ok(fontSize(lessonCount) >= 26, `lesson count too small: ${lessonCount?.font}`);
});

test("screen textures stay small and redraw only when data changes", () => {
  const { handle, canvas } = record("lesson");
  const initialOperations = canvas.operations.length;

  assert.ok(canvas.width <= 512);
  assert.ok(canvas.height <= 512);
  assert.equal(handle.update({
    lessonId: "SMM-01",
    chapter: "Misurare ciò che conta",
    completion: 42,
    reviewCount: 3,
    noteCount: 2,
    lessonCount: 1,
    completedChapters: 2,
    totalChapters: 4,
    assessmentAvailable: true
  }), false);
  assert.equal(canvas.operations.length, initialOperations);
  assert.equal(handle.update({ completion: 60 }), true);
  assert.ok(canvas.operations.length > initialOperations);
});

test("renderer sharpens station textures at oblique viewing angles", async () => {
  const source = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  assert.match(source, /getMaxAnisotropy/);
  assert.match(source, /anisotropy/);
});

test("dispose makes later updates inert", () => {
  const { handle } = record("progress");
  handle.dispose();
  assert.equal(handle.update({ completion: 100 }), false);
});

test("screens avoid fabricated social metrics and assessment progress", async () => {
  const source = await readFile(new URL("../src/home/scene/screen-ui.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /12,4K|19,8K|486h|Domanda 4 di 12|Lettura dati", 74|Decisioni", 38/);
  assert.match(source, /lessonCount/);
  assert.match(source, /completedChapters/);
});
