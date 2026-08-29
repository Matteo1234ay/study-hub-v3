import test from "node:test";
import assert from "node:assert/strict";
import { createCinematicRouteState } from "../src/home/home-route-state.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("only a cinematic exit activates the special Paths entry", () => {
  const storage = memoryStorage();
  const state = createCinematicRouteState(storage, () => 10_000);

  assert.equal(state.consumePathsEntry(), null);
  state.markExit({ resumeProgress: .97 });
  assert.deepEqual(state.consumePathsEntry(), { resumeProgress: .97 });
  assert.equal(state.consumePathsEntry(), null);
});

test("cinematic entry expires and malformed storage fails closed", () => {
  const storage = memoryStorage();
  let time = 10_000;
  const state = createCinematicRouteState(storage, () => time);

  state.markExit({ resumeProgress: .97 });
  time += 300_001;
  assert.equal(state.consumePathsEntry(), null);

  storage.setItem("study-hub:cinematic-route:v1", "not-json");
  assert.equal(state.consumePathsEntry(), null);
});

test("a return stores one bounded Home resume position", () => {
  const storage = memoryStorage();
  const state = createCinematicRouteState(storage, () => 20_000);

  state.markReturn({ resumeProgress: 2 });
  assert.deepEqual(state.consumeHomeResume(), { resumeProgress: .97 });
  assert.equal(state.consumeHomeResume(), null);

  state.markReturn({ resumeProgress: -1 });
  assert.deepEqual(state.consumeHomeResume(), { resumeProgress: .8 });
});
