import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import {sampleShowcase, SHOWCASE_OBJECTS} from '../src/home/scene/showcase-motion.js';
import {createShowcaseGallery} from '../src/home/scene/showcase-gallery.js';
import {createSemanticObjects} from '../src/home/scene/semantic-objects.js';

test('all six stops frame before opening and reveal only after opening starts',()=>{
  for(let i=0;i<6;i++) {
    const approach=sampleShowcase((i+.24)/6);
    assert.equal(approach.stationId,SHOWCASE_OBJECTS[i][0]);
    assert.equal(approach.opening,0);
    assert.equal(approach.reveal,0);
    const read=sampleShowcase((i+.73)/6);
    assert.equal(read.opening,1);assert.equal(read.reveal,1);assert.equal(read.phase,'read');
  }
});
test('camera position and target are continuous across all station boundaries',()=>{
  for(const aspect of [.46,.75,1,1.8,2.4]) for(let i=1;i<6;i++) {
    const before=sampleShowcase(i/6-1e-7,aspect), after=sampleShowcase(i/6+1e-7,aspect);
    for(const key of ['position','target']) assert.ok(new THREE.Vector3(...before[key]).distanceTo(new THREE.Vector3(...after[key]))<1e-4);
  }
});

// Check the actual new solid geometry and hierarchy without a WebGL context.
test('semantic object bounds stay inside desktop and phone frames and reverse exactly',()=>{
  const scene=new THREE.Scene(),models=createSemanticObjects(THREE),source=models.root;scene.add(source);
  const gallery=createShowcaseGallery({THREE,source,scene});
  assert.equal(gallery.audit().length,6);assert.ok(gallery.audit().every(item=>item.parts>0));
  const stage=scene.getObjectByName('StudyHub_Object_Showcase');
  for(const aspect of [.46,.75,1,1.8,2.4]) for(let index=0;index<6;index++) {
    const shot=sampleShowcase((index+.24)/6,aspect);gallery.update(shot);
    const camera=new THREE.PerspectiveCamera(shot.fov,aspect,.1,100);camera.position.set(...shot.position);camera.lookAt(...shot.target);camera.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(stage.children[index]);
    for(const x of [box.min.x,box.max.x]) for(const y of [box.min.y,box.max.y]) for(const z of [box.min.z,box.max.z]) {
      const projected=new THREE.Vector3(x,y,z).project(camera);
      assert.ok(Math.abs(projected.x)<.94 && Math.abs(projected.y)<.94,`${index} clips at aspect ${aspect}`);
    }
    const positions=stage.children[index].children.map(mesh=>mesh.position.toArray());
    gallery.update(sampleShowcase((index+.72)/6,aspect));gallery.update(shot);
    assert.deepEqual(stage.children[index].children.map(mesh=>mesh.position.toArray()),positions);
  }
  gallery.dispose();
  models.dispose();
});

test('semantic objects float over time, stay bounded and do not drift between repeated samples',()=>{
  const scene=new THREE.Scene(),models=createSemanticObjects(THREE);scene.add(models.root);
  const gallery=createShowcaseGallery({THREE,source:models.root,scene});
  const stage=scene.getObjectByName('StudyHub_Object_Showcase');
  for(let index=0;index<6;index++) {
    const shot=sampleShowcase((index+.24)/6);
    gallery.update(shot,0,{seconds:1,motion:1});
    const initial=stage.children[index].matrixWorld.clone();
    gallery.update(shot,0,{seconds:4,motion:1});
    assert.notDeepEqual(stage.children[index].matrixWorld.elements,initial.elements);
    assert.ok(Math.abs(stage.children[index].position.y)<=.05);
    gallery.update(shot,0,{seconds:1,motion:1});
    assert.deepEqual(stage.children[index].matrixWorld.elements,initial.elements);
    gallery.update(shot,0,{seconds:4,motion:0});
    assert.equal(Math.abs(stage.children[index].position.y),0);
  }
  gallery.dispose();models.dispose();
});
