import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const SCRIPT = "scripts/blender/build-home-v30.py";

function source() {
  assert.ok(existsSync(SCRIPT), "missing V30 Blender build script");
  return readFileSync(SCRIPT, "utf8");
}

test("V30 Blender build consumes only committed local CC0 sources", () => {
  const code = source();
  assert.match(code, /bpy\.ops\.import_scene\.gltf/);
  for (const local of [
    "desk-lamp-arm-01/desk_lamp_arm_01_1k.gltf",
    "home-v30/vendor/office_notepads/office_notepads_1k.gltf",
    "home-v30/vendor/stationery_supplies/stationery_supplies_1k.gltf",
    "home-v30/vendor/drawer_cabinet/drawer_cabinet_1k.gltf",
    "natural_walnut_veneer_diff_1k.jpg",
    "natural_walnut_veneer_nor_gl_1k.jpg",
    "natural_walnut_veneer_rough_1k.jpg",
    "white_plaster_02_diff_1k.jpg",
    "white_plaster_02_nor_gl_1k.jpg",
    "white_plaster_02_rough_1k.jpg",
    "poly_haven_studio_2k.hdr"
  ]) assert.match(code, new RegExp(local.replaceAll(".", "\\.")));
  assert.doesNotMatch(code, /https?:\/\//i);
});

test("V30 custom hero construction uses real pivots, curves and manufactured edge treatment", () => {
  const code = source();
  for (const name of [
    "V30_Root", "Desk_Root", "Drawer_Primary", "Drawer_Secondary", "Chair_Root", "Lamp_Root",
    "Cabinet_Root", "Cabinet_Door", "Monitor_Root", "Monitor_Screen_Anchor", "Paper_Stack", "Notebook_Root"
  ]) assert.match(code, new RegExp(name));
  assert.match(code, /(BEVEL|bevel)/);
  assert.match(code, /(SUBSURF|subdivision|bezier|curve)/i);
  assert.match(code, /(pivot|hinge|origin)/i);
  assert.match(code, /parent_keep_world|matrix_parent_inverse|parent\s*=/);
});

test("V30 material system uses local image textures and keeps blue restricted to information light", () => {
  const code = source();
  assert.match(code, /Walnut/i);
  assert.match(code, /Plaster/i);
  assert.match(code, /(Graphite|Aluminum|Metal)/i);
  assert.match(code, /Fabric/i);
  assert.match(code, /Paper/i);
  assert.match(code, /(Glass|Ceramic)/i);
  assert.match(code, /ShaderNodeTexImage/);
  assert.match(code, /ShaderNodeNormalMap/);
  assert.match(code, /Non-Color/);
  assert.match(code, /(StudyHub_Information|StudyHub_Screen|StudyHub_Accent)/i);
  assert.doesNotMatch(code, /(Blue_Wall|Blue_Floor|Blue_Fabric|Blue_Metal)/i);
});

test("V30 Blender actions match the runtime contract and are exported Y-up", () => {
  const code = source();
  for (const clip of [
    "Drawer_Primary_Open", "Drawer_Secondary_Open", "Cabinet_Door_Open", "Lamp_Adjust",
    "Chair_Shift", "Paper_Lift", "Notebook_Lift", "Monitor_Info_Reveal"
  ]) assert.match(code, new RegExp(clip));
  assert.match(code, /export_yup\s*=\s*True/);
  assert.match(code, /export_animations\s*=\s*True/);
  assert.match(code, /export_apply\s*=\s*True/);
});
