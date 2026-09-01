import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const MANIFEST = "assets/3d/home-v30/manifest.json";
const VENDOR_SCRIPT = "scripts/home-v30/vendor-polyhaven.mjs";

const REQUIRED = Object.freeze({
  desk_lamp_arm_01: { kind: "model", authors: ["Kuutti Siitonen", "Yann Kervran"] },
  office_notepads: { kind: "model", authors: ["Ulan Cabanilla"] },
  stationery_supplies: { kind: "model", authors: ["Mateusz Sadek"] },
  drawer_cabinet: { kind: "model", authors: ["Ulan Cabanilla"] },
  poly_haven_studio: { kind: "hdri", authors: ["Greg Zaal"] },
  natural_walnut_veneer: { kind: "texture", authors: ["Jenelle van Heerden"] },
  white_plaster_02: { kind: "texture", authors: ["Rob Tuytel"] }
});

function loadManifest() {
  assert.ok(existsSync(MANIFEST), "missing V30 asset provenance manifest");
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

test("V30 manifest pins the approved CC0 Poly Haven asset set", () => {
  const manifest = loadManifest();
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.runtimeNetworkDependency, "none");
  assert.ok(Array.isArray(manifest.assets));
  assert.deepEqual(manifest.assets.map(asset => asset.id).sort(), Object.keys(REQUIRED).sort());

  for (const asset of manifest.assets) {
    const expected = REQUIRED[asset.id];
    assert.ok(expected, `unexpected V30 asset ${asset.id}`);
    assert.equal(asset.kind, expected.kind);
    assert.equal(asset.source.site, "Poly Haven");
    assert.equal(asset.source.page, `https://polyhaven.com/a/${asset.id}`);
    assert.equal(asset.license, "CC0 1.0 Universal");
    for (const author of expected.authors) assert.ok(asset.authors.includes(author), `${asset.id} missing ${author}`);
  }
});

test("every vendored V30 asset exists locally and matches its recorded SHA-256", () => {
  const manifest = loadManifest();
  for (const asset of manifest.assets) {
    assert.match(asset.local.root, /^assets\/3d\/(?:home-v30\/vendor|desk-lamp-arm-01)\//);
    assert.ok(Array.isArray(asset.local.files) && asset.local.files.length > 0, `${asset.id} needs local files`);
    for (const file of asset.local.files) {
      assert.match(file.path, /^assets\/3d\//);
      assert.ok(existsSync(file.path), `${asset.id} missing local file ${file.path}`);
      assert.match(file.sha256, /^[a-f0-9]{64}$/);
      assert.equal(sha256(file.path), file.sha256, `${asset.id} hash mismatch for ${file.path}`);
      assert.equal(readFileSync(file.path).byteLength, file.bytes, `${asset.id} byte count mismatch for ${file.path}`);
      assert.ok(file.bytes > 0);
    }
    assert.ok(Array.isArray(asset.transformations) && asset.transformations.length > 0, `${asset.id} needs optimization notes`);
  }
});

test("the development vendor is bounded, identifies itself and never needs credentials", () => {
  assert.ok(existsSync(VENDOR_SCRIPT), "missing Poly Haven vendor script");
  const source = readFileSync(VENDOR_SCRIPT, "utf8");
  assert.match(source, /StudyHubV30-AssetVendor\/1\.0/);
  assert.match(source, /https:\/\/api\.polyhaven\.com\/assets/);
  assert.match(source, /https:\/\/api\.polyhaven\.com\/files\//);
  assert.match(source, /createHash\(["']sha256["']\)/);
  assert.match(source, /assets\/3d\/home-v30\/vendor/);
  assert.match(source, /api\.polyhaven\.com/);
  assert.match(source, /dl\.polyhaven\.org/);
  assert.doesNotMatch(source, /(authorization|bearer|api[_-]?key|token)\s*[:=]/i);
});

test("V30 provenance explicitly documents that production never calls Poly Haven", () => {
  const attribution = readFileSync("assets/3d/ATTRIBUTION.md", "utf8");
  assert.match(attribution, /Study Hub Home V30/i);
  assert.match(attribution, /CC0/i);
  assert.match(attribution, /production network dependency:\s*none/i);
  assert.match(attribution, /manifest\.json/i);
});
