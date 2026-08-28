import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHomeQuickActions, createHomeStations } from "../src/home/home-stations.js";

const readProjectFile = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home view exposes an accessible semantic shell before 3D loads", async () => {
  const source = await readProjectFile("src/views/home-view.js");

  assert.match(source, /home-quick-actions/);
  assert.match(source, /aria-label"\s*:\s*"Accesso rapido"/);
  assert.match(source, /home-fallback/);
  assert.match(source, /data-station-id/);
  assert.match(source, /mountHomeExperience/);
  assert.match(source, /study-room-canvas/);
  assert.doesNotMatch(source, /hero-orbit|orbit-ring|orbit-core/);
});

test("all functional routes remain available without WebGL", () => {
  const paths = [
    {
      id: "smm",
      title: "Social Media Manager",
      assessmentManifestUrl: "data/path-assessments/smm.json",
      lessons: [{ id: "SMM-01", title: "Metriche e KPI organici" }]
    },
    { id: "ai", title: "Intelligenza Artificiale", lessons: [] }
  ];
  const stations = createHomeStations({
    paths,
    lastPosition: null,
    findLessonById: id => paths[0].lessons.find(lesson => lesson.id === id) ?? null
  });
  const quickActions = createHomeQuickActions(stations);

  assert.deepEqual(quickActions.map(action => action.href), [
    "#/lessons/SMM-01",
    "#/paths",
    "#/search",
    "#/review",
    "#/progress"
  ]);
  assert.equal(stations.length, 6);
  assert.ok(stations.every(station => station.href.startsWith("#/")));
});

test("home stylesheet prevents local horizontal overflow and supports reduced motion", async () => {
  const css = await readProjectFile("styles/home-immersive.css");
  assert.match(css, /\.home-journey\s*\{[^}]*overflow-x:\s*clip/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.doesNotMatch(css, /100vw\s*;/);
  assert.match(css, /data-home-state="dom"/);
  assert.match(css, /data-home-state="ready"[^}]*\.home-fallback[^{]*\{[^}]*visibility:\s*hidden/s);
});

test("mobile cinematic mode keeps captions readable and touch-safe", async () => {
  const css = await readProjectFile("styles/home-immersive.css");
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*data-home-state="ready"[^}]*\.home-captions/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*data-home-state="ready"[^}]*\.home-station-caption/s);
  assert.match(css, /touch-action:\s*pan-y/);
});

test("index loads the immersive home stylesheet", async () => {
  const html = await readProjectFile("index.html");
  assert.match(html, /styles\/home-immersive\.css\?v=/);
});
