import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const RELEASE_TOKEN = "20260828-18";

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

test("the complete changed homepage graph uses one Safari-safe token", async () => {
  const files = [
    "index.html",
    "src/app.js",
    "src/views/home-view.js",
    "src/home/home-experience.js",
    "src/home/scene/study-room-renderer.js",
    "src/home/scene/build-room.js"
  ];
  const sources = Object.fromEntries(await Promise.all(files.map(async file => [
    file,
    await readFile(new URL(`../${file}`, import.meta.url), "utf8")
  ])));

  assert.match(sources["index.html"], new RegExp(`styles/home-immersive\\.css\\?v=${RELEASE_TOKEN}`));
  assert.match(sources["index.html"], new RegExp(`src/app\\.js\\?v=${RELEASE_TOKEN}`));
  for (const [file, imports] of Object.entries({
    "src/app.js": ["config/paths.js", "router.js", "views/home-view.js"],
    "src/views/home-view.js": ["config/paths.js", "home/home-stations.js", "home/home-experience.js"],
    "src/home/home-experience.js": ["scene/study-room-renderer.js", "home-transition-manager.js"],
    "src/home/scene/study-room-renderer.js": ["materials.js", "build-room.js", "camera-timeline.js", "lighting-controller.js", "interaction-controller.js", "quality-controller.js", "three.module.min.js"],
    "src/home/scene/build-room.js": ["screen-ui.js"]
  })) {
    for (const imported of imports) {
      assert.match(sources[file], new RegExp(`${imported.replaceAll(".", "\\.")}\\?v=${RELEASE_TOKEN}`), `${file} -> ${imported}`);
    }
  }
});

test("lesson synchronization cannot select application files", async () => {
  const script = await readFile(new URL("../scripts/sync-published-doc.mjs", import.meta.url), "utf8");
  const workflow = await readFile(new URL("../.github/workflows/sync-lessons.yml", import.meta.url), "utf8");
  assert.match(script, /output:\s*"data\/lessons\/SMM-01\.json"/);
  assert.doesNotMatch(script, /output:\s*"(?:src|styles)\//);
  assert.match(workflow, /git add data\/lessons/);
  assert.doesNotMatch(workflow, /git add\s+(?:-A|\.|src|styles|index\.html)/);
});