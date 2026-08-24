export function buildQuestionPool({ manifest, assessments }) {
  const available = new Map(assessments.map(item => [item.lessonId, item.assessment]));
  const questions = [];
  const missingLessons = [];
  for (const lesson of manifest.lessons) {
    const assessment = available.get(lesson.lessonId);
    if (!assessment?.questions?.length) {
      missingLessons.push(lesson.lessonId);
      continue;
    }
    for (const question of assessment.questions) {
      questions.push({
        ...structuredClone(question),
        poolId: `${lesson.lessonId}::${question.id}`,
        lessonId: lesson.lessonId,
        assessmentVersion: assessment.version
      });
    }
  }
  return { questions, missingLessons, lessonIds: [...new Set(questions.map(item => item.lessonId))] };
}
