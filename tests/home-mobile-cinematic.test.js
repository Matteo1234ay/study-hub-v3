import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as THREE from "../vendor/three/three.module.min.js";
import { createRoomMaterials } from "../src/home/scene/materials.js";
import { buildStudyRoom } from "../src/home/scene/build-room.js";

const readProjectFile = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("mobile ready mode is a full-screen cinematic journey without duplicate navigation chrome", async () => {
  const css = await readProjectFile("styles/home-immersive.css");

  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*\.home-journey\[data-home-state="ready"\]\s*\{[^}]*min-height:\s*1280svh/s);
  assert.match(css, /body\[data-home-immersive="true"\]\s+\.site-header,[\s\S]*body\[data-home-immersive="true"\]\s+\.site-footer\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.home-journey\[data-home-state="ready"\][\s\S]*\.home-quick-actions\s*\{[^}]*display:\s*none/s);
});

test("scroll progress visibly animates study objects instead of moving only the camera", () => {
  const room = buildStudyRoom({ THREE, materials: createRoomMaterials(THREE) });
  const deskScreen = room.stations.desk.screen;
  const reviewCard = room.group.getObjectByName("review-card-1");
  const socialScreen = room.stations.social.screen;
  const assessmentScreen = room.stations.assessment.screen;
  const progressScreen = room.stations.progress.screen;

  room.setJourney(0);
  assert.ok(deskScreen.scale.y < .15, `desk screen starts already open: ${deskScreen.scale.y}`);
  room.setJourney(.06);
  assert.ok(deskScreen.scale.y > .95, `desk screen did not boot: ${deskScreen.scale.y}`);

  room.setJourney(.14);
  assert.ok(reviewCard.scale.x < .9, `review card starts already revealed: ${reviewCard.scale.x}`);
  room.setJourney(.28);
  assert.ok(reviewCard.scale.x > .98, `review card did not settle: ${reviewCard.scale.x}`);

  room.setJourney(.34);
  assert.ok(socialScreen.scale.y < .2, `social display starts already open: ${socialScreen.scale.y}`);
  room.setJourney(.49);
  assert.ok(socialScreen.scale.y > .95, `social display did not reveal: ${socialScreen.scale.y}`);

  room.setJourney(.50);
  assert.ok(assessmentScreen.scale.y < .2, `assessment starts already open: ${assessmentScreen.scale.y}`);
  room.setJourney(.66);
  assert.ok(assessmentScreen.scale.y > .95, `assessment did not reveal: ${assessmentScreen.scale.y}`);

  room.setJourney(.67);
  assert.ok(progressScreen.scale.x < .2, `progress display starts already open: ${progressScreen.scale.x}`);
  room.setJourney(.83);
  assert.ok(progressScreen.scale.x > .95, `progress display did not reveal: ${progressScreen.scale.x}`);

  room.dispose();
});
