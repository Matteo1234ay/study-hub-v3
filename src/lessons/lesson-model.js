const EDITORIAL_STATUSES = new Set(["draft", "review", "published"]);

function normalizeSection(section = {}, index = 0) {
  return {
    id: section.id || `section-${index + 1}`,
    title: section.title || `Sezione ${index + 1}`,
    blocks: Array.isArray(section.blocks) ? section.blocks : [],
    ...section
  };
}

function normalizeChapter(chapter = {}) {
  if (!Array.isArray(chapter.sections)) return chapter;
  return { ...chapter, sections: chapter.sections.map(normalizeSection), blocks: Array.isArray(chapter.blocks) ? chapter.blocks : [] };
}

export function normalizeLessonExperience(model = {}) {
  const status = EDITORIAL_STATUSES.has(model?.editorial?.status) ? model.editorial.status : "published";
  return {
    ...model,
    editorial: { ...model.editorial, status },
    sources: Array.isArray(model.sources) ? model.sources : [],
    introduction: model.introduction ?? null,
    conclusion: model.conclusion ?? null,
    legacyMap: model.legacyMap && typeof model.legacyMap === "object" ? model.legacyMap : {},
    chapters: (Array.isArray(model.chapters) ? model.chapters : []).map(normalizeChapter)
  };
}

export function resolveLessonLocation(model = {}, requestedId = null) {
  const normalized = normalizeLessonExperience(model);
  if (!requestedId) return { chapterId: normalized.chapters[0]?.id ?? null, sectionId: null, legacy: false };
  for (const chapter of normalized.chapters) {
    if (chapter.id === requestedId) return { chapterId: chapter.id, sectionId: null, legacy: false };
    const section = (chapter.sections || []).find(candidate => candidate.id === requestedId);
    if (section) return { chapterId: chapter.id, sectionId: section.id, legacy: false };
  }
  const mapped = normalized.legacyMap[requestedId];
  if (mapped) return { chapterId: mapped.chapterId, sectionId: mapped.sectionId ?? null, legacy: true };
  return { chapterId: normalized.chapters[0]?.id ?? null, sectionId: null, legacy: false, missing: true };
}

export function isStudentVisibleLesson(model = {}) {
  return normalizeLessonExperience(model).editorial.status === "published";
}
