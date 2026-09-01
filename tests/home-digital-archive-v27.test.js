import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolveArchivePhase, resolveArchiveBudget } from "../src/home/scene/archive-state.js";

function executableSource(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("archive phases are deterministic and reversible", () => {
  assert.equal(resolveArchivePhase(.05).phase, "studio");
  assert.equal(resolveArchivePhase(.3).phase, "knowledge");
  assert.equal(resolveArchivePhase(.55).phase, "destabilize");
  assert.equal(resolveArchivePhase(.72).phase, "fragment");
  assert.equal(resolveArchivePhase(.9).phase, "archive");
  assert.equal(resolveArchivePhase(.99).phase, "handoff");
  assert.deepEqual(resolveArchivePhase(.72), resolveArchivePhase(.72));
});

test("archive budget adapts to profile and mobile", () => {
  const desktopHigh = resolveArchiveBudget({ profile: "high", mobile: false });
  const desktopBalanced = resolveArchiveBudget({ profile: "balanced", mobile: false });
  const mobileLow = resolveArchiveBudget({ profile: "low", mobile: true });
  assert.ok(desktopHigh.particles > desktopBalanced.particles);
  assert.ok(desktopBalanced.particles > mobileLow.particles);
  assert.ok(desktopHigh.fragments > mobileLow.fragments);
  assert.ok(mobileLow.connections <= 6);
});

test("studio core is local, documented and inside runtime budget", () => {
  const path = "assets/3d/studio-core/studio-core.glb";
  assert.ok(existsSync(path), "missing local studio core GLB");
  assert.ok(statSync(path).size > 1024, "studio core is unexpectedly empty");
  assert.ok(statSync(path).size < 8 * 1024 * 1024, "studio core exceeds 8 MiB");
  const attribution = readFileSync("assets/3d/ATTRIBUTION.md", "utf8");
  assert.match(attribution, /studio core/i);
  assert.ok(existsSync("scripts/blender/build-studio-core.py"));
});

test("asset registry loads the studio core locally with finite fallback", () => {
  const registry = executableSource(readFileSync("src/home/scene/asset-registry.js", "utf8"));
  assert.match(registry, /studio-core\/studio-core\.glb/);
  assert.match(registry, /loadStudioCore/);
  assert.match(registry, /Promise\.race/);
  assert.match(registry, /return null/);
  assert.doesNotMatch(registry, /https?:\/\//i);
});

test("renderer drives semantic archive from the same reversible journey", () => {
  const renderer = readFileSync("src/home/scene/study-room-renderer.js", "utf8");
  const archive = readFileSync("src/home/scene/archive-field.js", "utf8");
  assert.match(renderer, /createArchiveField/);
  assert.match(renderer, /resolveArchivePhase/);
  assert.match(renderer, /archiveField\.update/);
  assert.match(renderer, /room\.setJourney\(journey\)/);
  assert.match(archive, /future-paths/);
  assert.match(archive, /THREE\.Points/);
  assert.match(archive, /THREE\.LineSegments/);
  assert.doesNotMatch(executableSource(archive), /https?:\/\//i);
});

test("existing final paths handoff remains the route owner", () => {
  const home = readFileSync("src/home/home-experience.js", "utf8");
  assert.match(home, /find\(item => item\.id === "future-paths"\)/);
  assert.match(home, /href:\s*"#\/paths"/);
  assert.match(home, /sharedTransition/);
});
