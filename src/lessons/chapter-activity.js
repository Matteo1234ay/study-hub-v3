export function chapterCompletionEligibility(chapter = {}, activityState = {}) {
  const visited = new Set(activityState.visitedSections ?? []);
  const essentials = Array.isArray(chapter.essentialSectionIds) ? chapter.essentialSectionIds : [];
  return essentials.every(id => visited.has(id)) && activityState.exerciseAttempted === true;
}
