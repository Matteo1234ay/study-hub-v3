import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const VENDOR_REL = "assets/3d/home-v30/vendor";
const VENDOR_DIR = path.join(ROOT, VENDOR_REL);
const MANIFEST_REL = "assets/3d/home-v30/manifest.json";
const MANIFEST_PATH = path.join(ROOT, MANIFEST_REL);
const USER_AGENT = "StudyHubV30-AssetVendor/1.0";
const ASSETS_API = "https://api.polyhaven.com/assets";
const FILES_API = "https://api.polyhaven.com/files/";
const API_HOST = "api.polyhaven.com";
const DOWNLOAD_HOST = "dl.polyhaven.org";

const SELECTION = Object.freeze([
  Object.freeze({
    id: "desk_lamp_arm_01",
    kind: "model",
    role: "articulated practical desk lamp",
    existingLocalRoot: "assets/3d/desk-lamp-arm-01",
    transformations: [
      "Reuse the previously vendored optimized 1K glTF copy.",
      "V30 Blender rebuild may re-parent lamp parts around Study Hub-specific mechanical pivots."
    ]
  }),
  Object.freeze({
    id: "office_notepads",
    kind: "model",
    role: "paper and note props",
    transformations: [
      "Select the smallest available 1K glTF delivery and its declared dependencies.",
      "Imported into Blender as a build-time source; final runtime delivery is the consolidated V30 GLB."
    ]
  }),
  Object.freeze({
    id: "stationery_supplies",
    kind: "model",
    role: "lived-in editorial desk props",
    transformations: [
      "Select the smallest available 1K glTF delivery and its declared dependencies.",
      "Only a restrained subset is composed into the final Study Hub scene."
    ]
  }),
  Object.freeze({
    id: "drawer_cabinet",
    kind: "model",
    role: "realistic storage reference and secondary furniture",
    transformations: [
      "Select the smallest available 1K glTF delivery and its declared dependencies.",
      "Used as build-time art/reference; mechanically animated Study Hub drawers remain custom-controlled."
    ]
  }),
  Object.freeze({
    id: "poly_haven_studio",
    kind: "hdri",
    role: "neutral office image-based lighting reference",
    transformations: [
      "Select a 2K HDR delivery where available to cap repository and GPU cost.",
      "Used for image-based lighting, not as the visible room background."
    ]
  }),
  Object.freeze({
    id: "natural_walnut_veneer",
    kind: "texture",
    role: "walnut desk and cabinetry material",
    transformations: [
      "Vendor 1K diffuse, OpenGL normal and roughness maps only.",
      "Texture scale and color response are calibrated in the V30 Blender scene."
    ]
  }),
  Object.freeze({
    id: "white_plaster_02",
    kind: "texture",
    role: "warm neutral plaster wall material",
    transformations: [
      "Vendor 1K diffuse, OpenGL normal and roughness maps only.",
      "Texture scale and tonal warmth are calibrated in the V30 Blender scene."
    ]
  })
]);

function assertHttpsHost(rawUrl, allowedHost) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || url.hostname !== allowedHost) {
    throw new Error(`Blocked unexpected asset host: ${url.protocol}//${url.hostname}`);
  }
  return url;
}

async function fetchChecked(rawUrl, allowedHost) {
  const url = assertHttpsHost(rawUrl, allowedHost);
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(45_000)
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response;
}

async function fetchJson(rawUrl) {
  const response = await fetchChecked(rawUrl, API_HOST);
  return response.json();
}

function collectUrlRecords(node, keyPath = [], output = []) {
  if (!node || typeof node !== "object") return output;
  if (typeof node.url === "string") output.push({ record: node, keyPath });
  for (const [key, value] of Object.entries(node)) {
    if (key === "url" || value == null || typeof value !== "object") continue;
    collectUrlRecords(value, [...keyPath, key], output);
  }
  return output;
}

function decodedBasename(rawUrl) {
  return decodeURIComponent(path.posix.basename(new URL(rawUrl).pathname));
}

function recordText(entry) {
  return `${entry.keyPath.join("/")}/${decodedBasename(entry.record.url)}`.toLowerCase();
}

function scoreResolution(entry, preferred) {
  const text = recordText(entry);
  if (text.includes(`/${preferred}/`) || text.includes(`_${preferred}.`) || text.includes(`${preferred}_`)) return 80;
  return 0;
}

function chooseModelEntry(fileTree) {
  const candidates = collectUrlRecords(fileTree).filter(entry => /\.gltf(?:$|\?)/i.test(entry.record.url));
  if (!candidates.length) throw new Error("Poly Haven response contains no glTF source");
  candidates.sort((a, b) => {
    const score = entry => scoreResolution(entry, "1k") + (recordText(entry).includes("gltf") ? 20 : 0) - Number(entry.record.size || 0) / 1e9;
    return score(b) - score(a);
  });
  return candidates[0];
}

function chooseHdriEntry(fileTree) {
  const candidates = collectUrlRecords(fileTree).filter(entry => /\.hdr(?:$|\?)/i.test(entry.record.url));
  if (!candidates.length) throw new Error("Poly Haven response contains no HDR source");
  candidates.sort((a, b) => {
    const score = entry => scoreResolution(entry, "2k") * 2 + scoreResolution(entry, "1k") - Number(entry.record.size || 0) / 1e9;
    return score(b) - score(a);
  });
  return candidates[0];
}

function textureChannel(text) {
  if (/(^|[\/_-])(diff|diffuse)([\/_\-.]|$)/i.test(text)) return "diffuse";
  if (/(nor[_-]?gl|normal[_-]?(gl|opengl))/i.test(text)) return "normal";
  if (/(^|[\/_-])rough([\/_\-.]|$)/i.test(text)) return "roughness";
  return null;
}

function chooseTextureEntries(fileTree) {
  const candidates = collectUrlRecords(fileTree).filter(entry => /\.(?:jpg|jpeg|png)(?:$|\?)/i.test(entry.record.url));
  const selected = [];
  for (const channel of ["diffuse", "normal", "roughness"]) {
    const matches = candidates.filter(entry => textureChannel(recordText(entry)) === channel);
    if (!matches.length) throw new Error(`Poly Haven response contains no ${channel} texture map`);
    matches.sort((a, b) => {
      const score = entry => scoreResolution(entry, "1k") * 2
        + (/\.jpg(?:$|\?)/i.test(entry.record.url) ? 8 : 4)
        - Number(entry.record.size || 0) / 1e9;
      return score(b) - score(a);
    });
    selected.push(matches[0]);
  }
  return selected;
}

async function downloadRecord(entry, destination) {
  const response = await fetchChecked(entry.record.url, DOWNLOAD_HOST);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error(`Downloaded empty file from ${entry.record.url}`);
  if (entry.record.md5) {
    const md5 = createHash("md5").update(bytes).digest("hex");
    if (md5 !== String(entry.record.md5).toLowerCase()) {
      throw new Error(`MD5 mismatch for ${entry.record.url}`);
    }
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  return bytes;
}

function relativeFromRoot(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join("/");
}

async function hashLocalFile(absolutePath) {
  const bytes = await readFile(absolutePath);
  return {
    path: relativeFromRoot(absolutePath),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength
  };
}

async function walkFiles(absoluteRoot) {
  const output = [];
  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile() && (await stat(full)).size > 0) output.push(await hashLocalFile(full));
    }
  }
  await visit(absoluteRoot);
  return output.sort((a, b) => a.path.localeCompare(b.path));
}

function dependencyUris(gltf) {
  const uris = new Set();
  for (const buffer of gltf.buffers ?? []) if (buffer?.uri && !buffer.uri.startsWith("data:")) uris.add(buffer.uri);
  for (const image of gltf.images ?? []) if (image?.uri && !image.uri.startsWith("data:")) uris.add(image.uri);
  return [...uris];
}

function findDependencyRecord(records, uri) {
  const normalized = decodeURIComponent(uri).replaceAll("\\", "/");
  const wantedBase = path.posix.basename(normalized);
  const exact = records.find(entry => decodeURIComponent(entry.keyPath.join("/")).endsWith(normalized));
  if (exact) return exact;
  return records.find(entry => decodedBasename(entry.record.url) === wantedBase) ?? null;
}

async function vendorModel(id, fileTree, targetDir) {
  const primary = chooseModelEntry(fileTree);
  const primaryName = decodedBasename(primary.record.url);
  const primaryPath = path.join(targetDir, primaryName);
  const bytes = await downloadRecord(primary, primaryPath);
  const gltf = JSON.parse(bytes.toString("utf8"));
  const allRecords = collectUrlRecords(fileTree);
  for (const uri of dependencyUris(gltf)) {
    const dependency = findDependencyRecord(allRecords, uri);
    if (!dependency) throw new Error(`${id}: unable to resolve glTF dependency ${uri}`);
    const safeRelative = decodeURIComponent(uri).replaceAll("\\", "/");
    if (safeRelative.startsWith("/") || safeRelative.split("/").includes("..")) {
      throw new Error(`${id}: unsafe glTF dependency path ${uri}`);
    }
    await downloadRecord(dependency, path.join(targetDir, safeRelative));
  }
  return primaryName;
}

async function vendorTexture(fileTree, targetDir) {
  const selected = chooseTextureEntries(fileTree);
  for (const entry of selected) {
    await downloadRecord(entry, path.join(targetDir, decodedBasename(entry.record.url)));
  }
  return decodedBasename(selected[0].record.url);
}

async function vendorHdri(fileTree, targetDir) {
  const selected = chooseHdriEntry(fileTree);
  const name = decodedBasename(selected.record.url);
  await downloadRecord(selected, path.join(targetDir, name));
  return name;
}

async function main() {
  await rm(VENDOR_DIR, { recursive: true, force: true });
  await mkdir(VENDOR_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });

  const metadataIndex = await fetchJson(ASSETS_API);
  const assets = [];

  for (const config of SELECTION) {
    const metadata = metadataIndex[config.id];
    if (!metadata) throw new Error(`Poly Haven asset not found: ${config.id}`);

    let localRootRel;
    let primaryFilename;
    if (config.existingLocalRoot) {
      localRootRel = `${config.existingLocalRoot}/`;
      const existingRoot = path.join(ROOT, config.existingLocalRoot);
      primaryFilename = path.basename((await walkFiles(existingRoot))[0]?.path ?? config.existingLocalRoot);
    } else {
      localRootRel = `${VENDOR_REL}/${config.id}/`;
      const targetDir = path.join(ROOT, VENDOR_REL, config.id);
      await mkdir(targetDir, { recursive: true });
      const fileTree = await fetchJson(`${FILES_API}${config.id}`);
      primaryFilename = config.kind === "model"
        ? await vendorModel(config.id, fileTree, targetDir)
        : config.kind === "texture"
          ? await vendorTexture(fileTree, targetDir)
          : await vendorHdri(fileTree, targetDir);
    }

    const localRootAbs = path.join(ROOT, localRootRel);
    const files = await walkFiles(localRootAbs);
    if (!files.length) throw new Error(`${config.id}: no local vendored files`);

    assets.push({
      id: config.id,
      role: config.role,
      kind: config.kind,
      source: {
        site: "Poly Haven",
        page: `https://polyhaven.com/a/${config.id}`,
        filesHash: metadata.files_hash ?? null
      },
      license: "CC0 1.0 Universal",
      authors: Object.keys(metadata.authors ?? {}).sort(),
      downloadedSourceFilename: primaryFilename,
      optimizedLocalFilename: files[0].path,
      local: {
        root: localRootRel,
        files
      },
      transformations: [...config.transformations]
    });
  }

  const manifest = {
    schemaVersion: 1,
    generatedBy: "scripts/home-v30/vendor-polyhaven.mjs",
    developmentSource: "Poly Haven public API",
    runtimeNetworkDependency: "none",
    assets
  };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Vendored ${assets.length} CC0 assets for Study Hub V30.`);
}

await main();
