const EDITORIAL_STATUSES = new Set(["draft", "review", "published"]);

export function normalizeLessonExperience(model = {}) {
  const status = EDITORIAL_STATUSES.has(model?.editorial?.status)
    ? model.editorial.status
    : "published";
  return {
    ...model,
    editorial: { ...model.editorial, status },
    sources: Array.isArray(model.sources) ? model.sources : [],
    chapters: Array.isArray(model.chapters) ? model.chapters : []
  };
}

export function isStudentVisibleLesson(model = {}) {
  return normalizeLessonExperience(model).editorial.status === "published";
}
