import { element } from "../ui/components.js?v=20260827-1";
import { renderSourceRefs } from "./sources.js?v=20260827-1";
import { renderMicroQuestion } from "./micro-question.js?v=20260827-1";

const CALLOUT_TYPES = new Set(["example", "counterexample", "warning", "error", "key-concept", "note", "activation", "diagnostic-question", "formula", "checklist", "checkpoint"]);

export function chapterHref(lessonId, chapterId) { return `#/lessons/${lessonId}/${chapterId}`; }
export function lessonHref(lessonId, { chapterId = null, view = "chapter" } = {}) {
  const base = chapterId ? chapterHref(lessonId, chapterId) : `#/lessons/${lessonId}`;
  return view === "full" ? `${base}?view=full` : base;
}
export function selectVisibleChapters(model, activeChapterId = null, viewMode = "chapter") {
  if (viewMode === "full") return model.chapters;
  const active = model.chapters.find(chapter => chapter.id === activeChapterId);
  return active ? [active] : model.chapters.slice(0, 1);
}
export function assessmentHref(lessonId, chapterId = null) { return chapterId ? `#/lessons/${lessonId}/assessment/${chapterId}` : `#/lessons/${lessonId}/assessment`; }

function renderVisualization(block) {
  const wrap = element("figure", { className: `lesson-visualization viz-${block.visualization || "generic"}`, attrs: { "data-visualization": block.visualization || "generic" } });
  const stage = element("div", { className: "visualization-stage", attrs: { "aria-hidden": "true" } });
  const patterns = {
    "reach-impressions": ["Account A", "Account B", "Account A", "Account C", "Account B"],
    "watch-time": ["▶ 42s", "▶ 18s", "▶ 55s", "Σ 115s", "media 38s"],
    "causality": ["X cambia", "Y cambia", "? tema", "? periodo", "? distribuzione"],
    "test-design": ["Domanda", "Ipotesi", "Variabile", "Confronto", "Criterio"],
    "mini-report": ["Dato", "Baseline", "Interpretazione", "Limite", "Decisione", "Verifica"]
  };
  (patterns[block.visualization] || ["Osserva", "Confronta", "Interpreta"]).forEach((label, index) => stage.append(element("span", { className: "visualization-step", text: label, attrs: { style: `--step:${index}` } })));
  const toggle = element("button", { className: "visualization-control", text: "Avvia spiegazione", attrs: { type: "button", "aria-pressed": "false" } });
  toggle.addEventListener("click", () => {
    const running = wrap.classList.toggle("is-running");
    toggle.textContent = running ? "Pausa" : "Avvia spiegazione";
    toggle.setAttribute("aria-pressed", String(running));
  });
  wrap.append(stage, element("figcaption", {}, [element("b", { text: block.label || "Visualizzazione" }), element("p", { text: block.text || "" })]), toggle);
  return wrap;
}

function renderBlock(block, sources = []) {
  if (block.type === "visualization") return renderVisualization(block);
  if (block.type === "list") {
    const node = element(block.ordered ? "ol" : "ul", { className: "lesson-list" });
    for (const item of block.items || []) node.append(element("li", { text: item }));
    const refs = renderSourceRefs(block, sources);
    return refs ? element("div", { className: "sourced-block" }, [node, refs]) : node;
  }
  if (block.type === "subheading") return element(block.level === 3 ? "h4" : "h3", { className: "lesson-subheading", text: block.text });
  if (CALLOUT_TYPES.has(block.type)) {
    const node = element("div", { className: `lesson-callout callout-${block.type}` }, [element("span", { className: "callout-label", text: block.label ?? block.type.replaceAll("-", " ") }), element("p", { text: block.text })]);
    const refs = renderSourceRefs(block, sources);
    return refs ? element("div", { className: "sourced-block" }, [node, refs]) : node;
  }
  const node = element("p", { className: "lesson-paragraph", text: block.text || "" });
  const refs = renderSourceRefs(block, sources);
  return refs ? element("div", { className: "sourced-block" }, [node, refs]) : node;
}

function renderSection(section, chapter, model, handlers) {
  const sectionNode = element("section", { className: "lesson-section", attrs: { id: section.id, "data-section-id": section.id } }, [element("h3", { text: section.title })]);
  for (const block of section.blocks || []) {
    sectionNode.append(block.type === "micro-question"
      ? renderMicroQuestion(block, { lessonId: handlers.lessonId, chapterId: chapter.id, onReview: handlers.onReviewConcept, onConsolidate: handlers.onConsolidateConcept })
      : renderBlock(block, model.sources));
  }
  const noteButton = element("button", { className: "section-note-trigger", text: "+ Nota su questa sezione", attrs: { type: "button" } });
  noteButton.addEventListener("click", () => handlers.onSectionNote(chapter, section));
  sectionNode.append(noteButton);
  return sectionNode;
}

export function renderLesson(model, {
  lessonId, activeChapterId = null, completedChapterIds = new Set(), bookmarkedChapterIds = new Set(), viewMode = "chapter", assessmentEnabled = false,
  noteForChapter = () => "", onToggleChapter = () => {}, onToggleBookmark = () => {}, onNote = () => {}, onSectionNote = () => {}, onDeepen = () => {}, onReviewConcept = () => {}, onConsolidateConcept = () => {}
} = {}) {
  const layout = element("div", { className: "lesson-layout macro-layout" });
  const index = element("nav", { className: "chapter-index", attrs: { "aria-label": "Indice della lezione" } }, [element("p", { className: "eyebrow", text: "4 macro-capitoli" })]);
  const indexList = element("ol", { className: "chapter-index-list" });
  const content = element("article", { className: "lesson-content" }, [element("nav", { className: "lesson-view-switcher", attrs: { "aria-label": "Modalità di visualizzazione" } }, [
    element("a", { href: lessonHref(lessonId, { chapterId: activeChapterId }), text: "Un capitolo alla volta", className: viewMode === "chapter" ? "active" : "", attrs: viewMode === "chapter" ? { "aria-current": "page" } : {} }),
    element("a", { href: lessonHref(lessonId, { chapterId: activeChapterId, view: "full" }), text: "Lezione completa", className: viewMode === "full" ? "active" : "", attrs: viewMode === "full" ? { "aria-current": "page" } : {} })
  ])]);

  model.chapters.forEach((chapter, i) => {
    const active = chapter.id === activeChapterId;
    const link = element("a", { href: viewMode === "full" ? lessonHref(lessonId, { chapterId: chapter.id, view: "full" }) : chapterHref(lessonId, chapter.id), className: active ? "active" : "", attrs: active ? { "aria-current": "location" } : {} }, [
      element("span", { text: `${i + 1}/4` }), element("b", { text: chapter.title }), element("small", { text: chapter.estimated || "" })
    ]);
    const item = element("li", {}, link);
    if (active && chapter.sections?.length) {
      const sections = element("ul", { className: "section-index" });
      chapter.sections.forEach(section => sections.append(element("li", {}, element("a", { href: `${chapterHref(lessonId, chapter.id)}?section=${encodeURIComponent(section.id)}`, text: section.title }))));
      item.append(sections);
    }
    indexList.append(item);
  });

  for (const chapter of selectVisibleChapters(model, activeChapterId, viewMode)) {
    const i = model.chapters.findIndex(candidate => candidate.id === chapter.id);
    const completed = completedChapterIds.has(chapter.id);
    const bookmarked = bookmarkedChapterIds.has(chapter.id);
    const completion = element("button", { className: `chapter-completion${completed ? " is-complete" : ""}`, text: completed ? "✓ Completato" : "Segna come completato", attrs: { type: "button", "aria-pressed": String(completed) } });
    completion.addEventListener("click", () => onToggleChapter(chapter.id));
    const bookmark = element("button", { className: `chapter-action${bookmarked ? " is-active" : ""}`, text: bookmarked ? "★ Salvato" : "☆ Salva capitolo", attrs: { type: "button", "aria-pressed": String(bookmarked) } });
    bookmark.addEventListener("click", () => onToggleBookmark(chapter.id));
    const deepen = element("button", { className: "chapter-action", text: "Approfondisci ↗", attrs: { type: "button" } });
    deepen.addEventListener("click", () => onDeepen(chapter));
    const note = element("textarea", { className: "chapter-note", attrs: { rows: "3", placeholder: "Nota generale sul capitolo…", "aria-label": `Nota generale: ${chapter.title}` } });
    note.value = noteForChapter(chapter.id); note.addEventListener("input", () => onNote(chapter.id, note.value));
    const section = element("section", { className: "lesson-chapter macro-chapter", attrs: { id: chapter.id, "data-chapter-id": chapter.id } }, [
      element("div", { className: "chapter-kicker", text: `Capitolo ${i + 1} di 4 · ${chapter.estimated || ""}` }),
      element("h2", { text: chapter.title, attrs: { tabindex: "-1" } }),
      element("p", { className: "chapter-objective", text: chapter.objective || "" }),
      element("div", { className: "chapter-sections" }, (chapter.sections || []).map(s => renderSection(s, chapter, model, { lessonId, onSectionNote, onReviewConcept, onConsolidateConcept }))),
      element("div", { className: "chapter-actions" }, [completion, bookmark, deepen, assessmentEnabled ? element("a", { className: "chapter-action", text: "Esercitati sul capitolo", href: assessmentHref(lessonId, chapter.id) }) : null]),
      element("aside", { className: "personal-note legacy-note" }, [element("span", { className: "callout-label", text: "Nota generale · compatibile con la V3" }), note]),
      element("div", { className: "chapter-controls" }, [i > 0 ? element("a", { href: chapterHref(lessonId, model.chapters[i - 1].id), text: "← Capitolo precedente" }) : null, i < model.chapters.length - 1 ? element("a", { href: chapterHref(lessonId, model.chapters[i + 1].id), text: "Capitolo successivo →" }) : null])
    ]);
    content.append(section);
  }
  index.append(indexList); layout.append(index, content); return layout;
}
