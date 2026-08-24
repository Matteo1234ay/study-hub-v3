const TYPES = new Set(["single-choice", "boolean", "open", "scenario"]);

function strings(value) {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === "string" && item.trim());
}

function validQuestion(question) {
  if (!question || typeof question.id !== "string" || !TYPES.has(question.type)) return false;
  if (!strings(question.chapterIds) || !strings(question.competencyIds)) return false;
  if (typeof question.prompt !== "string" || !question.prompt.trim() || typeof question.explanation !== "string" || !question.explanation.trim()) return false;
  if (question.type === "boolean") return typeof question.correct === "boolean";
  if (question.type === "single-choice") return Array.isArray(question.options) && question.options.length >= 2 && question.options.every(option => typeof option.id === "string" && typeof option.text === "string") && question.options.some(option => option.id === question.correct);
  if (question.type === "open" || question.type === "scenario") {
    return Array.isArray(question.requiredConcepts) && question.requiredConcepts.length > 0 && question.requiredConcepts.every(concept => typeof concept.id === "string" && typeof concept.label === "string" && strings(concept.terms)) && typeof question.modelAnswer === "string";
  }
  return false;
}

export function validateAssessment(value) {
  if (!value || typeof value.id !== "string" || typeof value.lessonId !== "string" || !Number.isInteger(value.version) || value.version < 1) return null;
  if (!Array.isArray(value.competencies) || value.competencies.some(item => !item || typeof item.id !== "string" || typeof item.label !== "string")) return null;
  if (!Array.isArray(value.questions) || !value.questions.length || value.questions.some(question => !validQuestion(question))) return null;
  const questionIds = value.questions.map(question => question.id);
  if (new Set(questionIds).size !== questionIds.length) return null;
  return {
    ...value,
    questions: value.questions.map(question => ({
      ...question,
      weight: Number.isFinite(question.weight) && question.weight > 0 ? question.weight : 1,
      partialThreshold: Number.isFinite(question.partialThreshold) ? Math.min(1, Math.max(0, question.partialThreshold)) : 0.5
    }))
  };
}
