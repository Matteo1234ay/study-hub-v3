// Map live DOM text onto the exact plane used by the solid and particle field.
export function quadMatrix(points,width,height) {
  const [p0,p1,p2,p3]=points;
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const divisor=dx1*dy2-dx2*dy1;
  const g=Math.abs(divisor)>1e-10?(dx3*dy2-dx2*dy3)/divisor:0;
  const h=Math.abs(divisor)>1e-10?(dx1*dy3-dx3*dy1)/divisor:0;
  return [(p1.x-p0.x+g*p1.x)/width,(p1.y-p0.y+g*p1.y)/width,0,g/width,
    (p3.x-p0.x+h*p3.x)/height,(p3.y-p0.y+h*p3.y)/height,0,h/height,
    0,0,1,0,p0.x,p0.y,0,1];
}
export function sectionFrame(THREE,record,camera,canvas,caption) {
  const viewport=canvas.getBoundingClientRect(),parent=caption.parentElement.getBoundingClientRect();
  const width=caption.offsetWidth,height=caption.offsetHeight;
  const radius=camera.position.distanceTo(new THREE.Vector3(...record.target));
  const viewHeight=2*radius*Math.tan(camera.fov*Math.PI/360);
  record.object.scale.set(viewHeight*camera.aspect*width/viewport.width,viewHeight*height/viewport.height,viewHeight*camera.aspect*width/viewport.width);
  record.object.position.y+=(.5-(parent.top-viewport.top)/viewport.height)*viewHeight;
  // Reserve the top of the composition for the original semantic illustration.
  // Compensate for the text plane's aspect ratio so models keep their shape.
  const mobile=width<=480;
  const imageHeight=Math.min(mobile?190:156,height*(mobile?.42:.33));
  const desiredWidth=Math.min(width*(mobile?.88:.7),imageHeight*(mobile?1.35:.9));
  const size=desiredWidth/1.8/width;
  const imagePosition=new THREE.Vector3(0,.5-imageHeight/height/2,0);
  const imageScale=new THREE.Vector3(size,size*width/height,size);
  record.imageMatrix??=new THREE.Matrix4();
  record.imageMatrix.compose(imagePosition,new THREE.Quaternion(),imageScale);
  if(!record.imageGroup){
    record.imageGroup=new THREE.Group();record.imageGroup.matrixAutoUpdate=false;
    record.object.add(record.imageGroup);
    for(const part of record.parts)record.imageGroup.add(part.mesh);
  }
  record.imageGroup.matrix.copy(record.imageMatrix);
  record.object.updateMatrixWorld(true);
  const corners=[[-.5,.5,.02],[.5,.5,.02],[.5,-.5,.02],[-.5,-.5,.02]].map(p=>new THREE.Vector3(...p).applyMatrix4(record.object.matrixWorld));
  const points=corners.map(p=>{const q=p.clone().project(camera);return {x:viewport.left+(q.x+1)*viewport.width/2-parent.left,y:viewport.top+(1-q.y)*viewport.height/2-parent.top};});
  return {corners,quaternion:record.object.quaternion,transform:`matrix3d(${quadMatrix(points,width,height).join(',')})`};
}
