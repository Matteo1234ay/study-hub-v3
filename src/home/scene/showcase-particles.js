// Analytic linear drag + gravity, sampled from scroll for exact reversibility.
export function particleDisplacement(age, velocity, drag = 1.8, gravity = .09) {
  const time=Math.max(0,age),response=-Math.expm1(-drag*time)/drag;
  return [velocity[0]*response,velocity[1]*response-gravity/drag*(time-response),velocity[2]*response];
}
export function createShowcaseParticles(THREE, records) {
  const systems=records.map((record,index)=>{
    const count=48,positions=new Float32Array(count*3),alphas=new Float32Array(count);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('aOpacity',new THREE.BufferAttribute(alphas,1));
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
      vertexShader:`attribute float aOpacity;varying float vOpacity;void main(){vOpacity=aOpacity;vec4 view=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*view;gl_PointSize=clamp(22.0/max(.1,-view.z),1.0,3.0);}`,
      fragmentShader:`varying float vOpacity;void main(){float r=length(gl_PointCoord-vec2(.5));float alpha=(1.0-smoothstep(.2,.5,r))*vOpacity;if(alpha<.005)discard;gl_FragColor=vec4(.92,.8,.63,alpha);}`});
    const points=new THREE.Points(geometry,material);points.name='Disassembly_Dust';points.frustumCulled=false;
    record.object.add(points);
    const seeds=Array.from({length:count},(_,i)=>{
      const part=record.parts[i%record.parts.length],angle=i*2.39996323+index*.7;
      part.mesh.geometry.computeBoundingBox();
      const box=part.mesh.geometry.boundingBox,local=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
      local.x+=Math.sin(angle)*size.x*.4;local.y+=Math.cos(angle)*size.y*.4;local.z=box.max.z;
      local.multiply(part.mesh.scale).applyQuaternion(part.quaternion).add(part.position);
      const birth=.04+(i%12)*.035;
      const t=Math.max(0,Math.min(1,(birth-((i%record.parts.length)%4)*.035)/.895));
      const travel=t*t*t*(t*(t*6-15)+10);
      if(part.drift)local.addScaledVector(part.drift,travel);
      local.y+=Math.sin(Math.PI*travel)*.12;
      return {origin:local.toArray(),birth,velocity:[part.side*(.2+.06*Math.sin(angle)),.12+.1*Math.cos(angle),.025*Math.sin(angle*.7)]};
    });
    return {points,geometry,material,positions,alphas,seeds};
  });
  return {
    update(shot,exit,motion){systems.forEach((system,index)=>{
      system.points.visible=motion>0 && index===shot.index && shot.opening>0 && exit<1;
      if(!system.points.visible)return;
      const clock=shot.opening*2.5,fade=Math.min(1,Math.max(0,(1-shot.opening)/.2));
      system.seeds.forEach((seed,i)=>{
        const age=clock-seed.birth*2.5,delta=particleDisplacement(Math.max(0,age),seed.velocity);
        for(let axis=0;axis<3;axis++)system.positions[i*3+axis]=seed.origin[axis]+delta[axis];
        system.alphas[i]=age<=0 ? 0 : Math.min(1,age/.18)*Math.exp(-age*.8)*fade*(1-exit)*.55;
      });
      system.geometry.attributes.position.needsUpdate=true;system.geometry.attributes.aOpacity.needsUpdate=true;
    });},
    dispose(){systems.forEach(system=>{system.points.removeFromParent();system.geometry.dispose();system.material.dispose();});}
  };
}
