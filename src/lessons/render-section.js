import { element } from "../ui/components.js?v=20260829-23";
import { renderSourceRefs } from "./sources.js?v=20260829-23";
import { renderMicroQuestion } from "./micro-question.js?v=20260829-23";
import { renderVisualization } from "../visualizations/visualization-registry.js?v=20260829-23";

const CALLOUT_TYPES = new Set([
  "example", "warning", "error", "key-concept", "note",
  "diagnostic-question", "formula", "checklist", "checkpoint",
  "guided-example", "counterexample", "application", "retrieval-synthesis"
]);

export function sectionHref(lessonId, chapterId, sectionId) {
  return `#/lessons/${lessonId}/${chapterId}?section=${sectionId}`;
}

export function sectionPresentation(block = {}) {
  if (block.type === "subheading") return { kind: "heading" };
  if (block.type === "list") return { kind: "list" };
  if (CALLOUT_TYPES.has(block.type)) return { kind: "callout" };
  if (block.type === "micro-question") return { kind: "question" };
  if (block.type === "visualization") return { kind: "visualization" };
  return { kind: "paragraph" };
}

export function blockPresentation(block = {}) {
  const kind = sectionPresentation(block).kind;
  if (kind === "heading") return { tag: block.level === 3 ? "h4" : "h3", className: "lesson-subheading" };
  if (kind === "list") return { tag: "ul", className: "lesson-list" };
  if (kind === "callout") return { tag: "div", className: `lesson-callout callout-${block.type}` };
  return { tag: "p", className: "lesson-paragraph" };
}

export function renderSectionBlock(block, sources = []) {
  const presentation = blockPresentation(block);
  const node = element(presentation.tag, { className: presentation.className });
  if (block.type === "list") {
    if (block.ordered) {
      const ordered = element("ol", { className: "lesson-list" });
      for (const item of block.items ?? []) ordered.append(element("li", { text: item }));
      const refs = renderSourceRefs(block, sources);
      return refs ? element("div", { className: "sourced-block" }, [ordered, refs]) : ordered;
    }
    for (const item of block.items ?? []) node.append(element("li", { text: item }));
  } else if (CALLOUT_TYPES.has(block.type)) {
    node.append(
      element("span", { className: "callout-label", text: block.label ?? block.type.replaceAll("-", " ") }),
      element("p", { text: block.text ?? "Contenuto da verificare" })
    );
  } else {
    node.textContent = block.text ?? "Contenuto da verificare";
  }
  const refs = renderSourceRefs(block, sources);
  return refs ? element("div", { className: "sourced-block" }, [node, refs]) : node;
}

export function renderSection(section, {
  lessonId,
  chapterId,
  sources = [],
  reducedMotion = false,
  onReviewConcept = () => {},
  onConsolidateConcept = () => {}
} = {}) {
  const headingId = `${section.id}-title`;
  const body = element("div", { className: "section-blocks" });
  for (const block of section.blocks ?? []) {
    if (block.type === "micro-question") {
      body.append(renderMicroQuestion(block, {
        lessonId, chapterId, onReview: onReviewConcept, onConsolidate: onConsolidateConcept
      }));
    } else if (block.type === "visualization") {
      body.append(renderVisualization(block, { reducedMotion }));
    } else {
      body.append(renderSectionBlock(block, sources));
    }
  }
  return element("section", {
    className: "lesson-section",
    attrs: { id: section.id, "data-section-id": section.id, "aria-labelledby": headingId }
  }, [
    element("h3", { className: "lesson-section-title", text: section.title, attrs: { id: headingId, tabindex: "-1" } }),
    body
  ]);
}
