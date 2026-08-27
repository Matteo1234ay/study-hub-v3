import { element } from "../ui/components.js?v=20260827-1";
import { renderSourceRefs } from "./sources.js?v=20260827-1";
import { renderMicroQuestion } from "./micro-question.js?v=20260827-1";

const CALLOUT_TYPES = new Set([
  "example", "warning", "error", "key-concept", "note",
  "diagnostic-question", "formula", "checklist", "checkpoint"
]);

export function chapterHref(lessonId, chapterId) {
  return `#/lessons/${lessonId}/${chapterId}`;
}

export function lessonHref(lessonId, { chapterId = null, view = "chapter" } = {}) {
  const base = chapterId ? chapterHref(lessonId, chapterId) : `#/lessons/${lessonId}`;
  return view === "full" ? `${base}?view=full` : base;
}

export function selectVisibleChapters(model, activeChapterId = null, viewMode = "chapter") {
  if (viewMode === "full") return model.chapters;
  const active = model.chapters.find(chapter => chapter.id === activeChapterId);
  return active ? [active] : model.chapters.slice(0, 1);
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

function renderBlock(block, sources = []) {
  const presentation = blockPresentation(block);
  const node = element(presentation.tag, { className: presentation.className });

  if (block.type === "list") {
    for (const item of block.items) node.append(element("li", { text: item }));
    const sourceRefs = renderSourceRefs(block, sources);
    return sourceRefs ? element("div", { className: "sourced-block" }, [node, sourceRefs]) : node;
  }
  if (CALLOUT_TYPES.has(block.type)) {
    node.append(
      element("span", { className: "callout-label", text: block.label ?? block.type.replaceAll("-", " ") }),
      element("p", { text: block.text })
    );
    const sourceRefs = renderSourceRefs(block, sources);
    return sourceRefs ? element("div", { className: "sourced-block" }, [node, sourceRefs]) : node;
  }
  node.textContent = block.text;
  const sourceRefs = renderSourceRefs(block, sources);
  return sourceRefs ? element("div", { className: "sourced-block" }, [node, sourceRefs]) : node;
}

export function renderLesson(model, {
  lessonId, activeChapterId = null, completedChapterIds = new Set(), bookmarkedChapterIds = new Set(),
  viewMode = "chapter", assessmentEnabled = false, noteForChapter = () => "", onToggleChapter = () => {}, onToggleBookmark = () => {}, onNote = () => {}, onDeepen = () => {}, onReviewConcept = () => {}, onConsolidateConcept = () => {}
} = {}) {
  const layout = element("div", { className: "lesson-layout" });
  const index = element("nav", { className: "chapter-index", attrs: { "aria-label": "Indice dei capitoli" } }, [
    element("p", { className: "eyebrow", text: "Indice capitoli" })
  ]);
  const indexList = element("ol", { className: "chapter-index-list" });
  const content = element("article", { className: "lesson-content" }, [
    element("nav", { className: "lesson-view-switcher", attrs: { "aria-label": "Modalità di visualizzazione" } }, [
      element("a", {
        href: lessonHref(lessonId, { chapterId: activeChapterId }),
        text: "Un capitolo alla volta",
        className: viewMode === "chapter" ? "active" : "",
        attrs: viewMode === "chapter" ? { "aria-current": "page" } : {}
      }),
      element("a", {
        href: lessonHref(lessonId, { chapterId: activeChapterId, view: "full" }),
        text: "Lezione completa",
        className: viewMode === "full" ? "active" : "",
        attrs: viewMode === "full" ? { "aria-current": "page" } : {}
      })
    ])
  ]);

  model.chapters.forEach((chapter, indexNumber) => {
    const isCompleted = completedChapterIds.has(chapter.id);
    const isBookmarked = bookmarkedChapterIds.has(chapter.id);
    const href = chapterHref(lessonId, chapter.id);
    const indexLink = element("a", {
      href: viewMode === "full" ? lessonHref(lessonId, { chapterId: chapter.id, view: "full" }) : href,
      className: chapter.id === activeChapterId ? "active" : "",
      attrs: chapter.id === activeChapterId ? { "aria-current": "location" } : {}
    }, [
      element("span", { text: String(indexNumber + 1).padStart(2, "0") }),
      element("b", { text: chapter.title })
    ]);
    indexList.append(element("li", {}, indexLink));

  });

  selectVisibleChapters(model, activeChapterId, viewMode).forEach((chapter) => {
    const indexNumber = model.chapters.findIndex(candidate => candidate.id === chapter.id);
    const isCompleted = completedChapterIds.has(chapter.id);
    const isBookmarked = bookmarkedChapterIds.has(chapter.id);
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
      element("div", { className: "chapter-blocks" }, chapter.blocks.map(block => block.type === "micro-question"
        ? renderMicroQuestion(block, { lessonId, chapterId: chapter.id, onReview: onReviewConcept, onConsolidate: onConsolidateConcept })
        : renderBlock(block, model.sources))),
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
