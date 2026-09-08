import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import {sampleParticleTimeline as sample,sampleParticleExit} from '../src/home/scene/particle-timeline.js';
import {sampleObjectSurface} from '../src/home/scene/particle-morph.js';
import {createSemanticObjects} from '../src/home/scene/semantic-objects.js';
import {createShowcaseGallery} from '../src/home/scene/showcase-gallery.js';

test('six integrated reading objects have one hold each and continuous particle boundaries',()=>{
  for(let index=0;index<6;index++){
    assert.equal(sample(index,.24).card,1);
    assert.equal(sample(index,.5).cloud,0);
    assert.equal(sample(index,.6).card,1);
    assert.equal(sample(index,.6).reveal,1);
    for(let j=0;j<=1000;j++){
      const state=sample(index,j/1000);
      assert.ok(Math.abs(state.object+state.card+state.cloud-1)<1e-12);
      for(const value of Object.values(state))assert.ok(value>=0 && value<=1);
      assert.equal(state.object,0,'no separate object-only animation');
    }
    if(index<5)assert.deepEqual(sample(index,1),sample(index+1,0));
  }
  assert.equal(sample(5,1).reveal,1);
});

test('final exit dissolves continuously into a full particle cloud',()=>{
  assert.deepEqual(sampleParticleExit(0),{object:0,card:1,cloud:0,mesh:1,reveal:1,particles:0});
  let previous=sampleParticleExit(0);
  for(let i=1;i<=1000;i++){
    const state=sampleParticleExit(i/1000);
    assert.ok(state.cloud>=previous.cloud && state.mesh<=previous.mesh && state.particles>=previous.particles);
    previous=state;
  }
  assert.deepEqual(sampleParticleExit(1),{object:0,card:0,cloud:1,mesh:0,reveal:0,particles:1});
});

test('particle samples lie on real surfaces and are reproducible for all objects',()=>{
  const models=createSemanticObjects(THREE),scene=new THREE.Scene();scene.add(models.root);
  const gallery=createShowcaseGallery({THREE,source:models.root,scene});
  for(const record of gallery.records){
    const a=sampleObjectSurface(THREE,record,120),b=sampleObjectSurface(THREE,record,120);
    assert.deepEqual(a,b);
    assert.ok(a.every(p=>p.position.toArray().every(Number.isFinite)));
    assert.ok(a.every(p=>p.position.length()<=.91));
    const box=new THREE.Box3().setFromPoints(a.map(p=>p.position));
    assert.ok(box.getSize(new THREE.Vector3()).z>.005);
  }
  gallery.dispose();models.dispose();
});
