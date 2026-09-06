const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));
const smooth = t => { const x=clamp01(t); return x*x*x*(x*(x*6-15)+10); };
// Names are read from the shipped GLB. Animate local coordinates from a captured
// pose: repeated frames and reverse scrolling must never accumulate transforms.
const PARTS = [
  ['Chair_Root',[-3.5,0,3.5],.02,.64,[0,-.18,0]],
  ['Lamp_Root',[3.8,1.8,0],.06,.62,[0,.12,-.15]],
  ['Paper_Stack',[-1.5,2.2,.7],0,.62,[.05,0,-.1]],
  ['Notebook_Root',[-2.1,1.1,.4],.12,.7,[0,.1,-.05]],
  ['Cabinet_Root',[-4.8,.1,-.5],.15,.78,[0,-.08,0]],
  ['Monitor_Root',[3.8,1,.5],.26,.83,[0,.08,0]],
  ['Desk_Root',[0,-2.5,1.2],.3,.92,[.04,0,0]],
  ['Architecture_Shelf_Root',[0,3.7,-.3],.2,.86,[0,0,.04]],
  ['Architecture_WalnutPanel_Root',[-5.5,0,-1],.35,.95,[0,0,0]],
  ['Architecture_BackWall',[0,0,-7],.45,1,[0,0,0]],
  ['Architecture_LeftWall',[-7,0,0],.4,1,[0,0,0]],
  ['Architecture_Floor',[0,-4,0],.5,1,[0,0,0]]
];
export function createHomeV30Dematerialization({THREE,root}={}) {
  if(!THREE?.Vector3 || !root) throw new Error('La sequenza richiede il modello della stanza.');
  const records=PARTS.map(([name,drift,start,end,rotation])=>{
    const object=root.getObjectByName(name);if(!object)return null;
    return {name,object,drift:new THREE.Vector3(...drift),start,end,rotation:new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),basePosition:object.position.clone(),baseQuaternion:object.quaternion.clone(),baseScale:object.scale.clone()};
  }).filter(Boolean);
  let progress=0;
  function restore(){for(const r of records){r.object.position.copy(r.basePosition);r.object.quaternion.copy(r.baseQuaternion);r.object.scale.copy(r.baseScale);}}
  function capture(){for(const r of records){r.basePosition.copy(r.object.position);r.baseQuaternion.copy(r.object.quaternion);r.baseScale.copy(r.object.scale);}}
  function update(value){
    progress=clamp01(value);restore();
    for(const r of records){const t=smooth((progress-r.start)/(r.end-r.start));r.object.position.addScaledVector(r.drift,t);r.object.quaternion.multiply(new THREE.Quaternion().slerp(r.rotation,t));}
  }
  return {update,restore,capture,dispose:restore,audit:()=>({progress,phase:progress>0?'unbinding':'settled',nodes:records.map(r=>r.name),missingNodes:PARTS.map(p=>p[0]).filter(n=>!records.some(r=>r.name===n))})};
}
