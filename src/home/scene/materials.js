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
      data[offset] = Math.max(0, Math.min(255, channels[0]));
      data[offset + 1] = Math.max(0, Math.min(255, channels[1]));
      data[offset + 2] = Math.max(0, Math.min(255, channels[2]));
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

function layeredNoise(x, y) {
  return hash(x, y) * .58 + hash(x * .43 + 17, y * .71 + 31) * .28 + hash(x * .13 + 7, y * .19 + 23) * .14;
}

export function createRoomMaterials(THREE) {
  const woodMap = proceduralTexture(THREE, {
    size: 256,
    repeat: [3.2, 1],
    sample: (u, v, x, y) => {
      const longGrain = Math.sin((v * 31 + Math.sin(u * 5.5) * 1.1) * Math.PI) * .5 + .5;
      const fineGrain = Math.sin((v * 103 + Math.sin(u * 17) * .34) * Math.PI) * .5 + .5;
      const noise = layeredNoise(x, y);
      return [69 + longGrain * 34 + fineGrain * 7 + noise * 8, 36 + longGrain * 18 + noise * 4, 19 + longGrain * 9 + noise * 2];
    }
  });
  const woodRoughness = proceduralTexture(THREE, {
    size: 256,
    color: false,
    repeat: [3.2, 1],
    sample: (u, v, x, y) => 116 + layeredNoise(x, y) * 46 + Math.sin(v * Math.PI * 31) * 13 + Math.sin(v * Math.PI * 103) * 4
  });
  const woodNormal = proceduralTexture(THREE, {
    size: 256,
    color: false,
    repeat: [3.2, 1],
    sample: (u, v, x, y) => [
      128 + Math.sin(v * Math.PI * 31) * 16 + Math.sin(v * Math.PI * 97) * 5,
      128 + (layeredNoise(x, y) - .5) * 13,
      247
    ]
  });
  const fabricRoughness = proceduralTexture(THREE, {
    size: 192,
    color: false,
    repeat: [9, 9],
    sample: (u, v, x, y) => 198 + ((Math.sin(u * Math.PI * 72) + Math.sin(v * Math.PI * 70)) * .5 + 1) * 14 + layeredNoise(x, y) * 8
  });
  const fabricNormal = proceduralTexture(THREE, {
    size: 192,
    color: false,
    repeat: [9, 9],
    sample: (u, v) => [
      128 + Math.sin(u * Math.PI * 72) * 12,
      128 + Math.sin(v * Math.PI * 70) * 12,
      247
    ]
  });
  const floorRoughness = proceduralTexture(THREE, {
    size: 192,
    color: false,
    repeat: [5, 5],
    sample: (u, v, x, y) => 167 + layeredNoise(x, y) * 42 + Math.sin((u + v) * 17) * 6
  });
  const floorNormal = proceduralTexture(THREE, {
    size: 192,
    color: false,
    repeat: [5, 5],
    sample: (u, v, x, y) => [
      128 + (layeredNoise(x, y) - .5) * 18,
      128 + Math.sin((u + v) * Math.PI * 11) * 8,
      249
    ]
  });
  const wallMap = proceduralTexture(THREE, {
    size: 192,
    repeat: [4, 3],
    sample: (u, v, x, y) => {
      const variation = layeredNoise(x, y) * 7 + Math.sin((u - v) * 23) * 1.5;
      return [18 + variation * .45, 31 + variation * .72, 72 + variation * 1.05];
    }
  });
  const wallNormal = proceduralTexture(THREE, {
    size: 192,
    color: false,
    repeat: [4, 3],
    sample: (u, v, x, y) => [
      128 + (layeredNoise(x, y) - .5) * 11,
      128 + (layeredNoise(y, x) - .5) * 11,
      251
    ]
  });

  return {
    wood: new THREE.MeshStandardMaterial({
      name: "warm-oak",
      map: woodMap,
      roughnessMap: woodRoughness,
      normalMap: woodNormal,
      normalScale: new THREE.Vector2(.38, .2),
      color: 0xffffff,
      roughness: .57,
      metalness: 0,
      envMapIntensity: .72
    }),
    metal: new THREE.MeshPhysicalMaterial({
      name: "satin-blue-metal",
      color: 0x2d5d9f,
      roughness: .29,
      metalness: .84,
      clearcoat: .06,
      clearcoatRoughness: .48,
      envMapIntensity: .86
    }),
    paintedMetal: new THREE.MeshPhysicalMaterial({
      name: "powder-coated-blue",
      color: 0x18386f,
      roughness: .49,
      metalness: .43,
      clearcoat: .05,
      clearcoatRoughness: .62,
      envMapIntensity: .64
    }),
    ceramic: new THREE.MeshPhysicalMaterial({
      name: "matte-ceramic",
      color: 0xd8d2c7,
      roughness: .46,
      metalness: 0,
      clearcoat: .14,
      clearcoatRoughness: .5,
      ior: 1.48,
      envMapIntensity: .7
    }),
    fabric: new THREE.MeshPhysicalMaterial({
      name: "woven-blue-fabric",
      color: 0x172e62,
      roughness: .91,
      roughnessMap: fabricRoughness,
      normalMap: fabricNormal,
      normalScale: new THREE.Vector2(.28, .28),
      metalness: 0,
      sheen: .18,
      sheenRoughness: .8,
      sheenColor: new THREE.Color(0x729ee8),
      envMapIntensity: .38
    }),
    glassOff: new THREE.MeshPhysicalMaterial({
      name: "screen-glass-off",
      color: 0x06132f,
      roughness: .15,
      metalness: .06,
      clearcoat: .7,
      clearcoatRoughness: .18,
      ior: 1.46,
      thickness: .08,
      emissive: 0x000000,
      emissiveIntensity: 0,
      envMapIntensity: .9
    }),
    wall: new THREE.MeshStandardMaterial({
      name: "matte-wall",
      map: wallMap,
      color: 0xffffff,
      normalMap: wallNormal,
      normalScale: new THREE.Vector2(.14, .14),
      roughness: .94,
      metalness: 0,
      envMapIntensity: .22
    }),
    floor: new THREE.MeshStandardMaterial({
      name: "deep-blue-floor",
      color: 0x0d214b,
      roughness: .8,
      roughnessMap: floorRoughness,
      normalMap: floorNormal,
      normalScale: new THREE.Vector2(.25, .25),
      metalness: 0,
      envMapIntensity: .4
    })
  };
}
