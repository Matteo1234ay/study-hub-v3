import test from "node:test";
import assert from "node:assert/strict";
import {
  createHomeStations,
  createHomeQuickActions
} from "../src/home/home-stations.js";

const paths = [
  {
    id: "smm",
    title: "Social Media Manager",
    lessons: [{ id: "SMM-01", title: "Metriche e KPI organici" }]
  },
  { id: "ai", title: "Intelligenza Artificiale", lessons: [] },
  { id: "design", title: "Design", lessons: [] },
  { id: "video", title: "Video Making", lessons: [] }
];

const findLessonById = lessonId => paths
  .flatMap(path => path.lessons)
  .find(lesson => lesson.id === lessonId) ?? null;

test("maps real Study Hub state to exactly six semantic stations", () => {
  const stations = createHomeStations({
    paths,
    lastPosition: {
      lessonId: "SMM-01",
      chapterId: "misurare-cio-che-conta"
    },
    findLessonById
  });

  assert.deepEqual(stations.map(({ id }) => id), [
    "desk",
    "memory",
    "social",
    "assessment",
    "progress",
    "future-paths"
  ]);
  assert.deepEqual(stations.map(({ href }) => href), [
    "#/lessons/SMM-01/misurare-cio-che-conta",
    "#/review",
    "#/paths/smm",
    "#/paths/smm/assessment",
    "#/progress",
    "#/paths"
  ]);
  assert.equal(stations[5].status, "standby");
  assert.equal(stations[5].meta, "3 percorsi in preparazione");
});

test("falls back safely when study history is absent or invalid", () => {
  const absent = createHomeStations({ paths, lastPosition: null, findLessonById });
  const invalid = createHomeStations({
    paths,
    lastPosition: { lessonId: "UNKNOWN", chapterId: "missing" },
    findLessonById
  });

  assert.equal(absent[0].href, "#/lessons/SMM-01");
  assert.equal(invalid[0].href, "#/lessons/SMM-01");
  assert.equal(invalid[0].title, "Metriche e KPI organici");
});

test("derives quick actions from the same continuation route", () => {
  const stations = createHomeStations({
    paths,
    lastPosition: { lessonId: "SMM-01", chapterId: "leggere-dati-piattaforme" },
    findLessonById
  });
  const actions = createHomeQuickActions(stations);

  assert.deepEqual(actions.map(({ href }) => href), [
    "#/lessons/SMM-01/leggere-dati-piattaforme",
    "#/paths",
    "#/search",
    "#/review",
    "#/progress"
  ]);
});

test("returns fresh station records on every call", () => {
  const first = createHomeStations({ paths, lastPosition: null, findLessonById });
  const second = createHomeStations({ paths, lastPosition: null, findLessonById });

  assert.notEqual(first, second);
  assert.notEqual(first[0], second[0]);
});

test("carries truthful local study state into physical screen data", () => {
  const stations = createHomeStations({
    paths: paths.map(path => path.id === "smm" ? { ...path, lessons: [{ ...path.lessons[0], chapterCount: 4 }] } : path),
    lastPosition: { lessonId: "SMM-01", chapterId: "kpi-e-obiettivi" },
    findLessonById,
    screenState: { chapter: "kpi-e-obiettivi", completion: 50, completedChapters: 2, noteCount: 7, reviewCount: 3 }
  });
  assert.deepEqual(stations[0].screenData, {
    lessonId: "SMM-01", chapter: "kpi-e-obiettivi", completion: 50, completedChapters: 2
  });
  assert.deepEqual(stations[1].screenData, { noteCount: 7, reviewCount: 3 });
  assert.equal(stations[4].screenData.completion, 50);
  assert.equal(stations[4].screenData.reviewCount, 3);
});
