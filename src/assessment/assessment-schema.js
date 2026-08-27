const TYPES = new Set(["single-choice", "boolean", "open", "scenario"]);
const SMM01_MACRO_IDS = new Set(["misurare-cio-che-conta", "leggere-dati-piattaforme", "interpretare-senza-ingannarsi", "trasformare-dati-decisioni"]);

function strings(value) {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === "string" && item.trim());
}

function validQuestion(question) {
  if (!question || typeof question.id !== "string" || !TYPES.has(question.type)) return false;
  if (!strings(question.chapterIds) || !strings(question.competencyIds)) return false;
  if (typeof question.prompt !== "string" || !question.prompt.trim() || typeof question.explanation !== "string" || !question.explanation.trim()) return false;
  if (question.type === "boolean") return typeof question.correct === "boolean";
  if (question.type === "single-choice") return Array.isArray(question.options) && question.options.length >= 2 && question.options.every(option => typeof option.id === "string" && typeof option.text === "string") && question.options.some(option => option.id === question.correct);
  if (question.type === "open" || question.type === "scenario") return Array.isArray(question.requiredConcepts) && question.requiredConcepts.length > 0 && question.requiredConcepts.every(concept => typeof concept.id === "string" && typeof concept.label === "string" && strings(concept.terms)) && typeof question.modelAnswer === "string";
  return false;
}

function smm01MacroForLegacyId(id) {
  if (SMM01_MACRO_IDS.has(id)) return id;
  if (id === "obiettivo-del-modulo") return "misurare-cio-che-conta";
  const number = Number.parseInt(id, 10);
  if ([1, 9, 12].includes(number)) return "misurare-cio-che-conta";
  if ([2, 3, 4, 5, 6, 7].includes(number)) return "leggere-dati-piattaforme";
  if ([8, 10, 13].includes(number)) return "interpretare-senza-ingannarsi";
  if (Number.isFinite(number)) return "trasformare-dati-decisioni";
  return null;
}

function normalizeQuestion(question, lessonId) {
  let chapterIds = question.chapterIds;
  if (lessonId === "SMM-01") {
    const aliases = chapterIds.map(smm01MacroForLegacyId).filter(Boolean);
    chapterIds = [...new Set([...chapterIds, ...aliases])];
  }
  return {
    ...question,
    chapterIds,
    weight: Number.isFinite(question.weight) && question.weight > 0 ? question.weight : 1,
    partialThreshold: Number.isFinite(question.partialThreshold) ? Math.min(1, Math.max(0, question.partialThreshold)) : 0.5
  };
}

export function validateAssessment(value) {
  if (!value || typeof value.id !== "string" || typeof value.lessonId !== "string" || !Number.isInteger(value.version) || value.version < 1) return null;
  if (!Array.isArray(value.competencies) || value.competencies.some(item => !item || typeof item.id !== "string" || typeof item.label !== "string")) return null;
  if (!Array.isArray(value.questions) || !value.questions.length || value.questions.some(question => !validQuestion(question))) return null;
  const questionIds = value.questions.map(question => question.id);
  if (new Set(questionIds).size !== questionIds.length) return null;
  return { ...value, questions: value.questions.map(question => normalizeQuestion(question, value.lessonId)) };
}
