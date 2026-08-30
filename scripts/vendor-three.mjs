import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const packagePath = resolve(projectRoot, "package.json");
const packageData = JSON.parse(await readFile(packagePath, "utf8"));

if (packageData.dependencies?.three !== "0.185.1") {
  throw new Error("Three.js deve essere bloccato esattamente alla versione 0.185.1");
}

const destination = resolve(projectRoot, "vendor/three");
await mkdir(destination, { recursive: true });
const wrapperSource = await readFile(resolve(projectRoot, "node_modules/three/build/three.module.min.js"), "utf8");
const wrapper = wrapperSource.replaceAll("./three.core.min.js", "./three.core.0.185.1.min.js");
if (wrapper === wrapperSource) throw new Error("Import interno di Three.js non riconosciuto");

async function vendorAddon(sourceRelative, destinationRelative) {
  const source = resolve(projectRoot, "node_modules/three/examples/jsm", sourceRelative);
  const destinationPath = resolve(destination, "examples/jsm", destinationRelative);
  await mkdir(dirname(destinationPath), { recursive: true });
  const text = await readFile(source, "utf8");
  const depth = destinationRelative.split("/").length;
  const relativeThree = `${"../".repeat(depth)}../three.module.min.js`;
  const rewritten = text
    .replaceAll("from 'three'", `from '${relativeThree}'`)
    .replaceAll('from "three"', `from "${relativeThree}"`);
  if (/from\s+["']three["']/.test(rewritten)) {
    throw new Error(`Import Three non riscritto in ${sourceRelative}`);
  }
  await writeFile(destinationPath, rewritten, "utf8");
}

await Promise.all([
  writeFile(resolve(destination, "three.module.min.js"), wrapper, "utf8"),
  copyFile(
    resolve(projectRoot, "node_modules/three/build/three.core.min.js"),
    resolve(destination, "three.core.0.185.1.min.js")
  ),
  copyFile(
    resolve(projectRoot, "node_modules/three/LICENSE"),
    resolve(destination, "LICENSE")
  ),
  vendorAddon("geometries/RoundedBoxGeometry.js", "geometries/RoundedBoxGeometry.js"),
  vendorAddon("environments/RoomEnvironment.js", "environments/RoomEnvironment.js"),
  vendorAddon("utils/BufferGeometryUtils.js", "utils/BufferGeometryUtils.js"),
  vendorAddon("utils/SkeletonUtils.js", "utils/SkeletonUtils.js"),
  vendorAddon("loaders/GLTFLoader.js", "loaders/GLTFLoader.js")
]);
