import test from 'node:test';
import assert from 'node:assert/strict';
import {createPointerCamera} from '../src/home/scene/pointer-camera.js';
import * as THREE from '../vendor/three/three.module.min.js';
import {createSemanticObjects} from '../src/home/scene/semantic-objects.js';
import {createShowcaseGallery} from '../src/home/scene/showcase-gallery.js';
import {sampleShowcase} from '../src/home/scene/showcase-motion.js';

test('mouse orbit changes perspective at rest without zoom or frame-rate dependence',()=>{
  const run=hz=>{const orbit=createPointerCamera();orbit.setTarget(1,.5);let p;for(let i=0;i<hz;i++)p=orbit.sample([0,0,5],[0,0,0],1/hz);return p;};
  const a=run(60),b=run(120);
  assert.ok(a[0]>1 && a[1]>.25);assert.ok(Math.abs(Math.hypot(...a)-5)<1e-10);
  assert.ok(a.every((value,index)=>Math.abs(value-b[index])<1e-10));
});
test('pointer limits and neutral return keep the camera controlled',()=>{
  const orbit=createPointerCamera();orbit.setTarget(50,-50);
  const p=orbit.sample([0,0,5],[0,0,0],1);
  assert.ok(Math.abs(p[0])<1.1 && Math.abs(p[1])<.56);
  orbit.reset();let returned;for(let i=0;i<180;i++)returned=orbit.sample([0,0,5],[0,0,0],1/60);
  assert.ok(Math.abs(returned[0])<1e-5);
  assert.deepEqual(orbit.sample([0,0,5],[0,0,0],1/60,0),[0,0,5]);
});
test('surface dissolution uses depth-writing coverage rather than transparent duplicates',()=>{
  const scene=new THREE.Scene(),models=createSemanticObjects(THREE);scene.add(models.root);
  const gallery=createShowcaseGallery({THREE,source:models.root,scene});
  gallery.update(sampleShowcase(.7/6),0,{seconds:1,motion:1});
  const object=scene.getObjectByName('StudyHub_Object_Showcase').children[0];
  const depths=[];object.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const material of materials){assert.equal(material.transparent,true);assert.ok(material.opacity>0 && material.opacity<1);assert.equal(material.alphaHash,false);assert.equal(material.depthWrite,true);}
    depths.push(mesh.position.z);
  });
  assert.ok(Math.max(...depths)-Math.min(...depths)>0);
  gallery.dispose();models.dispose();
});
