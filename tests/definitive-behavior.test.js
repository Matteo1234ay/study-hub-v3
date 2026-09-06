import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../src/router.js';
import { resolveHomeMotionMode } from '../src/home/home-experience.js';
test('reduced motion avoids the cinematic scroll and WebGL download', () => {
  assert.equal(resolveHomeMotionMode({webgl:true, preference:'reduced',mediaReduced:false}), 'dom');
  assert.equal(resolveHomeMotionMode({webgl:true, preference:'system',mediaReduced:true}), 'dom');
});
test('notes and settings have direct usable routes', () => {
  assert.equal(parseRoute('#/notes').name, 'notes');
  assert.equal(parseRoute('#/settings').name, 'settings');
});
import * as THREE from '../vendor/three/three.module.min.js';
import { createHomeV30Dematerialization } from '../src/home/scene/home-v30-dematerialization.js';
test('actual Blender nodes separate reversibly without cumulative drift', () => {
  const root=new THREE.Group(); const desk=new THREE.Group();desk.name='Desk_Root';root.add(desk);
  const notebook=new THREE.Group();notebook.name='Notebook_Root';root.add(notebook);
  const motion=createHomeV30Dematerialization({THREE,root});
  motion.update(0);assert.equal(desk.position.length(),0);
  motion.update(.8);assert.ok(desk.position.length()>1);
  const first=desk.position.clone();motion.update(.8);assert.ok(desk.position.distanceTo(first)<1e-9);
  motion.update(0);assert.equal(desk.position.length(),0);
});
import { createNotesStore } from '../src/study/notes-store.js';
test('notes save even when randomUUID is unavailable in a browser', () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{}});
  const data=new Map(); const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),get length(){return data.size;},key:i=>[...data.keys()][i]};
  try{const store=createNotesStore(storage);store.upsert({lessonId:'SMM-01',chapterId:'c1',text:'Un appunto'});assert.equal(store.list({lessonId:'SMM-01'}).length,1);}
  finally{Object.defineProperty(globalThis,'crypto',original);}
});
