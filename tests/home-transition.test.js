import test from "node:test";
import assert from "node:assert/strict";
import {
  createHomeTransitionManager,
  normalizeTransitionDuration
} from "../src/home/home-transition-manager.js";

function fakeRoot(events) {
  const body = { append(node) { events.push(`overlay:${node.dataset.stationId}`); node.remove = () => {}; } };
  const node = {
    dataset: { stationId: "progress" },
    cloneNode() { return { dataset: { stationId: "progress" }, classList: { add() {} } }; }
  };
  return {
    ownerDocument: { body },
    querySelector() { return node; },
    dataset: {}
  };
}

function fakeExitRoot(events) {
  return {
    ownerDocument: {
      body: { append() {} },
      startViewTransition(callback) {
        events.push("view-transition");
        callback();
        return {};
      }
    },
    querySelector() { return null; },
    dataset: {}
  };
}

test("focuses, presents a semantic overlay and then navigates", async () => {
  const events = [];
  const manager = createHomeTransitionManager({
    root: fakeRoot(events),
    renderer: { async focusStation(id) { events.push(`focus:${id}`); } },
    navigate(href) { events.push(`navigate:${href}`); },
    wait: async () => {}
  });
  await manager.activate({ id: "progress", href: "#/progress" });
  assert.deepEqual(events, ["focus:progress", "overlay:progress", "navigate:#/progress"]);
});

test("automatic scroll exit navigates through a view transition without refocusing or showing a card", async () => {
  const events = [];
  const manager = createHomeTransitionManager({
    root: fakeExitRoot(events),
    renderer: { async focusStation(id) { events.push(`focus:${id}`); } },
    navigate(href) { events.push(`navigate:${href}`); },
    wait: async () => {}
  });

  await manager.activate(
    { id: "future-paths", href: "#/paths" },
    { focus: false, overlay: false, viewTransition: true }
  );

  assert.deepEqual(events, ["view-transition", "navigate:#/paths"]);
});

test("clamps cinematic duration between 400 and 900 milliseconds", () => {
  assert.equal(normalizeTransitionDuration(20), 400);
  assert.equal(normalizeTransitionDuration(650), 650);
  assert.equal(normalizeTransitionDuration(4_000), 900);
});

test("reduced motion navigates immediately and double activation is ignored", async () => {
  const events = [];
  const manager = createHomeTransitionManager({
    root: fakeRoot(events),
    renderer: { async focusStation(id) { events.push(`focus:${id}`); } },
    navigate(href) { events.push(`navigate:${href}`); },
    reducedMotion: true
  });
  const first = manager.activate({ id: "desk", href: "#/lessons/SMM-01" });
  const second = manager.activate({ id: "progress", href: "#/progress" });
  await Promise.all([first, second]);
  assert.deepEqual(events, ["navigate:#/lessons/SMM-01"]);
});

test("cancel fails open to the selected destination", async () => {
  const events = [];
  let release;
  const manager = createHomeTransitionManager({
    root: fakeRoot(events),
    renderer: { focusStation() { return new Promise(resolve => { release = resolve; }); } },
    navigate(href) { events.push(`navigate:${href}`); }
  });
  const activation = manager.activate({ id: "progress", href: "#/progress" });
  manager.cancel();
  release?.();
  await activation;
  assert.deepEqual(events, ["navigate:#/progress"]);
});
