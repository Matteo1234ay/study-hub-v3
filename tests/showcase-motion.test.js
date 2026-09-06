import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three/three.module.min.js';
import {sampleShowcase, SHOWCASE_OBJECTS} from '../src/home/scene/showcase-motion.js';
import {createShowcaseGallery} from '../src/home/scene/showcase-gallery.js';

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

// Read conservative mesh bounds from the actual shipped GLB. This checks the
// real hierarchy and transforms offline; it does not claim pixel/render QA.
function loadBounds() {
  const bytes=readFileSync(new URL('../assets/3d/home-v30/study-hub-home-v30.glb',import.meta.url));
  const data=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  const nodes=data.nodes.map(def=>{
    const group=new THREE.Group();group.name=def.name ?? '';
    if(def.matrix) {new THREE.Matrix4().fromArray(def.matrix).decompose(group.position,group.quaternion,group.scale);}
    else {if(def.translation)group.position.fromArray(def.translation);if(def.rotation)group.quaternion.fromArray(def.rotation);if(def.scale)group.scale.fromArray(def.scale);}
    if(def.mesh!=null) for(const primitive of data.meshes[def.mesh].primitives) {
      const accessor=data.accessors[primitive.attributes.POSITION];
      const min=new THREE.Vector3(...accessor.min),max=new THREE.Vector3(...accessor.max);
      const size=max.clone().sub(min),center=min.clone().add(max).multiplyScalar(.5);
      const geometry=new THREE.BoxGeometry(size.x,size.y,size.z).translate(center.x,center.y,center.z);
      group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial()));
    }
    return group;
  });
  data.nodes.forEach((def,i)=>(def.children??[]).forEach(child=>nodes[i].add(nodes[child])));
  const root=new THREE.Group();data.scenes[data.scene??0].nodes.forEach(i=>root.add(nodes[i]));root.updateMatrixWorld(true);return root;
}
test('shipped object bounds stay inside desktop and phone frames and reverse exactly',()=>{
  const scene=new THREE.Scene(),source=loadBounds();scene.add(source);
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
});
