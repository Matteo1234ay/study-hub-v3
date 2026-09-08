// The central unit rectangle is reserved for live, readable section content.
// Binding, page edges, graph columns and hardware sit outside that rectangle.
export function createSectionObjects(THREE) {
  const root=new THREE.Group(),geometries=new Set(),materials=new Set();
  const finish=color=>{const m=new THREE.MeshPhysicalMaterial({color,roughness:.4,metalness:color==='#c58a5a'?.7:.05});materials.add(m);return m;};
  const paper=finish('#fafaf9'),ink=finish('#241342'),copper=finish('#c58a5a');
  function box(parent,w,h,d,x=0,y=0,z=0,material=paper){
    const r=Math.min(.006,d/4,w/8,h/8),shape=new THREE.Shape();
    shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);
    shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);
    shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);
    shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);
    shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.5,bevelSegments:3,steps:1,curveSegments:6});
    geometry.translate(0,0,-(d-2*r)/2);geometries.add(geometry);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function model(name){const group=new THREE.Group();group.name=name;root.add(group);return group;}
  function pages(group){
    box(group,1.04,1.04,.045,0,0,-.035,ink);
    for(let i=0;i<4;i++)box(group,1+i*.003,1+i*.003,.009,0,0,-.012-i*.011);
  }
  const book=model('Learning_Book');pages(book);
  box(book,.045,1.06,.075,-.535,0,-.025,copper);
  box(book,.065,.16,.012,.36,-.55,-.02,copper);
  const memory=model('Memory_Cards');
  for(let i=2;i>=0;i--){const sheet=box(memory,1,1,.026,i*.032,i*.032,-i*.037);sheet.rotation.z=i*.025;}
  box(memory,.18,.025,.035,-.33,.525,0,copper);
  const path=model('Course_Path');pages(path);
  box(path,.013,.91,.025,-.545,0,0,copper);
  for(let i=0;i<4;i++)box(path,.065,.055,.05,-.545,-.37+i*.25,.012,i===3?copper:paper);
  const check=model('Assessment_Checklist');pages(check);
  box(check,.3,.075,.075,0,.54,.005,copper);
  const progress=model('Progress_Steps');pages(progress);
  for(let i=0;i<5;i++)box(progress,.075,.06+i*.035,.06,-.37+i*.185,-.56-i*.0175,-.02,i===4?copper:paper);
  const archive=model('Path_Archive');pages(archive);
  for(let i=0;i<3;i++)box(archive,.18,.07,.04,-.3+i*.25,.535,-.02,i===0?copper:paper);
  for(const y of [-.3,0,.3]){
    const geometry=new THREE.TorusGeometry(.032,.008,8,24);geometries.add(geometry);
    const ring=new THREE.Mesh(geometry,copper);ring.position.set(-.535,y,.005);archive.add(ring);
  }
  root.updateMatrixWorld(true);
  return {root,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
