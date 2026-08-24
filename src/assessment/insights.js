export function deriveAssessmentInsights(assessment, attempts) {
  const misses = new Map();
  const correctAfterMiss = new Map();
  const competencyValues = new Map();
  for (const attempt of attempts) {
    for (const [questionId, result] of Object.entries(attempt.result?.questions ?? {})) {
      if ((result.score ?? 0) < 0.6) misses.set(questionId, (misses.get(questionId) ?? 0) + 1);
      else if (misses.has(questionId)) correctAfterMiss.set(questionId, (correctAfterMiss.get(questionId) ?? 0) + 1);
    }
    for (const [competencyId, value] of Object.entries(attempt.result?.byCompetency ?? {})) {
      const values = competencyValues.get(competencyId) ?? [];
      values.push(value.percent ?? 0);
      competencyValues.set(competencyId, values);
    }
  }
  const recurringErrors = assessment.questions
    .filter(question => (misses.get(question.id) ?? 0) >= 2)
    .map(question => ({ questionId: question.id, misses: misses.get(question.id), chapterIds: question.chapterIds, competencyIds: question.competencyIds }));
  const priorities = new Map();
  for (const question of assessment.questions) {
    const missCount = misses.get(question.id) ?? 0;
    if (!missCount) continue;
    const priority = Math.max(0.25, missCount - (correctAfterMiss.get(question.id) ?? 0) * 0.5) * (question.weight ?? 1);
    for (const chapterId of question.chapterIds) priorities.set(chapterId, (priorities.get(chapterId) ?? 0) + priority);
  }
  const competencies = assessment.competencies.map(competency => {
    const values = competencyValues.get(competency.id) ?? [];
    const percent = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    return { ...competency, percent, status: percent >= 80 ? "solid" : percent >= 60 ? "improving" : "review" };
  });
  const reviewChapters = [...priorities].map(([chapterId, priority]) => ({ chapterId, priority })).sort((a, b) => b.priority - a.priority);
  return { recurringErrors, competencies, reviewChapters };
}

export function summarizeAssessmentProgress(attempts) {
  const moduleAttempts = attempts.filter(attempt => !attempt.chapterId);
  const latest = moduleAttempts.length ? moduleAttempts[moduleAttempts.length - 1].result?.total?.percent ?? 0 : null;
  const best = moduleAttempts.length ? Math.max(...moduleAttempts.map(attempt => attempt.result?.total?.percent ?? 0)) : null;
  return { latest, best, moduleAttempts: moduleAttempts.length, totalAttempts: attempts.length };
}
