function seededRank(seed, value) {
  let hash = 2166136261 ^ Number(seed || 0);
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0) / 4294967296;
}

export function selectPathQuestions({ manifest, pool, seed, recentQuestionIds = [], weakCompetencyIds = [] }) {
  const target = Math.min(pool.questions.length, manifest.selection.minQuestions);
  const recent = new Set(recentQuestionIds);
  const weak = new Set(weakCompetencyIds);
  const uncoveredCompetencies = new Set(manifest.competencies.map(item => item.id));
  const uncoveredLessons = new Set(pool.lessonIds);
  const available = [...pool.questions];
  const questions = [];
  while (questions.length < target && available.length) {
    available.sort((a, b) => score(b) - score(a) || a.poolId.localeCompare(b.poolId));
    const chosen = available.shift();
    questions.push(chosen);
    uncoveredLessons.delete(chosen.lessonId);
    chosen.competencyIds?.forEach(id => uncoveredCompetencies.delete(id));
  }
  function score(question) {
    const competencies = question.competencyIds ?? [];
    return competencies.filter(id => uncoveredCompetencies.has(id)).length * 5
      + (uncoveredLessons.has(question.lessonId) ? 2 : 0)
      + competencies.filter(id => weak.has(id)).length * 0.75
      - (recent.has(question.poolId) ? 2 : 0)
      + seededRank(seed, question.poolId);
  }
  return {
    seed,
    questions,
    coverage: {
      lessonIds: [...new Set(questions.map(item => item.lessonId))],
      competencyIds: [...new Set(questions.flatMap(item => item.competencyIds ?? []))],
      missingLessons: pool.missingLessons
    }
  };
}
