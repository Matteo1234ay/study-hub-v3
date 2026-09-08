import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import {particleDisplacement,createShowcaseParticles} from '../src/home/scene/showcase-particles.js';
test('particle drag slows lateral travel while gravity pulls it downward',()=>{
  const v=[1,0,0],p0=particleDisplacement(0,v),p1=particleDisplacement(1,v),p2=particleDisplacement(2,v);
  assert.deepEqual(p0,[0,0,0]);
  assert.ok(p1[0]>0 && p2[0]>p1[0]);
  assert.ok(p2[0]-p1[0]<p1[0]);
  assert.ok(p2[1]<p1[1] && p1[1]<0);
});
test('emission is bounded, reversible and absent for reduced motion and settled objects',()=>{
  const object=new THREE.Group(),geometry=new THREE.BoxGeometry(.3,.3,.3),mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());object.add(mesh);
  const part={mesh,position:mesh.position.clone(),quaternion:mesh.quaternion.clone(),side:1};
  const particles=createShowcaseParticles(THREE,[{object,parts:[part]}]);
  const points=object.getObjectByName('Disassembly_Dust');
  const read=()=>Array.from(points.geometry.attributes.position.array);
  particles.update({index:0,opening:.5},0,1);const first=read();
  assert.equal(points.geometry.attributes.position.count,48);
  assert.ok(Array.from(points.geometry.attributes.aOpacity.array).some(a=>a>0));
  particles.update({index:0,opening:.8},0,1);
  particles.update({index:0,opening:.5},0,1);assert.deepEqual(read(),first);
  particles.update({index:0,opening:0},0,1);assert.equal(points.visible,false);
  particles.update({index:0,opening:.5},0,0);assert.equal(points.visible,false);
  particles.update({index:0,opening:1},0,1);assert.ok(Array.from(points.geometry.attributes.aOpacity.array).every(a=>a===0));
  particles.dispose();assert.equal(object.getObjectByName('Disassembly_Dust'),undefined);
  geometry.dispose();mesh.material.dispose();
});
