export function normalizeAnswer(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreOpenAnswer(question, answer) {
  const normalized = normalizeAnswer(answer);
  const concepts = question.requiredConcepts ?? [];
  const missingAll = concepts.map(concept => concept.id);
  if (!normalized) return { score: 0, status: "unanswered", matchedConcepts: [], missingConcepts: missingAll };
  const matched = concepts.filter(concept => concept.terms.some(term => normalized.includes(normalizeAnswer(term))));
  const matchedConcepts = matched.map(concept => concept.id);
  const missingConcepts = concepts.filter(concept => !matchedConcepts.includes(concept.id)).map(concept => concept.id);
  const score = concepts.length ? matched.length / concepts.length : 0;
  const status = score === 1 ? "correct" : score >= (question.partialThreshold ?? 0.5) ? "partial" : "review";
  return { score, status, matchedConcepts, missingConcepts };
}
