import {snapshotCard} from './card-snapshot.js?v=20260908-40';

const random=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453123;return n-Math.floor(n);};

export function sampleObjectSurface(THREE,record,count) {
  const triangles=[];
  let area=0;
  const a=new THREE.Vector3(),b=a.clone(),c=a.clone(),ab=a.clone(),ac=a.clone();
  for(const part of record.parts){
    const mesh=part.mesh;mesh.updateMatrix();
    const positions=mesh.geometry.attributes.position,indices=mesh.geometry.index;
    const length=indices?indices.count:positions.count;
    for(let i=0;i<length;i+=3){
      a.fromBufferAttribute(positions,indices?indices.getX(i):i).applyMatrix4(mesh.matrix);
      b.fromBufferAttribute(positions,indices?indices.getX(i+1):i+1).applyMatrix4(mesh.matrix);
      c.fromBufferAttribute(positions,indices?indices.getX(i+2):i+2).applyMatrix4(mesh.matrix);
      const weight=ab.subVectors(b,a).cross(ac.subVectors(c,a)).length()*.5;
      if(weight<1e-12)continue;
      area+=weight;
      triangles.push({a:a.clone(),b:b.clone(),c:c.clone(),area,color:part.materials[0].color});
    }
  }
  if(!triangles.length)throw new Error('Superficie particellare vuota');
  return Array.from({length:count},(_,i)=>{
    const target=random(i+1)*area;
    let lo=0,hi=triangles.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid].area<target)lo=mid+1;else hi=mid;}
    const triangle=triangles[lo],u=Math.sqrt(random(i+count+1)),v=random(i+count*2+1);
    const position=triangle.a.clone().multiplyScalar(1-u).addScaledVector(triangle.b,u*(1-v)).addScaledVector(triangle.c,u*v);
    return {position,color:triangle.color.clone()};
  });
}

export function createParticleMorph({THREE,records,scene,camera,canvas}) {
  const count=matchMedia('(max-width: 760px)').matches?2800:5600;
  const surfaces=records.map(record=>sampleObjectSurface(THREE,record,count));
  const root=canvas.closest('.home-journey');
  const captions=records.map(record=>root?.querySelector(`.home-station-caption[data-station-id="${record.id}"]`));
  const snapshots=new Map();
  const geometry=new THREE.PlaneGeometry(1,1);
  const cells=new Float32Array(count*4);
  const colors=new Float32Array(count*3);
  geometry.setAttribute('cell',new THREE.InstancedBufferAttribute(cells,4));
  geometry.setAttribute('surfaceColor',new THREE.InstancedBufferAttribute(colors,3));
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
    uniforms:{map:{value:null},card:{value:0},alpha:{value:0},cloud:{value:0}},
    vertexShader:`attribute vec4 cell; attribute vec3 surfaceColor;
      varying vec2 tileUV; varying vec2 localUV; varying vec3 tint;varying float face;
      void main(){localUV=uv;tileUV=cell.xy+uv*cell.zw;tint=surfaceColor;face=step(.0001,cell.z);
        gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map;uniform float card;uniform float cloud;uniform float alpha;
      varying vec2 tileUV;varying vec2 localUV;varying vec3 tint;varying float face;
      void main(){float disc=1.-smoothstep(.36,.5,length(localUV-.5));
        vec3 dust=mix(tint,vec3(.73,.51,.36),cloud);
        gl_FragColor=vec4(mix(dust,texture2D(map,tileUV).rgb,card*face),alpha*mix(disc,1.,card*face));
        #include <colorspace_fragment>
      }`
  });
  const field=new THREE.InstancedMesh(geometry,material,count);
  field.name='StudyHub_Continuous_Particles';field.frustumCulled=false;
  field.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  field.renderOrder=2;
  scene.add(field);
  const dummy=new THREE.Object3D(),surface=new THREE.Vector3(),cloud=new THREE.Vector3(),target=new THREE.Vector3();
  const topLeft=new THREE.Vector3(),right=new THREE.Vector3(),down=new THREE.Vector3(),depth=new THREE.Vector3();
  let currentIndex=-1;
  function invalidate(){snapshots.forEach(value=>value.texture.dispose());snapshots.clear();currentIndex=-1;}
  function update(shot,exitProgress,seconds=0,surfaceFrame=null) {
    const morph=shot.morph,caption=captions[shot.index];
    field.visible=morph.particles>.001 && exitProgress<1;
    if(!field.visible || !caption || root.dataset.homeState!=='ready')return;
    let snapshot=snapshots.get(shot.index);
    if(snapshot && snapshot.scrollTop!==caption.scrollTop){
      snapshot.texture.dispose();snapshots.delete(shot.index);snapshot=null;currentIndex=-1;
    }
    if(!snapshot){
      const image=snapshotCard(caption);
      if(!image){field.visible=false;return;}
      const texture=new THREE.CanvasTexture(image);texture.colorSpace=THREE.SRGBColorSpace;
      snapshot={texture,scrollTop:caption.scrollTop};snapshots.set(shot.index,snapshot);
    }
    const rect=caption.getBoundingClientRect(),viewport=canvas.getBoundingClientRect();
    // Fixed particle identities survive every station boundary.
    const columns=count===2800?50:70;
    const activeCount=count,gridRows=count===2800?44:64;
    const faceCount=columns*gridRows;
    field.count=activeCount;
    if(currentIndex!==shot.index){
      material.uniforms.map.value=snapshot.texture;
      for(let i=0;i<activeCount;i++){
        cells.set(i<faceCount?[(i%columns)/columns,1-(Math.floor(i/columns)+1)/gridRows,1/columns,1/gridRows]:[0,0,0,0],i*4);
        surfaces[shot.index][i].color.toArray(colors,i*3);
      }
      geometry.attributes.cell.needsUpdate=true;geometry.attributes.surfaceColor.needsUpdate=true;
      currentIndex=shot.index;
    }
    camera.updateMatrixWorld(true);
    depth.set(...shot.target).project(camera);
    const project=(x,y,out)=>out.set((x-viewport.left)/viewport.width*2-1,1-(y-viewport.top)/viewport.height*2,depth.z).unproject(camera);
    if(surfaceFrame){
      topLeft.copy(surfaceFrame.corners[0]);
      right.copy(surfaceFrame.corners[1]).sub(topLeft);
      down.copy(surfaceFrame.corners[3]).sub(topLeft);
    }else{
      project(rect.left,rect.top,topLeft);
      project(rect.right,rect.top,right).sub(topLeft);
      project(rect.left,rect.bottom,down).sub(topLeft);
    }
    const tileWidth=right.length()/columns,tileHeight=down.length()/gridRows;
    const cloudFloat=Math.sin(seconds*.31)*.028;
    for(let i=0;i<activeCount;i++){
      surface.copy(surfaces[shot.index][i].position).applyMatrix4(records[shot.index].object.matrixWorld);
      const angle=random(i+50000)*Math.PI*2;
      const radius=.35+Math.sqrt(random(i+60000))*1.25;
      cloud.set(shot.target[0]+Math.cos(angle)*radius,shot.target[1]+Math.sin(angle)*radius*.72+cloudFloat,shot.target[2]+(random(i+70000)-.5)*1.8);
      if(i<faceCount)target.copy(topLeft).addScaledVector(right,((i%columns)+.5)/columns).addScaledVector(down,(Math.floor(i/columns)+.5)/gridRows);
      else target.copy(surface);
      dummy.position.copy(surface).multiplyScalar(morph.object).addScaledVector(cloud,morph.cloud).addScaledVector(target,morph.card);
      // A smooth curved flight, vanishing at both endpoints. No teleport or
      // non-deterministic velocities when the scroll direction changes.
      const arc=Math.sin(Math.PI*morph.cloud)*.13;
      dummy.position.y+=arc*Math.sin(angle);
      dummy.position.z+=arc*Math.cos(angle);
      dummy.quaternion.copy(camera.quaternion);
      if(surfaceFrame && i<faceCount)dummy.quaternion.slerp(surfaceFrame.quaternion,morph.card);
      const dust=.008+random(i+80000)*.009;
      const coverage=i<faceCount?morph.card:0;
      dummy.scale.set(dust*(1-coverage)+tileWidth*1.003*coverage,dust*(1-coverage)+tileHeight*1.003*coverage,1);
      dummy.updateMatrix();field.setMatrixAt(i,dummy.matrix);
    }
    material.uniforms.card.value=morph.card;
    material.uniforms.cloud.value=morph.cloud;
    material.uniforms.alpha.value=morph.particles*(1-exitProgress);
    field.instanceMatrix.needsUpdate=true;
  }
  return {update,invalidate,dispose(){invalidate();scene.remove(field);geometry.dispose();material.dispose();}};
}
