// Original, code-authored solid models. Bevelled surfaces, layered construction
// and separate components keep their silhouettes readable while unfolding.
export function createSemanticObjects(THREE) {
  const root=new THREE.Group();
  const geometries=new Set(), materials=new Set();
  const material=(color,metalness,roughness)=>{
    const value=new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.25,clearcoatRoughness:.3});
    materials.add(value);return value;
  };
  const porcelain=material('#f2f0ea',.08,.28);
  const paper=material('#fffdf6',0,.74);
  const ink=material('#241342',.18,.35);
  const copper=material('#c58a5a',.82,.28);
  const silver=material('#d9dce5',.9,.23);
  function mesh(parent,geometry,finish,position=[0,0,0]) {
    geometries.add(geometry);
    const object=new THREE.Mesh(geometry,finish);object.position.set(...position);parent.add(object);return object;
  }
  function slab(parent,w,h,d,finish,position=[0,0,0],radius=.045) {
    const r=Math.min(radius,w/3,h/3,d/3),s=new THREE.Shape();
    const x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const geometry=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.55,bevelSegments:3,steps:1,curveSegments:8});
    geometry.translate(0,0,-(d-2*r)/2);
    return mesh(parent,geometry,finish,position);
  }
  function stroke(parent,points,width,finish) {
    const curve=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)),false,'centripetal');
    return mesh(parent,new THREE.TubeGeometry(curve,Math.max(12,points.length*8),width,8,false),finish);
  }
  function object(name) {const group=new THREE.Group();group.name=name;root.add(group);return group;}
  function ruled(parent,x,y,z,w,count) {
    for(let i=0;i<count;i++)slab(parent,w*(i===count-1?.65:1),.015,.012,ink,[x,y-i*.085,z],.003);
  }

  // Lesson: a visibly open book, with two covers, a spine and layered pages.
  const book=object('Learning_Book');
  for(const side of [-1,1]) {
    const leaf=new THREE.Group();leaf.position.x=side*.4;leaf.rotation.y=side*.18;book.add(leaf);
    slab(leaf,.78,1.05,.07,ink,[0,0,-.06]);
    for(let i=0;i<5;i++)slab(leaf,.72,.98,.018,paper,[0,0,-.018+i*.023],.008);
    ruled(leaf,0,.3,.105,.52,7);
  }
  slab(book,.07,1.05,.16,copper,[0,0,-.035],.018);
  slab(book,.065,.34,.016,copper,[.59,-.42,.112],.005);

  // Memory: three substantial flashcards, stepped and fanned out.
  const cards=object('Memory_Cards');
  for(let i=0;i<3;i++) {
    const card=new THREE.Group();card.position.set((i-1)*.12,(i-1)*.08,i*.085);card.rotation.z=(i-1)*-.09;cards.add(card);
    slab(card,1.15,.78,.06,porcelain);
    slab(card,.26,.055,.016,copper,[-.34,.23,.042],.005);
    ruled(card,0,.07,.043,.87,3);
  }

  // Course: connected milestones, rising along an intentional curved route.
  const path=object('Course_Path');
  const points=[[-.65,-.44,0],[-.32,-.1,.06],[.22,-.12,0],[.48,.3,.08],[.64,.57,0]];
  stroke(path,points,.032,copper);
  points.forEach((point,i)=>{
    const stone=slab(path,.31,.24,.12,i===0?copper:porcelain,point,.035);
    stone.rotation.z=-.12+i*.07;
    mesh(path,new THREE.SphereGeometry(.027,16,12),ink,[point[0],point[1],point[2]+.07]);
  });

  // Assessment: clipboard, three outlined boxes, two physical check strokes.
  const check=object('Assessment_Checklist');
  slab(check,.94,1.3,.1,ink);
  slab(check,.82,1.16,.035,paper,[0,-.015,.066]);
  slab(check,.36,.15,.055,silver,[0,.59,.104],.025);
  for(let i=0;i<3;i++) {
    const y=.32-i*.3;
    stroke(check,[[-.29,y-.055,.103],[-.29,y+.055,.103],[-.18,y+.055,.103],[-.18,y-.055,.103],[-.29,y-.055,.103]],.009,ink);
    if(i<2)stroke(check,[[-.275,y,.121],[-.24,y-.025,.133],[-.16,y+.07,.137]],.019,copper);
    ruled(check,.11,y+.02,.097,.36,2);
  }

  // Progress: five solid steps of increasing height with a continuous handrail.
  const progress=object('Progress_Steps');
  const rail=[];
  for(let i=0;i<5;i++) {
    const height=.2+i*.19,x=(i-2)*.29;
    slab(progress,.27,height,.42,i===4?copper:porcelain,[x,-.5+height/2,0],.035);
    rail.push([x,height-.39,.17]);
  }
  stroke(progress,rail,.017,silver);

  // Future courses: a compact archive of three ring binders with label plates.
  const archive=object('Path_Archive');
  for(let i=0;i<3;i++) {
    const binder=new THREE.Group();binder.position.set((i-1)*.38,0,(1-i)*.035);binder.rotation.z=(i-1)*-.055;archive.add(binder);
    slab(binder,.32,1.13,.52,i===1?ink:porcelain,[0,0,0],.035);
    slab(binder,.21,.32,.022,paper,[0,.22,.277],.009);
    slab(binder,.14,.024,.008,copper,[0,.28,.293],.002);
    const ring=new THREE.TorusGeometry(.047,.009,10,32);
    mesh(binder,ring,silver,[0,-.31,.277]);
  }
  root.updateMatrixWorld(true);
  return {root,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
