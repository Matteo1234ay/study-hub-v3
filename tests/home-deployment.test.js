import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const RELEASE_TOKEN = "20260901-28";

test("Three.js is pinned and vendored locally with its license", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
  assert.equal(pkg.dependencies?.three, "0.185.1");

  const moduleText = await readFile(
    new URL("../vendor/three/three.module.min.js", import.meta.url),
    "utf8"
  );
  const license = await readFile(
    new URL("../vendor/three/LICENSE", import.meta.url),
    "utf8"
  );

  assert.match(moduleText, /WebGLRenderer/);
  assert.match(license, /MIT License/);
});

test("the complete vendored Three.js module graph is importable", async () => {
  const THREE = await import("../vendor/three/three.module.min.js");
  assert.equal(typeof THREE.WebGLRenderer, "function");
  assert.equal(typeof THREE.MeshStandardMaterial, "function");
});

test("vendored Three wrapper imports an immutable versioned core filename", async () => {
  const wrapper = await readFile(new URL("../vendor/three/three.module.min.js", import.meta.url), "utf8");
  const core = await readFile(new URL("../vendor/three/three.core.0.185.1.min.js", import.meta.url), "utf8");
  assert.match(wrapper, /\.\/three\.core\.0\.185\.1\.min\.js/);
  assert.doesNotMatch(wrapper, /["']\.\/three\.core\.min\.js["']/);
  assert.ok(core.length > 100_000);
});

test("the changed homepage chain uses the Safari-safe v28 token", async () => {
  const files = [
    "index.html",
    "src/app.js",
    "src/views/home-view.js",
    "src/views/paths-view.js",
    "src/home/home-experience.js",
    "src/home/scene/study-room-renderer.js",
    "src/home/scene/renderer-setup.js"
  ];
  const sources = Object.fromEntries(await Promise.all(files.map(async file => [
    file,
    await readFile(new URL(`../${file}`, import.meta.url), "utf8")
  ])));

  assert.match(sources["index.html"], new RegExp(`styles/home-immersive\\.css\\?v=${RELEASE_TOKEN}`));
  assert.match(sources["index.html"], new RegExp(`src/app\\.js\\?v=${RELEASE_TOKEN}`));

  for (const imported of ["views/home-view.js", "views/paths-view.js", "home/home-shared-transition.js"]) {
    assert.match(sources["src/app.js"], new RegExp(`${imported.replaceAll(".", "\\.")}\\?v=${RELEASE_TOKEN}`));
  }
  for (const imported of ["home/home-experience.js", "home/home-stations.js"]) {
    assert.match(sources["src/views/home-view.js"], new RegExp(`${imported.replaceAll(".", "\\.")}\\?v=${RELEASE_TOKEN}`));
  }
  for (const imported of ["home-route-state.js", "paths-return-controller.js", "home-shared-transition.js"]) {
    assert.match(sources["src/views/paths-view.js"], new RegExp(`${imported.replaceAll(".", "\\.")}\\?v=${RELEASE_TOKEN}`));
  }
  for (const imported of ["home-route-state.js", "home-shared-transition.js", "scene/study-room-renderer.js", "home-transition-manager.js"]) {
    assert.match(sources["src/home/home-experience.js"], new RegExp(`${imported.replaceAll(".", "\\.")}\\?v=${RELEASE_TOKEN}`));
  }
  for (const imported of ["archive-field.js", "archive-state.js", "renderer-setup.js"]) {
    assert.match(sources["src/home/scene/study-room-renderer.js"], new RegExp(`${imported.replaceAll(".", "\\.")}\\?v=${RELEASE_TOKEN}`));
  }
  assert.match(sources["src/home/scene/renderer-setup.js"], new RegExp(`asset-registry\\.js\\?v=${RELEASE_TOKEN}`));
});

test("lesson synchronization cannot select application files", async () => {
  const script = await readFile(new URL("../scripts/sync-published-doc.mjs", import.meta.url), "utf8");
  const workflow = await readFile(new URL("../.github/workflows/sync-lessons.yml", import.meta.url), "utf8");
  assert.match(script, /output:\s*"data\/lessons\/SMM-01\.json"/);
  assert.doesNotMatch(script, /output:\s*"(?:src|styles)\//);
  assert.match(workflow, /git add data\/lessons/);
  assert.doesNotMatch(workflow, /git add\s+(?:-A|\.|src|styles|index\.html)/);
});