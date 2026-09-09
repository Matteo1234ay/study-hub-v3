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
  const viewport=canvas.getBoundingClientRect();
  const radius=camera.position.distanceTo(new THREE.Vector3(...record.target));
  const viewHeight=2*radius*Math.tan(camera.fov*Math.PI/360);
  {
    if(record.imageGroup){
      for(const part of record.parts)record.object.add(part.mesh);
      record.object.remove(record.imageGroup);record.imageGroup=null;
    }
    record.imageMatrix=null;
    const depth=new THREE.Vector3(...record.target).project(camera).z;
    const mobile=viewport.width<=760;
    const desiredPixels=mobile?Math.min(190,viewport.width*.48):Math.min(400,viewport.width*.29,viewport.height*.52);
    const uniform=viewHeight*desiredPixels/viewport.height/1.8;
    record.object.scale.setScalar(uniform);
    const screenY=mobile?(viewport.height<700?.29:.31):.48;
    record.object.position.set(mobile?0:.44,1-screenY*2,depth).unproject(camera);
    record.object.updateMatrixWorld(true);
    const captionRect=caption.getBoundingClientRect();
    const unproject=(x,y)=>new THREE.Vector3((x-viewport.left)/viewport.width*2-1,1-(y-viewport.top)/viewport.height*2,depth).unproject(camera);
    const corners=[unproject(captionRect.left,captionRect.top),unproject(captionRect.right,captionRect.top),unproject(captionRect.right,captionRect.bottom),unproject(captionRect.left,captionRect.bottom)];
    return {corners,quaternion:camera.quaternion.clone(),transform:'none'};
  }
}
