import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/three.module.min.js';
import {quadMatrix,sectionFrame} from '../src/home/scene/section-projection.js';
import {createSemanticObjects as createSectionObjects} from '../src/home/scene/semantic-objects.js';
import {createShowcaseGallery} from '../src/home/scene/showcase-gallery.js';
import {sampleShowcase} from '../src/home/scene/showcase-motion.js';

test('projected live text aligns with all four 3D corners at desktop and mobile sizes',()=>{
  const models=createSectionObjects(THREE),scene=new THREE.Scene();scene.add(models.root);
  const gallery=createShowcaseGallery({THREE,source:models.root,scene});
  for(const [vw,vh,w,h] of [[1440,900,560,430],[390,844,310,480],[320,640,240,380]]){
    const camera=new THREE.PerspectiveCamera(36,vw/vh,.1,100);
    for(let i=0;i<6;i++)for(const yaw of [-.22,0,.22]){
      const shot=sampleShowcase((i+.5)/6,vw/vh),record=gallery.records[i];
      gallery.update(shot,0,{seconds:3,motion:1});record.target=shot.target;
      camera.position.set(...shot.position);camera.position.x+=Math.sin(yaw)*2;camera.lookAt(...shot.target);camera.updateMatrixWorld(true);
      const parent={left:(vw-w)/2,top:vh*.46};
      const frame=sectionFrame(THREE,record,camera,{getBoundingClientRect:()=>({left:0,top:0,width:vw,height:vh})},{offsetWidth:w,offsetHeight:h,getBoundingClientRect:()=>({left:parent.left,top:parent.top,width:w,height:h,right:parent.left+w,bottom:parent.top+h}),parentElement:{getBoundingClientRect:()=>parent}});
      if(vw<=760){
        const projected=record.object.position.clone().project(camera);
        assert.ok(Math.abs((1-projected.y)/2-(vh<700?.29:.31))<.01,'mobile illustration has its own upper zone');
        assert.ok(Math.abs(record.object.scale.x-record.object.scale.y)<1e-12,'mobile illustration stays proportional');
      }else{
        const imageScale=record.imageGroup.matrixWorld.getMaxScaleOnAxis();
        const axes=[0,1,2].map(axis=>new THREE.Vector3().setFromMatrixColumn(record.imageGroup.matrixWorld,axis).length());
        assert.ok(axes.every(value=>Math.abs(value-imageScale)<1e-10),'illustration proportions stay undistorted');
      }
      const points=frame.corners.map(v=>{const p=v.clone().project(camera);return {x:(p.x+1)*vw/2-parent.left,y:(1-p.y)*vh/2-parent.top};});
      const m=quadMatrix(points,w,h);
      [[0,0],[w,0],[w,h],[0,h]].forEach(([x,y],index)=>{
        const denominator=m[3]*x+m[7]*y+m[15];
        assert.ok(Math.abs((m[0]*x+m[4]*y+m[12])/denominator-points[index].x)<1e-7);
        assert.ok(Math.abs((m[1]*x+m[5]*y+m[13])/denominator-points[index].y)<1e-7);
        assert.ok(points[index].x+parent.left>0 && points[index].x+parent.left<vw,'reading surface stays inside screen');
      });
    }
  }
  gallery.dispose();models.dispose();
});
