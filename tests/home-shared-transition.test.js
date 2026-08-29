import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function loadSharedTransition() {
  try {
    return await import("../src/home/home-shared-transition.js");
  } catch {
    return null;
  }
}

function fakeDocument() {
  const children = [];
  const body = {
    append(node) {
      if (!children.includes(node)) children.push(node);
      node.parentNode = body;
    },
    querySelector(selector) {
      if (selector !== ".paths-shared-portal") return null;
      return children.find(node => node.className === "paths-shared-portal") ?? null;
    }
  };
  return {
    body,
    defaultView: { innerWidth: 1200, innerHeight: 800 },
    createElement() {
      const styleValues = new Map();
      return {
        className: "",
        dataset: {},
        parentNode: null,
        style: {
          setProperty(name, value) { styleValues.set(name, String(value)); },
          getPropertyValue(name) { return styleValues.get(name) ?? ""; }
        },
        remove() {
          const index = children.indexOf(this);
          if (index >= 0) children.splice(index, 1);
          this.parentNode = null;
        }
      };
    }
  };
}

test("shared portal grows from the projected Paths screen to the viewport", async () => {
  const module = await loadSharedTransition();
  assert.equal(typeof module?.createSharedPathsTransition, "function");
  if (!module?.createSharedPathsTransition) return;

  const documentTarget = fakeDocument();
  const transition = module.createSharedPathsTransition({ documentTarget });
  const sourceRect = { left: 420, top: 210, width: 240, height: 150 };

  transition.update({ sourceRect, progress: 0 });
  const portal = transition.element;
  assert.ok(portal);
  assert.equal(portal.style.getPropertyValue("--paths-portal-left"), "420px");
  assert.equal(portal.style.getPropertyValue("--paths-portal-top"), "210px");
  assert.equal(portal.style.getPropertyValue("--paths-portal-width"), "240px");
  assert.equal(portal.style.getPropertyValue("--paths-portal-height"), "150px");

  transition.update({ sourceRect, progress: 1 });
  assert.equal(portal.style.getPropertyValue("--paths-portal-left"), "0px");
  assert.equal(portal.style.getPropertyValue("--paths-portal-top"), "0px");
  assert.equal(portal.style.getPropertyValue("--paths-portal-width"), "1200px");
  assert.equal(portal.style.getPropertyValue("--paths-portal-height"), "800px");
});

test("renderer exposes the projected future Paths screen in CSS pixels", async () => {
  const source = await readFile(new URL("../src/home/scene/study-room-renderer.js", import.meta.url), "utf8");
  assert.match(source, /getPathsProjection\s*\(/);
  assert.match(source, /getBoundingClientRect/);
  assert.match(source, /future-paths/);
});

test("a committed body portal survives the Home subtree replacement and is received by Paths", async () => {
  const module = await loadSharedTransition();
  assert.equal(typeof module?.createSharedPathsTransition, "function");
  if (!module?.createSharedPathsTransition) return;

  const documentTarget = fakeDocument();
  const transition = module.createSharedPathsTransition({ documentTarget });
  transition.update({ sourceRect: { left: 100, top: 80, width: 300, height: 180 }, progress: 1 });
  assert.equal(transition.commit(), true);
  const portal = transition.element;
  transition.dispose();
  assert.equal(documentTarget.body.querySelector(".paths-shared-portal"), portal);

  const receiver = { classList: { added: [], add(name) { this.added.push(name); } }, dataset: {} };
  const next = module.createSharedPathsTransition({ documentTarget });
  assert.equal(next.receive(receiver), true);
  assert.ok(receiver.classList.added.includes("paths-cinematic-receiver"));
  assert.equal(receiver.dataset.cinematicEntry, "true");
});

test("app scroll reset is suppressed only while the shared portal owns the route handoff", async () => {
  const module = await loadSharedTransition();
  assert.equal(typeof module?.shouldPreserveCinematicScroll, "function");
  if (!module?.shouldPreserveCinematicScroll) return;

  const documentTarget = fakeDocument();
  assert.equal(module.shouldPreserveCinematicScroll(documentTarget), false);
  const transition = module.createSharedPathsTransition({ documentTarget });
  transition.update({ sourceRect: { left: 100, top: 80, width: 300, height: 180 }, progress: 1 });
  transition.commit();
  assert.equal(module.shouldPreserveCinematicScroll(documentTarget), true);
  transition.element.dataset.phase = "received";
  assert.equal(module.shouldPreserveCinematicScroll(documentTarget), false);
  transition.element.dataset.phase = "reversing";
  assert.equal(module.shouldPreserveCinematicScroll(documentTarget), true);
});

test("reverse handoff is one-shot and reduced motion remains non-zooming", async () => {
  const module = await loadSharedTransition();
  assert.equal(typeof module?.createSharedPathsTransition, "function");
  if (!module?.createSharedPathsTransition) return;

  const documentTarget = fakeDocument();
  const transition = module.createSharedPathsTransition({ documentTarget, reducedMotion: true });
  transition.update({ sourceRect: { left: 300, top: 200, width: 200, height: 120 }, progress: .5 });
  assert.equal(transition.element.dataset.reducedMotion, "true");
  assert.equal(transition.beginReverse(), true);
  assert.equal(transition.beginReverse(), false);
  assert.equal(transition.element.dataset.direction, "reverse");
});
