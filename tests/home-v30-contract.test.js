import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const EXPECTED_NODES = [
  "V30_Root",
  "Desk_Root",
  "Drawer_Primary",
  "Drawer_Secondary",
  "Chair_Root",
  "Lamp_Root",
  "Cabinet_Root",
  "Cabinet_Door",
  "Monitor_Root",
  "Monitor_Screen_Anchor",
  "Paper_Stack",
  "Notebook_Root",
  "ArchiveOrigin_Paths",
  "ArchiveOrigin_Review",
  "ArchiveOrigin_Progress",
  "ArchiveOrigin_Assessment",
  "ArchiveOrigin_Search"
];

const EXPECTED_CLIPS = [
  "Drawer_Primary_Open",
  "Drawer_Secondary_Open",
  "Cabinet_Door_Open",
  "Lamp_Adjust",
  "Chair_Shift",
  "Paper_Lift",
  "Notebook_Lift",
  "Monitor_Info_Reveal"
];

const EXPECTED_ORIGINS = {
  "future-paths": "ArchiveOrigin_Paths",
  memory: "ArchiveOrigin_Review",
  progress: "ArchiveOrigin_Progress",
  assessment: "ArchiveOrigin_Assessment",
  search: "ArchiveOrigin_Search"
};

test("V30 contract exposes the stable scene identity, nodes and clips", async () => {
  const contract = await import("../src/home/scene/home-v30-contract.js");
  assert.equal(contract.HOME_V30_ASSET_ID, "study-hub-home-v30");
  assert.deepEqual(contract.HOME_V30_NODES, EXPECTED_NODES);
  assert.deepEqual(contract.HOME_V30_CLIPS, EXPECTED_CLIPS);
  assert.equal(new Set(contract.HOME_V30_NODES).size, contract.HOME_V30_NODES.length);
  assert.equal(new Set(contract.HOME_V30_CLIPS).size, contract.HOME_V30_CLIPS.length);
});

test("V30 animation windows are complete, finite and monotonic", async () => {
  const { HOME_V30_CLIPS, HOME_V30_WINDOWS } = await import("../src/home/scene/home-v30-contract.js");
  assert.deepEqual(Object.keys(HOME_V30_WINDOWS).sort(), [...HOME_V30_CLIPS].sort());
  for (const clip of HOME_V30_CLIPS) {
    const window = HOME_V30_WINDOWS[clip];
    assert.ok(Object.isFrozen(window), `${clip} window must be immutable`);
    assert.equal(window.length, 2, `${clip} must expose [start, end]`);
    const [start, end] = window;
    assert.ok(Number.isFinite(start) && Number.isFinite(end), `${clip} window must be finite`);
    assert.ok(start >= 0 && end <= 1, `${clip} window must stay inside normalized progress`);
    assert.ok(start < end, `${clip} window must move forward`);
  }
});

test("V30 archive origins map every semantic destination to a required node", async () => {
  const { HOME_V30_ARCHIVE_ORIGINS, HOME_V30_NODES } = await import("../src/home/scene/home-v30-contract.js");
  assert.deepEqual(HOME_V30_ARCHIVE_ORIGINS, EXPECTED_ORIGINS);
  for (const node of Object.values(HOME_V30_ARCHIVE_ORIGINS)) {
    assert.ok(HOME_V30_NODES.includes(node), `archive origin ${node} must exist in HOME_V30_NODES`);
  }
});

test("V30 contract does not prematurely embed the public release token", async () => {
  const source = await readFile(new URL("../src/home/scene/home-v30-contract.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /20260901-30/);
  assert.doesNotMatch(source, /HOME_V30_RELEASE/);
});
