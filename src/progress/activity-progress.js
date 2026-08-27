function questionIds(chapter = {}) {
  return (chapter.sections ?? []).flatMap(section => (section.blocks ?? []).filter(block => block.type === "micro-question" && block.id).map(block => block.id));
}
export function chapterActivityState(chapter, activity = {}) {
  const sectionIds = (chapter.sections ?? []).map(section => section.id).filter(Boolean);
  const questions = questionIds(chapter);
  const visited = new Set(activity.visitedSections ?? []), answered = new Set(activity.answeredQuestions ?? []);
  const sectionsDone = sectionIds.filter(id => visited.has(id)).length;
  const questionsDone = questions.filter(id => answered.has(id)).length;
  return { sectionsDone, sectionsTotal: sectionIds.length, questionsDone, questionsTotal: questions.length, complete: sectionsDone === sectionIds.length && questionsDone === questions.length };
}
export function isChapterActivityComplete(chapter, activity) { return chapterActivityState(chapter, activity).complete; }
