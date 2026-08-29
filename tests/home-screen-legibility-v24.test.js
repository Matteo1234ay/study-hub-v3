import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createStationScreen } from "../src/home/scene/screen-ui.js";

function recordingCanvas() {
  const draws = [];
  const context = new Proxy({
    fillText(text) { draws.push({ text: String(text), font: String(this.font ?? "") }); },
    clearRect() {}, fillRect() {}, save() {}, restore() {}, scale() {},
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, strokeRect() {}, arc() {}, fill() {}, setLineDash() {},
    measureText(text) { return { width: String(text).length * 8 }; }
  }, { set(target, key, value) { target[key] = value; return true; } });
  return { width: 0, height: 0, draws, getContext: () => context };
}

function station(kind) {
  return { id: kind === "lesson" ? "desk" : kind, screenKind: kind, title: kind, meta: "SMM-01" };
}

function data() {
  return {
    lessonId: "SMM-01",
    chapter: "Misurare ciò che conta",
    completion: 42,
    reviewCount: 3,
    noteCount: 2,
    lessonCount: 1,
    completedChapters: 2,
    totalChapters: 4,
    assessmentAvailable: true,
    pathTitle: "Social Media Manager"
  };
}

function fontSize(font) {
  return Number(String(font).match(/(\d+(?:\.\d+)?)px/)?.[1] ?? 0);
}

test("the active station raises texture density without changing physical camera composition", () => {
  for (const kind of ["lesson", "memory", "assessment", "progress", "future"]) {
    const canvas = recordingCanvas();
    const handle = createStationScreen({ station: station(kind), data: data(), canvasFactory: () => canvas });
    assert.deepEqual([canvas.width, canvas.height], [768, 480], `${kind} base tier`);
    assert.equal(handle.setActive(true), true);
    assert.deepEqual([canvas.width, canvas.height], [1024, 640], `${kind} active tier`);
    assert.equal(handle.setActive(true), false, `${kind} should not redraw the same tier`);
  }

  const canvas = recordingCanvas();
  const social = createStationScreen({ station: station("social"), data: data(), canvasFactory: () => canvas });
  assert.deepEqual([canvas.width, canvas.height], [960, 1344]);
  social.setActive(true);
  assert.deepEqual([canvas.width, canvas.height], [1280, 1792]);
});

test("screen typography has no decorative microtext below the mobile readable floor", () => {
  for (const kind of ["lesson", "memory", "social", "assessment", "progress", "future"]) {
    const canvas = recordingCanvas();
    createStationScreen({ station: station(kind), data: data(), canvasFactory: () => canvas });
    const sizes = canvas.draws.map(draw => fontSize(draw.font)).filter(Boolean);
    assert.ok(sizes.length > 0, `${kind} drew no text`);
    assert.ok(Math.min(...sizes) >= 15, `${kind} contains microtext at ${Math.min(...sizes)}px`);
  }
});

test("every station keeps a large dominant message and Social stays especially legible", () => {
  const expectations = [
    ["lesson", "SMM-01", 40],
    ["memory", "Note e Ripasso", 38],
    ["social", "Social Media Manager", 56],
    ["assessment", "Disponibile", 39],
    ["progress", "Avanzamento", 38],
    ["future", "Percorsi", 38]
  ];
  for (const [kind, text, minimum] of expectations) {
    const canvas = recordingCanvas();
    createStationScreen({ station: station(kind), data: data(), canvasFactory: () => canvas });
    const draw = canvas.draws.find(item => item.text === text || item.text.startsWith(text));
    assert.ok(draw, `${kind} dominant text missing: ${text}`);
    assert.ok(fontSize(draw.font) >= minimum, `${kind} dominant text too small: ${draw?.font}`);
  }
});

test("room integration exposes one active-screen switch instead of redrawing all screens each frame", async () => {
  const room = await readFile(new URL("../src/home/scene/build-room.js", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  assert.match(room, /setActiveScreen\s*\(/);
  assert.match(room, /screenHandle\.setActive/);
  assert.match(renderer, /room\.setActiveScreen\(shot\.stationId\)/);
});
