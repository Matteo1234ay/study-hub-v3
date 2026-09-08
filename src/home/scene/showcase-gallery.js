import { SHOWCASE_OBJECTS, ease } from './showcase-motion.js?v=20260908-37';
import { createShowcaseParticles } from './showcase-particles.js?v=20260908-37';

export function createShowcaseGallery({ THREE, source, scene }) {
  source.updateMatrixWorld(true);
  const materials = new Set();
  const group = new THREE.Group();
  group.name = 'StudyHub_Object_Showcase';
  const records = SHOWCASE_OBJECTS.map(([id, name], index) => {
    const original = source.getObjectByName(name);
    if (!original) throw new Error(`Oggetto mancante: ${name}`);
    const box = new THREE.Box3().setFromObject(original);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const scale = 1.8/Math.max(size.length(), .01);
    const object = new THREE.Group();
    object.position.x = index*6;
    object.rotation.set(.03, -.18, -.015);
    const parts = [];
    original.traverse(node => {
      if (!node.isMesh) return;
      const clonedMaterials = (Array.isArray(node.material) ? node.material : [node.material]).map(material => {
        const clone = material.clone();
        clone.transparent = true;
        clone.userData.originalOpacity = material.opacity;
        materials.add(clone);
        return clone;
      });
      const mesh = new THREE.Mesh(node.geometry, Array.isArray(node.material) ? clonedMaterials : clonedMaterials[0]);
      node.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
      mesh.position.sub(center).multiplyScalar(scale);
      mesh.scale.multiplyScalar(scale);
      mesh.castShadow = false;
      const partCenter = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()).sub(center).multiplyScalar(scale);
      const side = parts.length % 2 ? 1 : -1;
      const drift = new THREE.Vector3(side*(.55+Math.abs(partCenter.x)*.3), partCenter.y*.55 + ((parts.length%3)-1)*.12, -.1);
      parts.push({ mesh, position: mesh.position.clone(), quaternion: mesh.quaternion.clone(), drift, side, materials: clonedMaterials });
      object.add(mesh);
    });
    if (!parts.length) throw new Error(`Oggetto senza superfici: ${name}`);
    group.add(object);
    return { id, object, parts, name };
  });
  source.visible = false;
  const particles=createShowcaseParticles(THREE,records);
  scene.add(group);
  scene.background = new THREE.Color('#10002f');
  scene.fog = null;
  const originalLights = scene.children.filter(node => node.isLight);
  const ambient = new THREE.HemisphereLight('#ffffff', '#342553', 1.5);
  const key = new THREE.DirectionalLight('#fff7ed', 3.2);
  const rim = new THREE.DirectionalLight('#b8bdff', 2.1);
  scene.add(ambient, key, key.target, rim, rim.target);
  const turn = new THREE.Quaternion();
  const euler = new THREE.Euler();
  function update(shot, exitProgress = 0, { seconds = 0, motion = 0 } = {}) {
    originalLights.forEach(light => { light.intensity = 0; });
    key.position.set(shot.target[0]+3, 4, 5);
    key.target.position.set(...shot.target);
    rim.position.set(shot.target[0]-3, 1, -2);
    rim.target.position.set(...shot.target);
    for (let index=0; index<records.length; index++) {
      const record = records[index];
      record.object.visible = index === shot.index || (index === shot.index+1 && shot.release > 0);
      if (!record.object.visible) continue;
      const opening = index === shot.index ? shot.opening : 0;
      const weight=Math.max(0,Math.min(1,motion))*(1-opening*.8)*(1-exitProgress);
      const mass=[.9,.6,1.1,.8,1.7,1.4][index];
      const wave=seconds*.34/Math.sqrt(mass)+index*1.27;
      const lift=(Math.sin(wave)*.04+Math.sin(wave*1.7+.4)*.008)*weight;
      record.object.position.set(index*6+Math.cos(wave*.73)*.014*weight,lift,Math.sin(wave*.57)*.012*weight);
      record.object.rotation.set(.03+Math.cos(wave)*.015*weight,-.18+Math.sin(wave*.61)*.035*weight,-.015+Math.cos(wave*.8)*.016*weight);
      for (let i=0; i<record.parts.length; i++) {
        const part = record.parts[i];
        const amount = ease((opening-(i%4)*.035)/.895);
        part.mesh.position.copy(part.position).addScaledVector(part.drift, amount);
        part.mesh.position.y += Math.sin(Math.PI*amount)*.12;
        if (record.id === 'memory' || record.id === 'desk') part.mesh.position.z += Math.sin(wave+i*.35)*.007*weight;
        euler.set(0, part.side*amount*.16, part.side*amount*.08);
        part.mesh.quaternion.copy(part.quaternion).multiply(turn.setFromEuler(euler));
        for (const material of part.materials) material.opacity = material.userData.originalOpacity*(1-.92*opening)*(1-exitProgress);
      }
    }
    particles.update(shot,exitProgress,motion);
    group.updateMatrixWorld(true);
  }
  return {
    update,
    audit: () => records.map(record => ({id: record.id, name: record.name, parts: record.parts.length})),
    dispose() {
      particles.dispose();
      scene.remove(group, ambient, key, key.target, rim, rim.target);
      materials.forEach(material => material.dispose());
      source.visible = true;
    }
  };
}
