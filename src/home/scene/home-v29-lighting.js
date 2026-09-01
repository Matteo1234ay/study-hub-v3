const clamp01 = value => Math.min(1, Math.max(0, Number(value) || 0));

function smoothRange(value, start, end) {
  const t = clamp01((value - start) / Math.max(.0001, end - start));
  return t * t * (3 - 2 * t);
}

export function createHomeV29Lighting({ THREE, scene, renderer, root, keyLight, fillLight } = {}) {
  if (!THREE || !scene || !renderer || !root) return null;
  const practical = root.getObjectByName?.("PracticalLamp") ?? null;
  const screenMeshes = [];
  root.traverse?.(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (/StudyHub_Screen_Accent/i.test(material?.name ?? "")) screenMeshes.push(material);
    }
  });

  const warmBackground = new THREE.Color(0x12161b);
  const digitalBackground = new THREE.Color(0x061329);
  const warmFog = new THREE.Color(0x171b20);
  const digitalFog = new THREE.Color(0x07152d);
  const warmKey = new THREE.Color(0xffefe2);
  const coolKey = new THREE.Color(0xc6d8ee);
  const warmFill = new THREE.Color(0xa8b7c9);
  const coolFill = new THREE.Color(0x6d9bd2);

  function apply(progress, state = {}) {
    const p = clamp01(progress);
    const digital = smoothRange(p, .52, .86);
    const archive = clamp01(state.archive);
    const lampWake = smoothRange(p, .10, .19);
    const lampFade = smoothRange(p, .64, .84);

    scene.background.copy(warmBackground).lerp(digitalBackground, digital);
    if (scene.fog?.color) {
      scene.fog.color.copy(warmFog).lerp(digitalFog, digital);
      scene.fog.near = 14 - digital * 2.5;
      scene.fog.far = 29 - digital * 6;
    }
    if (keyLight) {
      keyLight.color.copy(warmKey).lerp(coolKey, digital);
      keyLight.intensity = 1.18 - digital * .28 + archive * .10;
    }
    if (fillLight) {
      fillLight.color.copy(warmFill).lerp(coolFill, digital);
      fillLight.intensity = .18 + digital * .34;
    }
    if (practical?.isLight) practical.intensity = 82 * lampWake * (1 - lampFade * .86);
    for (const material of screenMeshes) {
      material.emissiveIntensity = .35 + smoothRange(p, .12, .21) * 1.45 + archive * .55;
    }
    renderer.toneMappingExposure = .96 + lampWake * .08 - digital * .05;
  }

  return { apply };
}
