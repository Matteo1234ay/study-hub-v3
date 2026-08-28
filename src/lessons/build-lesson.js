import { classifyBlock } from "./classify-block.js?v=20260828-15";
import { normalizeDocument } from "./normalize-doc.js?v=20260828-15";

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "capitolo";
}

function uniqueSlug(title, counts) {
  const base = slugify(title);
  const next = (counts.get(base) ?? 0) + 1;
  counts.set(base, next);
  return next === 1 ? base : `${base}-${next}`;
}

export function buildLesson(document) {
  const blocks = normalizeDocument(document);
  const nativeTitle = blocks.find((block) => block.kind === "title")?.text;
  const title = nativeTitle ?? document.title ?? "Lezione senza titolo";
  const content = blocks.filter((block) => block.kind !== "title");
  const chapters = [];
  const slugCounts = new Map();
  let current = null;

  const startChapter = (chapterTitle) => {
    current = {
      id: uniqueSlug(chapterTitle, slugCounts),
      title: chapterTitle,
      blocks: []
    };
    chapters.push(current);
  };

  for (const block of content) {
    if (block.kind === "heading-1") {
      startChapter(block.text);
      continue;
    }
    if (!current) startChapter("Introduzione");
    if (block.kind === "heading-2" || block.kind === "heading-3") {
      current.blocks.push({ type: "subheading", level: block.kind === "heading-2" ? 2 : 3, text: block.text });
    } else {
      current.blocks.push(classifyBlock(block));
    }
  }

  return { title, chapters };
}
