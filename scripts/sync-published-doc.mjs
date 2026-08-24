import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { classifyBlock } from "../src/lessons/classify-block.js";

export const PUBLISHED_SOURCES = Object.freeze({
  "SMM-01": {
    url: "https://docs.google.com/document/d/e/2PACX-1vRTVVkxYkCN8QwPRqR4Szdmr0mi4zJRCtasHz1Xw8bvF80nop9Y10VuSXhaNwl_UOUBizJUhAIgRo9F/pub",
    output: "data/lessons/SMM-01.json"
  }
});

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
    if (entity[0] !== "#") return named[entity.toLowerCase()] ?? `&${entity};`;
    const hexadecimal = entity[1]?.toLowerCase() === "x";
    const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
  });
}

function htmlLines(html) {
  const safe = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const body = safe.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? safe;
  return decodeEntities(body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, ""))
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function isChapterTitle(line, nextNumber) {
  const numbered = line.match(/^(\d+)\.\s+\S/);
  return line === "Obiettivo del modulo"
    || (numbered && Number(numbered[1]) === nextNumber)
    || /^Criterio di completamento\b/i.test(line)
    || /^Nota sulle piattaforme\b/i.test(line);
}

export function parsePublishedDocument(html) {
  const lines = htmlLines(html);
  const title = lines.find((line) => /^SMM-\d+\b/i.test(line))
    ?? decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Lezione senza titolo").trim();
  const chapters = [];
  const slugCounts = new Map();
  let current = null;
  let nextChapterNumber = 1;

  const slug = (value) => {
    const base = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "capitolo";
    const count = (slugCounts.get(base) ?? 0) + 1;
    slugCounts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  for (const line of lines) {
    if (line === title) continue;
    if (isChapterTitle(line, nextChapterNumber)) {
      current = { id: slug(line), title: line, blocks: [] };
      chapters.push(current);
      const numbered = line.match(/^(\d+)\./);
      if (numbered) nextChapterNumber = Number(numbered[1]) + 1;
      continue;
    }
    if (!current) continue;
    const bullet = line.match(/^[•●▪◦-]\s*(.+)$/);
    if (bullet) {
      const previous = current.blocks.at(-1);
      if (previous?.type === "list") previous.items.push(bullet[1]);
      else current.blocks.push({ type: "list", ordered: false, items: [bullet[1]] });
      continue;
    }
    current.blocks.push(classifyBlock({ kind: "paragraph", text: line }));
  }
  return { title, chapters };
}

export async function syncPublishedSources(fetchImpl = fetch) {
  const results = [];
  for (const [lessonId, source] of Object.entries(PUBLISHED_SOURCES)) {
    const response = await fetchImpl(source.url, { redirect: "follow" });
    if (!response.ok) throw new Error(`Sync ${lessonId} failed with HTTP ${response.status}`);
    const lesson = parsePublishedDocument(await response.text());
    if (!lesson.chapters.length) throw new Error(`Sync ${lessonId} produced no chapters`);
    const next = `${JSON.stringify({ ...lesson, syncedAt: new Date().toISOString(), sourceUrl: source.url }, null, 2)}\n`;
    await mkdir(source.output.split("/").slice(0, -1).join("/"), { recursive: true });
    let previous = "";
    try { previous = await readFile(source.output, "utf8"); } catch {}
    const comparable = (value) => value.replace(/"syncedAt":\s*"[^"]+",?\n?/g, "");
    if (comparable(previous) !== comparable(next)) await writeFile(source.output, next, "utf8");
    results.push({ lessonId, changed: comparable(previous) !== comparable(next), chapters: lesson.chapters.length });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await syncPublishedSources();
  process.stdout.write(`${JSON.stringify(results)}\n`);
}
