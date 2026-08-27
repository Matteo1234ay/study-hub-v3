const EDITORIAL_STATUSES = new Set(["draft", "review", "published"]);

export function normalizeLessonExperience(model = {}) {
  const status = EDITORIAL_STATUSES.has(model?.editorial?.status)
    ? model.editorial.status
    : "published";
  const chapters = Array.isArray(model.chapters)
    ? model.chapters.map(chapter => {
      if (!Object.hasOwn(chapter, "sections") && !Object.hasOwn(chapter, "legacyChapterIds")) return chapter;
      return {
        ...chapter,
        sections: Array.isArray(chapter.sections) ? chapter.sections : [],
        legacyChapterIds: Array.isArray(chapter.legacyChapterIds) ? chapter.legacyChapterIds : []
      };
    })
    : [];
  return {
    ...model,
    editorial: { ...model.editorial, status },
    sources: Array.isArray(model.sources) ? model.sources : [],
    chapters
  };
}

export function isStudentVisibleLesson(model = {}) {
  return normalizeLessonExperience(model).editorial.status === "published";
}
