import { element } from "../ui/components.js";

const CALLOUT_TYPES = new Set([
  "example", "warning", "error", "key-concept", "note",
  "diagnostic-question", "formula", "checklist", "checkpoint"
]);

export function chapterHref(lessonId, chapterId) {
  return `#/lessons/${lessonId}/${chapterId}`;
}

export function assessmentHref(lessonId, chapterId = null) {
  return chapterId ? `#/lessons/${lessonId}/assessment/${chapterId}` : `#/lessons/${lessonId}/assessment`;
}

export function blockPresentation(block) {
  if (block.type === "subheading") {
    return { tag: block.level === 3 ? "h4" : "h3", className: "lesson-subheading" };
  }
  if (block.type === "list") return { tag: block.ordered ? "ol" : "ul", className: "lesson-list" };
  if (CALLOUT_TYPES.has(block.type)) {
    return { tag: "div", className: `lesson-callout callout-${block.type}` };
  }
  return { tag: "p", className: "lesson-paragraph" };
}

function renderBlock(block) {
  const presentation = blockPresentation(block);
  const node = element(presentation.tag, { className: presentation.className });

  if (block.type === "list") {
    for (const item of block.items) node.append(element("li", { text: item }));
    return node;
  }
  if (CALLOUT_TYPES.has(block.type)) {
    node.append(
      element("span", { className: "callout-label", text: block.label ?? block.type.replaceAll("-", " ") }),
      element("p", { text: block.text })
    );
    return node;
  }
  node.textContent = block.text;
  return node;
}

export function renderLesson(model, {
  lessonId, activeChapterId = null, completedChapterIds = new Set(), bookmarkedChapterIds = new Set(),
  assessmentEnabled = false, noteForChapter = () => "", onToggleChapter = () => {}, onToggleBookmark = () => {}, onNote = () => {}, onDeepen = () => {}
} = {}) {
  const layout = element("div", { className: "lesson-layout" });
  const index = element("nav", { className: "chapter-index", attrs: { "aria-label": "Indice dei capitoli" } }, [
    element("p", { className: "eyebrow", text: "Indice capitoli" })
  ]);
  const indexList = element("ol", { className: "chapter-index-list" });
  const content = element("article", { className: "lesson-content" });

  model.chapters.forEach((chapter, indexNumber) => {
    const isCompleted = completedChapterIds.has(chapter.id);
    const isBookmarked = bookmarkedChapterIds.has(chapter.id);
    const href = chapterHref(lessonId, chapter.id);
    const indexLink = element("a", {
      href,
      className: chapter.id === activeChapterId ? "active" : "",
      attrs: chapter.id === activeChapterId ? { "aria-current": "location" } : {}
    }, [
      element("span", { text: String(indexNumber + 1).padStart(2, "0") }),
      element("b", { text: chapter.title })
    ]);
    indexList.append(element("li", {}, indexLink));

    const heading = element("h2", { text: chapter.title, attrs: { tabindex: "-1" } });
    const completionButton = element("button", {
      className: `chapter-completion${isCompleted ? " is-complete" : ""}`,
      text: isCompleted ? "✓ Completato" : "Segna come completato",
      attrs: { type: "button", "aria-pressed": String(isCompleted) }
    });
    completionButton.addEventListener("click", () => onToggleChapter(chapter.id));
    const bookmarkButton = element("button", {
      className: `chapter-action${isBookmarked ? " is-active" : ""}`,
      text: isBookmarked ? "★ Salvato" : "☆ Salva capitolo",
      attrs: { type: "button", "aria-pressed": String(isBookmarked) }
    });
    bookmarkButton.addEventListener("click", () => onToggleBookmark(chapter.id));
    const deepenButton = element("button", { className: "chapter-action", text: "Approfondisci ↗", attrs: { type: "button" } });
    deepenButton.addEventListener("click", () => onDeepen(chapter));
    const note = element("textarea", { className: "chapter-note", attrs: { rows: "4", placeholder: "Scrivi una nota personale…", "aria-label": `Note personali: ${chapter.title}` } });
    note.value = noteForChapter(chapter.id);
    note.addEventListener("input", () => onNote(chapter.id, note.value));
    const assessmentLink = assessmentEnabled ? element("a", { className: "chapter-action", text: "Esercitati sul capitolo", href: assessmentHref(lessonId, chapter.id) }) : null;
    const section = element("section", {
      className: "lesson-chapter",
      attrs: { id: chapter.id, "data-chapter-id": chapter.id }
    }, [
      element("div", { className: "chapter-number", text: String(indexNumber + 1).padStart(2, "0") }),
      heading,
      element("div", { className: "chapter-blocks" }, chapter.blocks.map(renderBlock)),
      element("div", { className: "chapter-actions" }, [completionButton, bookmarkButton, deepenButton, assessmentLink]),
      element("aside", { className: "personal-note" }, [
        element("span", { className: "callout-label", text: "Appunti personali · solo su questo dispositivo" }), note
      ]),
      element("div", { className: "chapter-controls" }, [
        indexNumber > 0 ? element("a", { href: chapterHref(lessonId, model.chapters[indexNumber - 1].id), text: "← Capitolo precedente" }) : null,
        indexNumber < model.chapters.length - 1 ? element("a", { href: chapterHref(lessonId, model.chapters[indexNumber + 1].id), text: "Capitolo successivo →" }) : null
      ])
    ]);
    content.append(section);
  });
  index.append(indexList);
  layout.append(index, content);
  return layout;
}
