function proceduralTexture(THREE, {
  size = 128,
  sample,
  color = true,
  repeat = [1, 1]
}) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const value = sample(x / size, y / size, x, y);
      const channels = Array.isArray(value) ? value : [value, value, value];
      data[offset] = channels[0];
      data[offset + 1] = channels[1];
      data[offset + 2] = channels[2];
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 4;
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hash(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function createRoomMaterials(THREE) {
  const woodMap = proceduralTexture(THREE, {
    size: 192,
    repeat: [3, 1],
    sample: (u, v, x, y) => {
      const grain = Math.sin((v * 36 + Math.sin(u * 8) * .9) * Math.PI) * .5 + .5;
      const noise = hash(x, y) * 10;
      return [76 + grain * 34 + noise, 39 + grain * 18 + noise * .4, 20 + grain * 9];
    }
  });
  const fabricRoughness = proceduralTexture(THREE, {
    size: 128,
    color: false,
    repeat: [8, 8],
    sample: (u, v) => 195 + ((Math.sin(u * Math.PI * 64) + Math.sin(v * Math.PI * 64)) * .5 + 1) * 18
  });
  const floorRoughness = proceduralTexture(THREE, {
    size: 128,
    color: false,
    repeat: [5, 5],
    sample: (u, v, x, y) => 170 + hash(x, y) * 42 + Math.sin((u + v) * 18) * 8
  });
  const wallMap = proceduralTexture(THREE, {
    size: 128,
    repeat: [4, 3],
    sample: (u, v, x, y) => {
      const variation = hash(x, y) * 7 + Math.sin((u - v) * 24) * 2;
      return [48 + variation, 50 + variation, 53 + variation];
    }
  });

  return {
    wood: new THREE.MeshStandardMaterial({
      name: "warm-oak",
      map: woodMap,
      color: 0xffffff,
      roughness: .58,
      metalness: 0
    }),
    metal: new THREE.MeshStandardMaterial({
      name: "satin-metal",
      color: 0x353a40,
      roughness: .31,
      metalness: .78
    }),
    fabric: new THREE.MeshStandardMaterial({
      name: "woven-fabric",
      color: 0x292d32,
      roughness: .92,
      roughnessMap: fabricRoughness,
      metalness: 0
    }),
    glassOff: new THREE.MeshPhysicalMaterial({
      name: "screen-glass-off",
      color: 0x090d12,
      roughness: .16,
      metalness: .08,
      clearcoat: .65,
      clearcoatRoughness: .2,
      emissive: 0x000000,
      emissiveIntensity: 0
    }),
    wall: new THREE.MeshStandardMaterial({
      name: "matte-wall",
      map: wallMap,
      color: 0xffffff,
      roughness: .94,
      metalness: 0
    }),
    floor: new THREE.MeshStandardMaterial({
      name: "dark-floor",
      color: 0x2a2723,
      roughness: .82,
      roughnessMap: floorRoughness,
      metalness: 0
    })
  };
}
