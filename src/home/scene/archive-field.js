import { resolveArchiveBudget, resolveArchiveReveal } from "./archive-state.js?v=20260901-29";

const NUCLEI = Object.freeze([
  { id: "future-paths", label: "Percorsi", href: "#/paths", position: [0.3, 2.0, -2.35], color: 0x5e9cff, scale: 1.26 },
  { id: "memory", label: "Ripasso", href: "#/review", position: [-2.25, 1.8, -1.45], color: 0x82b7ff, scale: .86 },
  { id: "progress", label: "Progressi", href: "#/progress", position: [-.95, 2.85, -2.05], color: 0x77d1ff, scale: .92 },
  { id: "assessment", label: "Verifiche", href: "#/assessment", position: [2.0, 1.5, -1.2], color: 0xa4c8ff, scale: .9 },
  { id: "search", label: "Cerca", href: "#/search", position: [2.15, 2.75, -2.25], color: 0xd5e6ff, scale: .78 }
]);

const ORIGIN_TO_STATION = Object.freeze({
  ArchiveOrigin_Paths: "future-paths",
  ArchiveOrigin_Review: "memory",
  ArchiveOrigin_Progress: "progress",
  ArchiveOrigin_Assessment: "assessment",
  ArchiveOrigin_Search: "search"
});

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function seededRandom(seed = 0x51a7) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function particleGeometry(THREE, count) {
  const random = seededRandom(0x20260901);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 1.45 + random() * 3.45;
    const angle = random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius * (.72 + random() * .46);
    positions[i * 3 + 1] = .35 + random() * 3.85;
    positions[i * 3 + 2] = -2.0 + Math.sin(angle) * radius * .48 + (random() - .5) * 1.4;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function connectionGeometry(THREE, count, positionsById) {
  const positions = [];
  for (let index = 0; index < count; index += 1) {
    const fromDefinition = NUCLEI[index % NUCLEI.length];
    const toDefinition = NUCLEI[(index + 1 + Math.floor(index / NUCLEI.length)) % NUCLEI.length];
    const from = positionsById.get(fromDefinition.id) ?? fromDefinition.position;
    const to = positionsById.get(toDefinition.id) ?? toDefinition.position;
    positions.push(...from, ...to);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function createArchiveField({ THREE, quality, mobile = false } = {}) {
  if (!THREE) throw new Error("Three.js non disponibile per l'archivio digitale");
  const group = new THREE.Group();
  group.name = "digital-archive";
  group.visible = false;
  const positionsById = new Map(NUCLEI.map(item => [item.id, item.position.slice()]));

  const nucleiGroup = new THREE.Group();
  nucleiGroup.name = "archive-nuclei";
  group.add(nucleiGroup);

  const nucleusGeometry = new THREE.IcosahedronGeometry(.25, 2);
  const nucleusEntries = NUCLEI.map((definition, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: definition.color,
      emissive: definition.color,
      emissiveIntensity: .6,
      roughness: .24,
      metalness: .22,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, material);
    nucleus.name = `archive-${definition.id}`;
    nucleus.userData.stationId = definition.id;
    nucleus.userData.href = definition.href;
    nucleus.userData.label = definition.label;
    nucleus.userData.basePosition = definition.position.slice();
    nucleus.userData.baseScale = definition.scale;
    nucleus.position.set(...definition.position);
    nucleus.scale.setScalar(.01);
    nucleus.renderOrder = 4;
    nucleiGroup.add(nucleus);
    return { nucleus, material, definition, index };
  });

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x8fc0ff,
    size: .034,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x79aef5,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  let budget = resolveArchiveBudget({ profile: quality?.profile, mobile });
  const particles = new THREE.Points(particleGeometry(THREE, budget.particles), particleMaterial);
  const connections = new THREE.LineSegments(connectionGeometry(THREE, budget.connections, positionsById), lineMaterial);
  particles.name = "archive-particles";
  connections.name = "archive-connections";
  particles.renderOrder = 3;
  connections.renderOrder = 2;
  group.add(connections, particles);

  function rebuildConnections() {
    connections.geometry.dispose();
    connections.geometry = connectionGeometry(THREE, budget.connections, positionsById);
  }

  function setOrigins(origins = []) {
    let changed = false;
    for (const { name, object } of origins) {
      const stationId = ORIGIN_TO_STATION[name];
      if (!stationId || !object?.getWorldPosition) continue;
      const world = object.getWorldPosition(new THREE.Vector3());
      const position = [world.x, world.y, world.z];
      positionsById.set(stationId, position);
      const entry = nucleusEntries.find(item => item.definition.id === stationId);
      if (entry) entry.nucleus.userData.basePosition = position;
      changed = true;
    }
    if (changed) rebuildConnections();
  }

  function setBudget(nextBudget) {
    if (!nextBudget) return;
    const next = {
      particles: Math.max(1, Math.round(nextBudget.particles || 1)),
      fragments: Math.max(1, Math.round(nextBudget.fragments || 1)),
      connections: Math.max(1, Math.round(nextBudget.connections || 1))
    };
    if (next.particles === budget.particles && next.connections === budget.connections) {
      budget = next;
      return;
    }
    particles.geometry.dispose();
    particles.geometry = particleGeometry(THREE, next.particles);
    budget = next;
    rebuildConnections();
  }

  function update(progress, state) {
    const knowledge = clamp01(state?.knowledge);
    const archive = clamp01(state?.archive);
    const handoff = clamp01(state?.handoff);
    const reveal = resolveArchiveReveal(state);
    group.visible = reveal > .008;
    if (!group.visible) return;

    const time = clamp01(progress);
    particles.material.opacity = Math.min(.82, reveal * (.48 + knowledge * .34 + archive * .42));
    particles.rotation.y = time * .24;
    particles.rotation.x = -.06 + archive * .035;
    particles.scale.setScalar(.76 + reveal * .24);
    connections.material.opacity = archive * .48;
    connections.scale.setScalar(.84 + archive * .16);

    nucleusEntries.forEach(({ nucleus, material, definition, index }) => {
      const base = nucleus.userData.basePosition ?? definition.position;
      const orbit = archive * (.035 + index * .004);
      const phase = time * 2.4 + index * 1.27;
      nucleus.position.set(
        base[0] + Math.cos(phase) * orbit,
        base[1] + Math.sin(phase * .8) * orbit * .7,
        base[2] + Math.sin(phase) * orbit * .45
      );
      const importance = definition.id === "future-paths" ? 1 + handoff * .92 : 1 - handoff * .34;
      const scale = definition.scale * (.14 + archive * .86) * importance;
      nucleus.scale.setScalar(Math.max(.01, scale));
      material.opacity = Math.min(1, reveal * (definition.id === "future-paths" ? 1 : .86));
      material.emissiveIntensity = .42 + archive * .95 + (definition.id === "future-paths" ? handoff * 1.6 : 0);
      nucleus.rotation.x = phase * .08;
      nucleus.rotation.y = phase * .12;
    });
  }

  function dispose() {
    particles.geometry.dispose();
    connections.geometry.dispose();
    particleMaterial.dispose();
    lineMaterial.dispose();
    nucleusGeometry.dispose();
    nucleusEntries.forEach(({ material }) => material.dispose());
  }

  return { group, update, setBudget, setOrigins, dispose };
}
