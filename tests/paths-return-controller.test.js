import test from "node:test";
import assert from "node:assert/strict";
import { createPathsReturnController } from "../src/home/paths-return-controller.js";

function eventTarget() {
  const listeners = new Map();
  return {
    scrollY: 0,
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    emit(type, event = {}) { listeners.get(type)?.(event); },
    count() { return listeners.size; }
  };
}

function routeState(entry = { resumeProgress: .96 }) {
  return {
    returns: [],
    consumePathsEntry() { return entry; },
    markReturn(value) { this.returns.push(value); }
  };
}

test("ordinary Paths entry never installs cinematic return behavior", () => {
  const target = eventTarget();
  const state = routeState(null);
  const navigations = [];

  const controller = createPathsReturnController({ routeState: state, navigate: href => navigations.push(href), windowTarget: target });
  target.emit("wheel", { deltaY: -100 });

  assert.equal(controller.active, false);
  assert.equal(target.count(), 0);
  assert.deepEqual(navigations, []);
});

test("a deliberate upward wheel gesture at the top returns Home once", () => {
  const target = eventTarget();
  const state = routeState();
  const navigations = [];
  createPathsReturnController({ routeState: state, navigate: href => navigations.push(href), windowTarget: target });

  target.emit("wheel", { deltaY: -18 });
  target.emit("wheel", { deltaY: -28 });
  target.emit("wheel", { deltaY: -80 });

  assert.deepEqual(state.returns, [{ resumeProgress: .96 }]);
  assert.deepEqual(navigations, ["#/home"]);
});

test("cinematic return reverses the shared portal exactly once before navigating Home", () => {
  const target = eventTarget();
  const state = routeState();
  const events = [];
  const sharedTransition = {
    beginReverse() { events.push("portal:reverse"); return events.filter(item => item === "portal:reverse").length === 1; }
  };
  createPathsReturnController({
    routeState: state,
    navigate: href => events.push(`navigate:${href}`),
    windowTarget: target,
    sharedTransition
  });

  target.emit("wheel", { deltaY: -20 });
  target.emit("wheel", { deltaY: -24 });
  target.emit("wheel", { deltaY: -100 });

  assert.deepEqual(events, ["portal:reverse", "navigate:#/home"]);
  assert.deepEqual(state.returns, [{ resumeProgress: .96 }]);
});

test("wheel return is disabled after the user descends into Paths", () => {
  const target = eventTarget();
  const state = routeState();
  const navigations = [];
  createPathsReturnController({ routeState: state, navigate: href => navigations.push(href), windowTarget: target });

  target.scrollY = 30;
  target.emit("wheel", { deltaY: -100 });

  assert.deepEqual(navigations, []);
});

test("a downward finger movement at the top restores the cinematic Home", () => {
  const target = eventTarget();
  const state = routeState({ resumeProgress: .95 });
  const navigations = [];
  createPathsReturnController({ routeState: state, navigate: href => navigations.push(href), windowTarget: target });

  target.emit("touchstart", { touches: [{ clientY: 220 }] });
  target.emit("touchmove", { touches: [{ clientY: 286 }] });

  assert.deepEqual(state.returns, [{ resumeProgress: .95 }]);
  assert.deepEqual(navigations, ["#/home"]);
});
