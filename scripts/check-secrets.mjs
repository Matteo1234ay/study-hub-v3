import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const assignmentNames = ["client", "access", "refresh", "api", "private"]
  .map((name) => `${name}[_-]?(?:secret|token|key)`)
  .join("|");
const patterns = [
  new RegExp(`(?:${assignmentNames})\\s*[:=]\\s*["']?[A-Za-z0-9_./+=-]{12,}`, "i"),
  new RegExp(["AIza", "[0-9A-Za-z_-]{20,}"].join("")),
  new RegExp(["ghp_", "[0-9A-Za-z]{20,}"].join("")),
  new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(""))
];

export function findPotentialSecrets(files) {
  const findings = [];
  for (const [path, content] of files) {
    content.split(/\r?\n/).forEach((line, index) => {
      if (patterns.some((pattern) => pattern.test(line))) findings.push({ path, line: index + 1 });
    });
  }
  return findings;
}

async function collectFiles(root, directory = root, files = new Map()) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(root, path, files);
    else if (!new Set([".png", ".jpg", ".jpeg", ".gif", ".zip", ".woff", ".woff2"]).has(extname(entry.name).toLowerCase())) {
      try { files.set(relative(root, path), await readFile(path, "utf8")); } catch {}
    }
  }
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = findPotentialSecrets(await collectFiles(process.cwd()));
  if (findings.length) {
    for (const finding of findings) console.error(`${finding.path}:${finding.line}: possibile segreto`);
    process.exitCode = 1;
  } else {
    console.log("Nessun possibile segreto rilevato.");
  }
}
