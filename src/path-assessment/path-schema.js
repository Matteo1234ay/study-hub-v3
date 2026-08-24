const VALID_STATUSES = new Set(["in-progress", "complete"]);

export function includeConfiguredLessons(manifest, lessons = []) {
  if (!manifest || typeof manifest !== "object") return manifest;
  const configured = lessons
    .filter(lesson => lesson?.id && lesson?.assessmentUrl)
    .map(lesson => ({ lessonId: lesson.id, assessmentUrl: lesson.assessmentUrl }));
  return { ...structuredClone(manifest), lessons: configured.length ? configured : structuredClone(manifest.lessons ?? []) };
}

export function validatePathAssessment(raw) {
  if (!raw || typeof raw !== "object" || !raw.id || !raw.pathId || !Number.isInteger(raw.version)) return null;
  if (!VALID_STATUSES.has(raw.status) || !Array.isArray(raw.lessons) || raw.lessons.length === 0) return null;
  if (!Array.isArray(raw.competencies) || raw.competencies.length === 0) return null;
  const lessonIds = raw.lessons.map(item => item?.lessonId);
  const competencyIds = raw.competencies.map(item => item?.id);
  if (lessonIds.some((id, index) => !id || !raw.lessons[index].assessmentUrl) || new Set(lessonIds).size !== lessonIds.length) return null;
  if (competencyIds.some((id, index) => !id || !raw.competencies[index].label) || new Set(competencyIds).size !== competencyIds.length) return null;
  if (raw.status === "complete" && !raw.competencies.some(item => item.mandatory)) return null;
  const min = raw.selection?.minQuestions;
  const max = raw.selection?.maxQuestions;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 50 || min > max) return null;
  const progressive = raw.thresholds?.progressive;
  const final = raw.thresholds?.final;
  if (![progressive?.solid, progressive?.good, progressive?.partial, final?.pass, final?.mandatoryMin].every(Number.isFinite)) return null;
  if (!(progressive.solid > progressive.good && progressive.good > progressive.partial)) return null;
  return structuredClone(raw);
}
